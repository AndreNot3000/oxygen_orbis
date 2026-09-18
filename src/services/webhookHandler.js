import { verifyPaystackSignature } from '../lib/security.js';
import { formatKoboAmount } from './paystackService.js';

/**
 * 🔒 SECURE PAYSTACK WEBHOOK PROCESSING & RECONCILIATION SERVICE
 * Implements strict HMAC-SHA512 verification, underpayment defense,
 * idempotency checks, atomic room assignment, and dispatch triggering.
 */

/**
 * Processes incoming webhook requests from Paystack.
 * 
 * @param {Object} params
 * @param {string|Buffer} params.rawBody - Raw unparsed HTTP body string
 * @param {string} params.signatureHeader - 'x-paystack-signature' header
 * @param {string} params.secretKey - PAYSTACK_SECRET_KEY
 * @param {Object} [params.store] - Database repository or in-memory store
 * @param {Function} [params.onDispatch] - Callback to trigger WhatsApp/Email dispatcher
 * @returns {Promise<Object>} Status code and reconciliation result
 */
export async function processPaystackWebhook({
  rawBody,
  signatureHeader,
  secretKey,
  store,
  onDispatch,
}) {
  // 1. Mandatory Cryptographic Signature Verification
  if (!rawBody || !signatureHeader || !secretKey) {
    return {
      statusCode: 401,
      success: false,
      error: 'Unauthorized: Missing webhook body, signature, or server secret.',
    };
  }

  const isValidSignature = verifyPaystackSignature(rawBody, signatureHeader, secretKey);
  if (!isValidSignature) {
    return {
      statusCode: 401,
      success: false,
      error: 'Unauthorized: Cryptographic HMAC-SHA512 signature mismatch. Untrusted sender.',
    };
  }

  // 2. Parse payload safely
  let payload;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (err) {
    return {
      statusCode: 400,
      success: false,
      error: 'Bad Request: Malformed JSON body in webhook request.',
    };
  }

  const { event, data } = payload || {};

  // 3. Event filtering: We only process 'charge.success'
  if (event !== 'charge.success') {
    return {
      statusCode: 200,
      success: true,
      message: `Ignored unhandled event type: ${event}`,
    };
  }

  if (!data || !data.reference) {
    return {
      statusCode: 400,
      success: false,
      error: 'Bad Request: Missing transaction data or reference in charge.success payload.',
    };
  }

  const { reference, amount: amountKobo, currency, channel, paid_at } = data;

  // 4. Booking lookup (using provided store or mock registry)
  if (!store || typeof store.findBookingByReference !== 'function') {
    return {
      statusCode: 500,
      success: false,
      error: 'Internal Configuration Error: Booking store not provided.',
    };
  }

  const booking = await store.findBookingByReference(reference);
  if (!booking) {
    return {
      statusCode: 404,
      success: false,
      error: `Booking with reference ${reference} not found in resort registry.`,
    };
  }

  // 5. Underpayment & Tamper Defense
  // Hackers may attempt to pay ₦100 instead of ₦100,000 using forged clients
  if (amountKobo < booking.total_amount_kobo) {
    // Record security alert and reject confirmation
    if (typeof store.recordFraudAlert === 'function') {
      await store.recordFraudAlert({
        booking_id: booking.id,
        expectedKobo: booking.total_amount_kobo,
        receivedKobo: amountKobo,
        reference,
        gateway: 'paystack',
      });
    }

    return {
      statusCode: 400,
      success: false,
      error: `Security Exception: Underpayment detected. Expected ${booking.total_amount_kobo} kobo, received ${amountKobo} kobo.`,
    };
  }

  // 6. Idempotency Check: Don't process twice if webhook is re-sent
  if (booking.status === 'CONFIRMED') {
    return {
      statusCode: 200,
      success: true,
      message: 'Booking is already confirmed (Idempotent call).',
      booking,
    };
  }

  // 7. Atomic Room Assignment & State Transition
  let assignedRoomUnit = null;
  if (typeof store.allocateRoomUnit === 'function') {
    assignedRoomUnit = await store.allocateRoomUnit(booking.room_type_id);
  }

  const updatedBooking = await store.updateBookingStatus({
    bookingId: booking.id,
    status: 'CONFIRMED',
    roomUnitId: assignedRoomUnit ? assignedRoomUnit.id : null,
    paymentMethod: 'paystack',
    paidAt: paid_at || new Date().toISOString(),
  });

  // 8. Record in payments ledger
  let paymentRecord = null;
  if (typeof store.recordPayment === 'function') {
    paymentRecord = await store.recordPayment({
      bookingId: booking.id,
      amountKobo,
      currency: currency || 'NGN',
      gateway: 'paystack',
      transactionReference: reference,
      channel: channel || 'card',
      status: 'SUCCESS',
      rawPayload: data,
    });
  }

  // 9. Prepare Notification Dispatch
  const dispatchPayload = {
    type: 'BOOKING_CONFIRMED',
    bookingRef: reference,
    guestName: booking.guest_name,
    guestPhone: booking.guest_phone,
    guestEmail: booking.guest_email,
    roomTypeName: booking.room_type_name || 'Deluxe Suite',
    roomUnitNumber: assignedRoomUnit ? assignedRoomUnit.unit_number : 'Assigned at check-in',
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    amountFormatted: formatKoboAmount(amountKobo, currency),
    channel: channel || 'card',
  };

  if (typeof onDispatch === 'function') {
    await onDispatch(dispatchPayload);
  }

  return {
    statusCode: 200,
    success: true,
    message: 'Payment verified and reservation confirmed.',
    booking: updatedBooking,
    payment: paymentRecord,
    assignedUnit: assignedRoomUnit,
    dispatchPayload,
  };
}

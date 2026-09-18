import { query, withTransaction } from './db.js';
import { 
  sanitizeEmail, 
  sanitizePhoneNumber, 
  sanitizePlainText, 
  generateSecureBookingReference 
} from './security.js';

/**
 * 🏨 OXYGEN ORBIS CONCURRENCY & BOOKING ENGINE
 * Guaranteed ACID Concurrency, Row-level Inventory Locking,
 * Zero Double-Booking Protection, and Automated Hold Expirations.
 */

const HOLD_DURATION_MINUTES = 15;

/**
 * Validates travel date range strictly on the server.
 */
function validateBookingDates(checkInStr, checkOutStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('Invalid check-in or check-out date format.');
  }

  if (checkIn < today) {
    throw new Error('Check-in date cannot be in the past.');
  }

  if (checkOut <= checkIn) {
    throw new Error('Check-out date must be after check-in date.');
  }

  const diffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    throw new Error('Maximum stay duration is 30 consecutive nights.');
  }

  return { checkIn, checkOut, nights: diffDays };
}

/**
 * Checks real-time room availability for a specific room category and dates.
 * Considers both CONFIRMED bookings and active PENDING_PAYMENT holds.
 */
export async function checkRoomAvailability(roomTypeId, checkInStr, checkOutStr) {
  const { checkIn, checkOut, nights } = validateBookingDates(checkInStr, checkOutStr);

  const sql = `
    SELECT 
      rt.id AS room_type_id,
      rt.name AS room_name,
      rt.price_ngn,
      rt.price_usd,
      rt.max_guests,
      rt.total_rooms,
      COUNT(DISTINCT u.id) FILTER (
        WHERE u.status = 'AVAILABLE'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_unit_id = u.id
            AND (
              b.status IN ('CONFIRMED', 'CHECKED_IN')
              OR (b.status = 'PENDING_PAYMENT' AND b.hold_expires_at > NOW())
            )
            AND (b.check_in < $3 AND b.check_out > $2)
        )
      ) AS available_units_count
    FROM room_types rt
    LEFT JOIN room_units u ON u.room_type_id = rt.id
    WHERE rt.id = $1 AND rt.is_active = true
    GROUP BY rt.id;
  `;

  const result = await query(sql, [roomTypeId, checkIn, checkOut]);
  if (!result.rows.length) {
    throw new Error('Room category not found or inactive.');
  }

  const row = result.rows[0];
  const availableCount = parseInt(row.available_units_count || '0', 10);

  return {
    roomTypeId: row.room_type_id,
    roomName: row.room_name,
    priceNgn: row.price_ngn,
    priceUsd: row.price_usd,
    nights,
    availableUnitsCount: availableCount,
    isAvailable: availableCount > 0,
  };
}

/**
 * 🔒 ATOMIC RESERVATION HOLD CREATOR
 * Uses PostgreSQL 'SELECT ... FOR UPDATE SKIP LOCKED' to acquire a physical
 * room unit without race conditions. Holds room for 15 minutes while guest pays.
 */
export async function createReservationHold({
  roomTypeId,
  checkInStr,
  checkOutStr,
  guestsCount = 2,
  currency = 'NGN',
  guestData,
  selectedAddonIds = [],
  specialRequests = '',
}) {
  const { checkIn, checkOut, nights } = validateBookingDates(checkInStr, checkOutStr);

  // 1. Sanitize guest inputs defensively
  const cleanEmail = sanitizeEmail(guestData.email);
  const cleanPhone = sanitizePhoneNumber(guestData.phone);
  const cleanName = sanitizePlainText(guestData.fullName);
  const cleanRequests = sanitizePlainText(specialRequests);

  if (!cleanEmail) throw new Error('Invalid email address provided.');
  if (!cleanPhone) throw new Error('Invalid phone number provided. Must be a valid format.');
  if (!cleanName || cleanName.length < 3) throw new Error('Valid full name is required.');

  const selectedCurrency = currency === 'USD' ? 'USD' : 'NGN';

  return await withTransaction(async (client) => {
    // 2. Lock Room Type record for share
    const roomTypeRes = await client.query(
      `SELECT id, name, price_ngn, price_usd, max_guests FROM room_types WHERE id = $1 AND is_active = true FOR SHARE;`,
      [roomTypeId]
    );

    if (!roomTypeRes.rows.length) {
      throw new Error('Selected room type is invalid or currently unavailable.');
    }
    const roomType = roomTypeRes.rows[0];

    if (guestsCount > roomType.max_guests) {
      throw new Error(`Maximum guests for ${roomType.name} is ${roomType.max_guests}.`);
    }

    // 3. 🛡️ ATOMIC INVENTORY ACQUISITION
    // Find the first free physical room unit and lock that specific row
    const availableUnitRes = await client.query(
      `
      SELECT u.id, u.room_number
      FROM room_units u
      WHERE u.room_type_id = $1
        AND u.status = 'AVAILABLE'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.room_unit_id = u.id
            AND (
              b.status IN ('CONFIRMED', 'CHECKED_IN')
              OR (b.status = 'PENDING_PAYMENT' AND b.hold_expires_at > NOW())
            )
            AND (b.check_in < $3 AND b.check_out > $2)
        )
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
      `,
      [roomTypeId, checkIn, checkOut]
    );

    if (!availableUnitRes.rows.length) {
      throw new Error('All rooms in this tier were just reserved by other guests. Please select another room tier.');
    }
    const allocatedUnit = availableUnitRes.rows[0];

    // 4. Server-authoritative price calculation (never trust client amounts)
    const nightlyRate = selectedCurrency === 'USD' ? roomType.price_usd : roomType.price_ngn;
    const roomAmount = nightlyRate * nights;

    // Fetch and verify addon prices
    let addonsAmount = 0;
    const validatedAddons = [];

    if (selectedAddonIds.length > 0) {
      const addonsRes = await client.query(
        `SELECT id, name, price_ngn, price_usd FROM addons WHERE id = ANY($1) AND is_active = true;`,
        [selectedAddonIds]
      );

      for (const addon of addonsRes.rows) {
        const addonPrice = selectedCurrency === 'USD' ? addon.price_usd : addon.price_ngn;
        addonsAmount += addonPrice;
        validatedAddons.push({
          addonId: addon.id,
          name: addon.name,
          price: addonPrice,
        });
      }
    }

    const totalAmount = roomAmount + addonsAmount;

    // 5. Upsert Guest Record
    const guestRes = await client.query(
      `
      INSERT INTO guests (full_name, email, phone, whatsapp)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
        SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, updated_at = NOW()
      RETURNING id;
      `,
      [cleanName, cleanEmail, cleanPhone, cleanPhone]
    );
    const guestId = guestRes.rows[0].id;

    // 6. Generate Cryptographic Reference & 15-Min Expiration
    const bookingRef = generateSecureBookingReference();
    const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

    // 7. Insert Booking Record with Hold Lock
    const bookingRes = await client.query(
      `
      INSERT INTO bookings (
        booking_ref, guest_id, room_type_id, room_unit_id,
        check_in, check_out, guests_count, status, currency,
        room_amount, addons_amount, total_amount,
        special_requests, hold_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_PAYMENT', $8, $9, $10, $11, $12, $13)
      RETURNING id, booking_ref, hold_expires_at;
      `,
      [
        bookingRef,
        guestId,
        roomTypeId,
        allocatedUnit.id,
        checkIn,
        checkOut,
        guestsCount,
        selectedCurrency,
        roomAmount,
        addonsAmount,
        totalAmount,
        cleanRequests,
        holdExpiresAt,
      ]
    );
    const newBooking = bookingRes.rows[0];

    // 8. Insert Booking Addons
    for (const add of validatedAddons) {
      await client.query(
        `INSERT INTO booking_addons (booking_id, addon_id, quantity, unit_price, total_price) VALUES ($1, $2, 1, $3, $3);`,
        [newBooking.id, add.addonId, add.price]
      );
    }

    return {
      bookingId: newBooking.id,
      bookingRef: newBooking.booking_ref,
      holdExpiresAt: newBooking.hold_expires_at,
      roomUnitNumber: allocatedUnit.room_number,
      nights,
      currency: selectedCurrency,
      roomAmount,
      addonsAmount,
      totalAmount,
      guestName: cleanName,
      guestEmail: cleanEmail,
    };
  });
}

/**
 * ⏰ EXPIRED HOLD RELEASER
 * Releases any uncompleted holds older than 15 minutes back into available inventory.
 * Can be triggered on a recurring schedule or automatically prior to availability checks.
 */
export async function releaseExpiredHolds() {
  const sql = `
    UPDATE bookings
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'PENDING_PAYMENT'
      AND hold_expires_at <= NOW()
    RETURNING id, booking_ref, room_unit_id;
  `;

  const result = await query(sql);
  if (result.rows.length > 0) {
    console.log(`[INVENTORY RECOVERY] Released ${result.rows.length} expired reservation holds back to inventory.`);
  }
  return result.rows;
}

/**
 * 💳 ATOMIC PAYMENT CONFIRMATION
 * Confirms payment and permanently locks the room for the guest.
 */
export async function confirmBookingPayment({
  bookingRef,
  provider = 'PAYSTACK',
  providerReference,
  amountPaid,
  currency = 'NGN',
  paymentMethod = 'card',
  rawWebhookPayload = null,
}) {
  return await withTransaction(async (client) => {
    // 1. Lock booking row for update
    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE booking_ref = $1 FOR UPDATE;`,
      [bookingRef]
    );

    if (!bookingRes.rows.length) {
      throw new Error(`Booking ref ${bookingRef} not found.`);
    }
    const booking = bookingRes.rows[0];

    // Check if already confirmed (idempotency protection against duplicate webhooks)
    if (booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') {
      return { alreadyConfirmed: true, bookingRef: booking.booking_ref };
    }

    // Check if expired
    if (booking.status === 'EXPIRED') {
      throw new Error('This reservation hold has expired. Please initiate a new booking.');
    }

    // 2. Anti-fraud amount verification
    if (parseInt(amountPaid, 10) !== parseInt(booking.total_amount, 10)) {
      throw new Error(`SECURITY ALERT: Paid amount (${amountPaid}) does not match required total (${booking.total_amount}).`);
    }

    // 3. Record Audit Payment
    await client.query(
      `
      INSERT INTO payments (
        booking_id, provider, provider_reference, amount,
        currency, status, payment_method, paid_at, raw_webhook_payload
      ) VALUES ($1, $2, $3, $4, $5, 'SUCCESS', $6, NOW(), $7)
      ON CONFLICT (provider_reference) DO UPDATE 
        SET status = 'SUCCESS', updated_at = NOW();
      `,
      [
        booking.id,
        provider,
        providerReference,
        amountPaid,
        currency,
        paymentMethod,
        rawWebhookPayload ? JSON.stringify(rawWebhookPayload) : null,
      ]
    );

    // 4. Update Booking to CONFIRMED
    await client.query(
      `
      UPDATE bookings 
      SET status = 'CONFIRMED', hold_expires_at = NULL, updated_at = NOW()
      WHERE id = $1;
      `,
      [booking.id]
    );

    // 5. Fetch complete confirmed details for dispatch
    const fullBookingRes = await client.query(
      `
      SELECT 
        b.booking_ref, b.check_in, b.check_out, b.total_amount, b.currency,
        g.full_name AS guest_name, g.email AS guest_email, g.phone AS guest_phone,
        rt.name AS room_name, u.room_number
      FROM bookings b
      JOIN guests g ON g.id = b.guest_id
      JOIN room_types rt ON rt.id = b.room_type_id
      LEFT JOIN room_units u ON u.id = b.room_unit_id
      WHERE b.id = $1;
      `,
      [booking.id]
    );

    return {
      success: true,
      booking: fullBookingRes.rows[0],
    };
  });
}

/**
 * 💳 PAYSTACK CLIENT-SIDE CHECKOUT SERVICE
 * Handles Paystack Inline script loading, transaction initialization,
 * multi-channel payment handling (Card, Bank Transfer, USSD), and sandbox simulation.
 */

const PAYSTACK_INLINE_URL = 'https://js.paystack.co/v1/inline.js';

// Default public key fallback for test environments
export const DEFAULT_PAYSTACK_PUBLIC_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) || 
  'pk_test_oxygen_orbis_resort_moniya';

/**
 * Loads the Paystack Inline JS script dynamically into the DOM if not present.
 * @returns {Promise<boolean>} Resolves true when window.PaystackPop is available
 */
export function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    if (window.PaystackPop) {
      return resolve(true);
    }

    const existingScript = document.querySelector(`script[src="${PAYSTACK_INLINE_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', (e) => reject(new Error('Failed to load Paystack script')));
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Could not connect to Paystack payment gateway'));
    document.body.appendChild(script);
  });
}

/**
 * Converts a standard amount into the smallest currency unit (kobo for NGN, cents for USD).
 * @param {number} amount - Standard amount (e.g., 48000 for ₦48,000)
 * @returns {number} Amount in kobo/cents integer
 */
export function toKobo(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid payment amount. Must be a positive number.');
  }
  return Math.round(amount * 100);
}

/**
 * Formats a kobo value back into currency string for display.
 * @param {number} kobo 
 * @param {string} currency 
 * @returns {string}
 */
export function formatKoboAmount(kobo, currency = 'NGN') {
  const standard = (kobo / 100).toLocaleString();
  return currency === 'USD' ? `$${standard}` : `₦${standard}`;
}

/**
 * Initializes and triggers the Paystack Inline checkout modal.
 * Supports debit cards (Mastercard, Visa, Verve), dynamic bank transfer, and USSD.
 * 
 * @param {Object} options
 * @param {string} options.publicKey - Paystack Public Key
 * @param {string} options.email - Guest email address
 * @param {number} options.amount - Standard amount (will be converted to kobo)
 * @param {string} options.currency - 'NGN' or 'USD' (default: 'NGN')
 * @param {string} options.reference - Unique booking reference (e.g. OXY-748291)
 * @param {Object} [options.metadata] - Extra metadata (room, guest name, phone)
 * @param {Array<string>} [options.channels] - Supported channels
 * @param {Function} options.onSuccess - Callback on payment completion
 * @param {Function} options.onClose - Callback if guest dismisses payment popup
 * @param {Function} [options.onError] - Callback on initialization error
 */
export async function initializePaystackCheckout({
  publicKey = DEFAULT_PAYSTACK_PUBLIC_KEY,
  email,
  amount,
  currency = 'NGN',
  reference,
  metadata = {},
  channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  onSuccess,
  onClose,
  onError,
}) {
  try {
    if (!email || !amount || !reference) {
      throw new Error('Missing required Paystack checkout parameters (email, amount, reference).');
    }

    const amountInKobo = toKobo(amount);

    // Try to load Paystack Pop script
    const loaded = await loadPaystackScript();

    if (loaded && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amountInKobo,
        currency,
        ref: reference,
        channels,
        metadata: {
          custom_fields: [
            {
              display_name: "Guest Name",
              variable_name: "guest_name",
              value: metadata.guestName || "Guest",
            },
            {
              display_name: "Room Reserved",
              variable_name: "room_name",
              value: metadata.roomName || "Staycation Suite",
            },
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: metadata.guestPhone || "",
            },
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "Oxygen Orbis Direct Booking Webapp",
            },
          ],
          ...metadata,
        },
        callback: function (response) {
          if (typeof onSuccess === 'function') {
            onSuccess(response);
          }
        },
        onClose: function () {
          if (typeof onClose === 'function') {
            onClose();
          }
        },
      });

      handler.openIframe();
      return { status: 'opened', handler };
    } else {
      throw new Error('Paystack Inline SDK is not available.');
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      console.warn('Paystack initialization error:', err.message);
    }
    return { status: 'error', error: err.message };
  }
}

/**
 * Simulates a successful Paystack transaction for presentation/demo environments.
 * Allows pitch evaluators to test full end-to-end booking confirmation without
 * requiring real financial transactions.
 * 
 * @param {Object} params
 * @param {string} params.reference - Booking reference code
 * @param {number} params.amount - Total amount
 * @param {string} params.currency - 'NGN' or 'USD'
 * @param {string} [params.channel] - 'card', 'bank_transfer', or 'ussd'
 * @returns {Object} Simulated authentic Paystack transaction response
 */
export function simulatePaystackPayment({
  reference,
  amount,
  currency = 'NGN',
  channel = 'card',
}) {
  const transactionId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return {
    status: 'success',
    message: 'Approved',
    reference: reference,
    trans: transactionId,
    transaction: transactionId,
    trxref: reference,
    redirecturl: `?trxref=${reference}&reference=${reference}`,
    channel: channel,
    amount: toKobo(amount),
    currency: currency,
    paid_at: new Date().toISOString(),
    authorization: {
      channel: channel,
      bank: channel === 'card' ? 'ACCESS BANK PLC' : 'GUARANTY TRUST BANK',
      card_type: channel === 'card' ? 'visa DEBIT' : undefined,
      last4: channel === 'card' ? '4081' : undefined,
      exp_month: channel === 'card' ? '12' : undefined,
      exp_year: channel === 'card' ? '2028' : undefined,
      brand: channel === 'card' ? 'visa' : undefined,
      reusable: true,
      signature: `SIG_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    },
    isSimulated: true,
  };
}

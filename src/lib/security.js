import crypto from 'crypto';

/**
 * 🛡️ CRYPTOGRAPHIC SECURITY MODULE FOR OXYGEN ORBIS
 * Provides timing-safe signature verification, input sanitization,
 * and zero-leakage security utilities.
 */

/**
 * Verifies Paystack Webhook HMAC-SHA512 signature in constant time.
 * Prevents timing attacks where hackers measure CPU nanoseconds to guess keys.
 * 
 * @param {string|Buffer} rawBody - The unparsed raw HTTP request body string
 * @param {string} signatureHeader - The 'x-paystack-signature' header from request
 * @param {string} secretKey - The PAYSTACK_SECRET_KEY environment variable
 * @returns {boolean} True if signature is 100% authentic and untampered
 */
export function verifyPaystackSignature(rawBody, signatureHeader, secretKey) {
  if (!rawBody || !signatureHeader || !secretKey) {
    return false;
  }

  try {
    // 1. Compute HMAC SHA-512 digest from raw body
    const computedHash = crypto
      .createHmac('sha512', secretKey)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');

    // 2. Convert both to buffers for constant-time comparison
    const signatureBuffer = Buffer.from(signatureHeader, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    // 3. timingSafeEqual executes in identical time regardless of character matches
    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  } catch (err) {
    console.error('Security error during webhook verification:', err.message);
    return false;
  }
}

/**
 * Sanitizes Nigerian and international phone numbers into E.164 standard.
 * Prevents injection characters and formats: e.g. '08060648413' -> '+2348060648413'
 * 
 * @param {string} phoneInput 
 * @returns {string|null} Sanitized phone string or null if invalid
 */
export function sanitizePhoneNumber(phoneInput) {
  if (!phoneInput || typeof phoneInput !== 'string') return null;

  // Strip all non-digit and non-plus characters
  const clean = phoneInput.replace(/[^\d+]/g, '');

  // Nigerian local prefix conversion (e.g. 080... or 090... -> +23480...)
  if (clean.startsWith('0') && clean.length === 11) {
    return `+234${clean.slice(1)}`;
  }
  if (clean.startsWith('234') && clean.length === 13) {
    return `+${clean}`;
  }
  if (clean.startsWith('+234') && clean.length === 14) {
    return clean;
  }

  // International standard (+1..., +44...)
  if (/^\+[1-9]\d{7,14}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Validates email against strict RFC 5322 regex and prevents header injections.
 * 
 * @param {string} emailInput 
 * @returns {string|null} Lowercased clean email or null
 */
export function sanitizeEmail(emailInput) {
  if (!emailInput || typeof emailInput !== 'string') return null;
  const trimmed = emailInput.trim().toLowerCase();

  // Guard against CRLF injection
  if (/[\r\n]/.test(trimmed)) return null;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * Generates an unpredictable, cryptographically random booking reference.
 * Format: OXY-XXXXXX (alphanumeric, excluding ambiguous chars like 0/O and 1/I)
 */
export function generateSecureBookingReference() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let ref = 'OXY-';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    ref += chars[randomBytes[i] % chars.length];
  }
  return ref;
}

/**
 * Strips dangerous HTML / script tags from user notes and requests to prevent stored XSS.
 * 
 * @param {string} str 
 * @returns {string} Sanitized plain text
 */
export function sanitizePlainText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[^\w\s.,!?'"()\-+/@:;]/gi, '') // Allow only safe punctuation and characters
    .trim()
    .slice(0, 1000); // Enforce max length
}

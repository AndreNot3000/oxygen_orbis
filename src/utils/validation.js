/**
 * 🛡️ OXYGEN ORBIS CLIENT-SIDE FORM VALIDATION
 * Real-time defensive checks for Nigerian & International phone numbers,
 * RFC-compliant emails, and guest details.
 */

export function validateNigerianPhone(phoneInput) {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return {
      isValid: false,
      sanitized: null,
      error: 'Phone number is required to secure your reservation.',
    };
  }

  const clean = phoneInput.replace(/[^\d+]/g, '');

  // 1. Nigerian local formats: 080..., 070..., 081..., 090..., 091... (11 digits)
  if (clean.startsWith('0') && clean.length === 11) {
    return {
      isValid: true,
      sanitized: `+234${clean.slice(1)}`,
      error: null,
    };
  }

  // 2. Nigerian format with 234 prefix: 23480... (13 digits)
  if (clean.startsWith('234') && clean.length === 13) {
    return {
      isValid: true,
      sanitized: `+${clean}`,
      error: null,
    };
  }

  // 3. Nigerian format with +234: +23480... (14 characters)
  if (clean.startsWith('+234') && clean.length === 14) {
    return {
      isValid: true,
      sanitized: clean,
      error: null,
    };
  }

  // 4. Valid international standard (+1..., +44..., etc.)
  if (/^\+[1-9]\d{7,14}$/.test(clean)) {
    return {
      isValid: true,
      sanitized: clean,
      error: null,
    };
  }

  return {
    isValid: false,
    sanitized: null,
    error: 'Please enter a valid phone number (e.g. 0806 064 8413 or +234 806 064 8413).',
  };
}

export function validateEmail(emailInput) {
  if (!emailInput || typeof emailInput !== 'string') {
    return {
      isValid: false,
      sanitized: null,
      error: 'Email address is required for sending digital receipts and QR pass.',
    };
  }

  const trimmed = emailInput.trim().toLowerCase();

  // Guard against header injection
  if (/[\r\n]/.test(trimmed)) {
    return {
      isValid: false,
      sanitized: null,
      error: 'Invalid characters detected in email address.',
    };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      sanitized: null,
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
}

export function validateFullName(nameInput) {
  if (!nameInput || typeof nameInput !== 'string') {
    return {
      isValid: false,
      error: 'Guest full name is required for front-desk check-in.',
    };
  }

  const trimmed = nameInput.trim();
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Full name must be at least 3 characters long.',
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return {
      isValid: false,
      error: 'Please provide both your First and Last name.',
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    error: null,
  };
}

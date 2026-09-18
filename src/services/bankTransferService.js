import { BANK_TRANSFER_INFO } from '../data/resortData.js';

/**
 * 🏛️ DIRECT MANUAL BANK TRANSFER SERVICE (CARD-3.3)
 * Manages manual wire transfers to Oxygen Orbis corporate bank account,
 * receipt image validation, and the Front Desk verification queue.
 */

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Validates an uploaded payment receipt or transfer screenshot.
 * Enforces file size and type boundaries against malicious uploads.
 * 
 * @param {File|Object} file - The file object to validate
 * @returns {Object} { isValid: boolean, error?: string, fileMeta?: Object }
 */
export function validateReceiptFile(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'Please upload a screenshot or PDF of your bank transfer receipt.',
    };
  }

  const { name, size, type } = file;

  // 1. File size checks
  if (size <= 0) {
    return {
      isValid: false,
      error: 'The uploaded file appears to be empty. Please select a valid receipt image.',
    };
  }

  if (size > MAX_RECEIPT_SIZE_BYTES) {
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File is too large (${sizeMb} MB). Maximum receipt upload size is 5 MB.`,
    };
  }

  // 2. MIME type verification
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(type)) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload a JPG, PNG, WEBP image, or PDF document.',
    };
  }

  // 3. Dangerous extension check
  const lowerName = (name || '').toLowerCase();
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.php', '.py'];
  if (dangerousExtensions.some((ext) => lowerName.endsWith(ext))) {
    return {
      isValid: false,
      error: 'Security Error: Executable file types are strictly prohibited.',
    };
  }

  return {
    isValid: true,
    fileMeta: {
      name: name || 'transfer_receipt',
      sizeBytes: size,
      formattedSize: size > 1024 * 1024 
        ? `${(size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(size / 1024).toFixed(1)} KB`,
      type,
    },
  };
}

/**
 * Creates a structured transfer submission record for front-desk queueing.
 * 
 * @param {Object} params
 * @param {string} params.bookingRef - Reference string e.g. 'OXY-123456'
 * @param {string} params.guestName
 * @param {string} params.guestPhone
 * @param {number} params.amount
 * @param {Object} params.fileMeta - Validated file metadata
 * @param {string} [params.proofDataUrl] - Base64 or cloud URL of uploaded receipt
 * @param {string} [params.notes] - Optional guest note
 * @returns {Object} Structured manual transfer record
 */
export function createPendingBankTransferSubmission({
  bookingRef,
  guestName,
  guestPhone,
  amount,
  fileMeta,
  proofDataUrl = null,
  notes = '',
}) {
  if (!bookingRef || !guestName || !amount) {
    throw new Error('Missing required fields for bank transfer submission.');
  }

  return {
    id: `xfer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bookingReference: bookingRef,
    guestName,
    guestPhone,
    amount,
    currency: 'NGN',
    bankDetails: {
      bankName: BANK_TRANSFER_INFO.bankName,
      accountName: BANK_TRANSFER_INFO.accountName,
      accountNumber: BANK_TRANSFER_INFO.accountNumber,
      expectedNarration: `#${bookingRef}`,
    },
    receipt: {
      name: fileMeta.name,
      size: fileMeta.sizeBytes,
      formattedSize: fileMeta.formattedSize,
      mimeType: fileMeta.type,
      dataUrl: proofDataUrl,
    },
    status: 'AWAITING_VERIFICATION',
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null,
    rejectionReason: null,
    guestNotes: notes,
  };
}

/**
 * Simulates Front Desk staff approving a verified direct transfer.
 * 
 * @param {Object} transferRecord 
 * @param {Object} staffUser 
 * @returns {Object} Approved transfer record
 */
export function approveBankTransfer(transferRecord, staffUser) {
  if (!staffUser || !['SUPER_ADMIN', 'FRONT_DESK'].includes(staffUser.role)) {
    throw new Error('Unauthorized: Only Front Desk staff can approve wire transfers.');
  }

  if (transferRecord.status !== 'AWAITING_VERIFICATION') {
    throw new Error(`Cannot approve transfer in status: ${transferRecord.status}`);
  }

  return {
    ...transferRecord,
    status: 'VERIFIED',
    verifiedAt: new Date().toISOString(),
    verifiedBy: {
      id: staffUser.id,
      name: staffUser.name,
      role: staffUser.role,
    },
  };
}

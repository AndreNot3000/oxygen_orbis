import assert from 'assert';
import crypto from 'crypto';
import { toKobo, formatKoboAmount, simulatePaystackPayment } from '../src/services/paystackService.js';
import { processPaystackWebhook } from '../src/services/webhookHandler.js';
import { 
  validateReceiptFile, 
  createPendingBankTransferSubmission, 
  approveBankTransfer,
  MAX_RECEIPT_SIZE_BYTES 
} from '../src/services/bankTransferService.js';
import { BANK_TRANSFER_INFO } from '../src/data/resortData.js';

console.log('================================================================');
console.log('🏨 RUNNING TEST SUITE: MODULE 3 (Payments & Financial Integrations)');
console.log('================================================================\n');

let passedTests = 0;
const runTest = (name, fn) => {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

const runAsyncTest = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

async function executeTestSuite() {
  // -------------------------------------------------------------
  // TEST GROUP 1: CARD 3.1 - Paystack Checkout Service & Amounts
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Paystack Checkout Integration (Card 3.1)');

  runTest('Converts standard Naira to kobo accurately (₦48,000 -> 4,800,000 kobo)', () => {
    const kobo = toKobo(48000);
    assert.strictEqual(kobo, 4800000);
  });

  runTest('Converts standard USD to cents accurately ($65 -> 6,500 cents)', () => {
    const cents = toKobo(65);
    assert.strictEqual(cents, 6500);
  });

  runTest('Rejects non-numeric or negative payment amounts', () => {
    assert.throws(() => toKobo(-5000), /Invalid payment amount/);
    assert.throws(() => toKobo('invalid'), /Invalid payment amount/);
    assert.throws(() => toKobo(0), /Invalid payment amount/);
  });

  runTest('Formats kobo amount back to locale currency string for guest display', () => {
    assert.strictEqual(formatKoboAmount(4800000, 'NGN'), '₦48,000');
    assert.strictEqual(formatKoboAmount(6500, 'USD'), '$65');
  });

  runTest('Simulates Paystack payment with authentic reference and authorization metadata', () => {
    const sim = simulatePaystackPayment({
      reference: 'OXY-TEST-881',
      amount: 110400,
      currency: 'NGN',
      channel: 'card',
    });

    assert.strictEqual(sim.status, 'success');
    assert.strictEqual(sim.reference, 'OXY-TEST-881');
    assert.strictEqual(sim.amount, 11040000); // 110,400 in kobo
    assert.strictEqual(sim.isSimulated, true);
    assert.strictEqual(sim.authorization.channel, 'card');
    assert.ok(sim.authorization.signature.startsWith('SIG_'));
  });

  runTest('Simulates Paystack virtual bank transfer channel', () => {
    const sim = simulatePaystackPayment({
      reference: 'OXY-TEST-882',
      amount: 72000,
      currency: 'NGN',
      channel: 'bank_transfer',
    });

    assert.strictEqual(sim.channel, 'bank_transfer');
    assert.strictEqual(sim.authorization.bank, 'GUARANTY TRUST BANK');
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: CARD 3.2 - Secure Webhook Processing & Reconciliation
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: Secure Webhook Processing & Anti-Underpayment (Card 3.2)');

  const mockSecret = 'sk_test_oxygen_orbis_resort_secret_key_89231';

  // Helper to create genuine HMAC signatures
  const createSignature = (body, secret) => {
    return crypto.createHmac('sha512', secret).update(body).digest('hex');
  };

  // Mock Database Store
  const createMockDb = (initialBooking = null) => {
    const bookings = new Map();
    const payments = [];
    const units = [
      { id: 'unit-204', room_type_id: 'deluxe-king', unit_number: 'Room 204', status: 'AVAILABLE' },
      { id: 'unit-305', room_type_id: 'executive-room', unit_number: 'Room 305', status: 'AVAILABLE' },
    ];
    let fraudAlerts = [];

    if (initialBooking) {
      bookings.set(initialBooking.reference, { ...initialBooking });
    }

    return {
      findBookingByReference: async (ref) => bookings.get(ref) || null,
      allocateRoomUnit: async (roomTypeId) => {
        const unit = units.find((u) => u.room_type_id === roomTypeId && u.status === 'AVAILABLE');
        if (unit) unit.status = 'OCCUPIED';
        return unit || null;
      },
      updateBookingStatus: async ({ bookingId, status, roomUnitId, paymentMethod, paidAt }) => {
        for (const [ref, b] of bookings.entries()) {
          if (b.id === bookingId) {
            b.status = status;
            b.room_unit_id = roomUnitId;
            b.payment_method = paymentMethod;
            b.paid_at = paidAt;
            return b;
          }
        }
        return null;
      },
      recordPayment: async (paymentData) => {
        payments.push(paymentData);
        return paymentData;
      },
      recordFraudAlert: async (alert) => {
        fraudAlerts.push(alert);
      },
      getPayments: () => payments,
      getFraudAlerts: () => fraudAlerts,
    };
  };

  await runAsyncTest('Rejects webhook without signature header with 401 Unauthorized', async () => {
    const res = await processPaystackWebhook({
      rawBody: JSON.stringify({ event: 'charge.success' }),
      signatureHeader: null,
      secretKey: mockSecret,
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.success, false);
  });

  await runAsyncTest('Rejects webhook with forged/invalid HMAC signature with 401 Unauthorized', async () => {
    const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'OXY-100' } });
    const forgedSignature = 'deadbeef'.repeat(16);

    const res = await processPaystackWebhook({
      rawBody,
      signatureHeader: forgedSignature,
      secretKey: mockSecret,
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.success, false);
  });

  await runAsyncTest('Rejects tampered amount payload even if signature matched original', async () => {
    const originalBody = JSON.stringify({ event: 'charge.success', data: { amount: 10000 } });
    const validSignatureForOriginal = createSignature(originalBody, mockSecret);

    // Hacker intercepts and changes amount to 100 kobo
    const tamperedBody = JSON.stringify({ event: 'charge.success', data: { amount: 100 } });

    const res = await processPaystackWebhook({
      rawBody: tamperedBody,
      signatureHeader: validSignatureForOriginal,
      secretKey: mockSecret,
    });
    assert.strictEqual(res.statusCode, 401);
  });

  await runAsyncTest('Rejects underpayment hack (guest pays ₦1,000 on ₦48,000 reservation)', async () => {
    const mockDb = createMockDb({
      id: 'book-001',
      reference: 'OXY-DEFENSE-1',
      guest_name: 'Adewale Bakare',
      guest_phone: '+2348060648413',
      guest_email: 'adewale@example.com',
      room_type_id: 'deluxe-king',
      total_amount_kobo: 4800000, // ₦48,000 in kobo
      status: 'PENDING_PAYMENT',
    });

    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'OXY-DEFENSE-1',
        amount: 100000, // Attempted payment of only ₦1,000
        currency: 'NGN',
        channel: 'card',
        paid_at: new Date().toISOString(),
      },
    });

    const signature = createSignature(payload, mockSecret);

    const res = await processPaystackWebhook({
      rawBody: payload,
      signatureHeader: signature,
      secretKey: mockSecret,
      store: mockDb,
    });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('Underpayment detected'));
    assert.strictEqual(mockDb.getFraudAlerts().length, 1);
  });

  await runAsyncTest('Processes authentic charge.success, confirms booking and assigns physical room', async () => {
    const mockDb = createMockDb({
      id: 'book-002',
      reference: 'OXY-SUCCESS-2',
      guest_name: 'Folake Adeleke',
      guest_phone: '+2348060648413',
      guest_email: 'folake@example.com',
      room_type_id: 'deluxe-king',
      room_type_name: 'Deluxe King Room',
      check_in_date: '2026-10-02',
      check_out_date: '2026-10-04',
      total_amount_kobo: 9600000, // 2 nights = ₦96,000
      status: 'PENDING_PAYMENT',
    });

    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'OXY-SUCCESS-2',
        amount: 9600000,
        currency: 'NGN',
        channel: 'card',
        paid_at: '2026-10-01T14:30:00Z',
      },
    });

    const signature = createSignature(payload, mockSecret);
    let dispatched = false;

    const res = await processPaystackWebhook({
      rawBody: payload,
      signatureHeader: signature,
      secretKey: mockSecret,
      store: mockDb,
      onDispatch: async (notification) => {
        dispatched = true;
        assert.strictEqual(notification.bookingRef, 'OXY-SUCCESS-2');
        assert.strictEqual(notification.roomUnitNumber, 'Room 204');
      },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.booking.status, 'CONFIRMED');
    assert.strictEqual(res.assignedUnit.unit_number, 'Room 204');
    assert.strictEqual(dispatched, true);
    assert.strictEqual(mockDb.getPayments().length, 1);
    assert.strictEqual(mockDb.getPayments()[0].transactionReference, 'OXY-SUCCESS-2');
  });

  await runAsyncTest('Safely handles duplicate webhook events idempotently without double-charge', async () => {
    const mockDb = createMockDb({
      id: 'book-003',
      reference: 'OXY-IDEMPOTENT-3',
      total_amount_kobo: 4800000,
      status: 'CONFIRMED', // Already confirmed
    });

    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'OXY-IDEMPOTENT-3',
        amount: 4800000,
        currency: 'NGN',
      },
    });

    const signature = createSignature(payload, mockSecret);

    const res = await processPaystackWebhook({
      rawBody: payload,
      signatureHeader: signature,
      secretKey: mockSecret,
      store: mockDb,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.message.includes('Idempotent'));
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: CARD 3.3 - Direct Manual Bank Transfer Flow
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 3: Direct Bank Transfer & Receipt Verification (Card 3.3)');

  runTest('Verifies official Oxygen Orbis corporate bank metadata is configured', () => {
    assert.strictEqual(BANK_TRANSFER_INFO.bankName, 'Guaranty Trust Bank (GTBank)');
    assert.strictEqual(BANK_TRANSFER_INFO.accountNumber, '0789234512');
    assert.strictEqual(BANK_TRANSFER_INFO.accountName, 'Oxygen Orbis Hotel & Resort Ltd');
    assert.strictEqual(BANK_TRANSFER_INFO.verificationWindowMinutes, 15);
  });

  runTest('Validates authentic receipt image upload (JPEG within 5MB limit)', () => {
    const validFile = {
      name: 'gtbank_transfer_receipt.jpg',
      size: 1.2 * 1024 * 1024, // 1.2 MB
      type: 'image/jpeg',
    };

    const res = validateReceiptFile(validFile);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.fileMeta.type, 'image/jpeg');
    assert.strictEqual(res.fileMeta.formattedSize, '1.20 MB');
  });

  runTest('Validates PDF bank transfer statement receipt', () => {
    const pdfFile = {
      name: 'access_bank_payment.pdf',
      size: 450 * 1024, // 450 KB
      type: 'application/pdf',
    };

    const res = validateReceiptFile(pdfFile);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.fileMeta.formattedSize, '450.0 KB');
  });

  runTest('Rejects oversized receipt file exceeding 5MB limit', () => {
    const oversizedFile = {
      name: 'huge_scan.png',
      size: 6.5 * 1024 * 1024, // 6.5 MB > 5 MB
      type: 'image/png',
    };

    const res = validateReceiptFile(oversizedFile);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes('File is too large'));
  });

  runTest('Rejects dangerous executable file disguised as receipt (.exe, .sh, .bat)', () => {
    const maliciousFile = {
      name: 'receipt.exe',
      size: 100 * 1024,
      type: 'image/jpeg', // Fake MIME header
    };

    const res = validateReceiptFile(maliciousFile);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error.includes('Executable file types are strictly prohibited'));
  });

  runTest('Creates pending wire transfer record with status AWAITING_VERIFICATION and expected narration', () => {
    const submission = createPendingBankTransferSubmission({
      bookingRef: 'OXY-WIRE-992',
      guestName: 'Babatunde Adeleke',
      guestPhone: '+2348060648413',
      amount: 110400,
      fileMeta: {
        name: 'gtb_payment.png',
        sizeBytes: 850000,
        formattedSize: '830.1 KB',
        type: 'image/png',
      },
      proofDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...',
      notes: 'Transfer sent from GTWorld app at 2:15 PM',
    });

    assert.ok(submission.id.startsWith('xfer_'));
    assert.strictEqual(submission.bookingReference, 'OXY-WIRE-992');
    assert.strictEqual(submission.status, 'AWAITING_VERIFICATION');
    assert.strictEqual(submission.bankDetails.expectedNarration, '#OXY-WIRE-992');
    assert.strictEqual(submission.receipt.mimeType, 'image/png');
    assert.strictEqual(submission.verifiedAt, null);
  });

  runTest('Front Desk staff approves wire transfer and transitions status to VERIFIED', () => {
    const submission = createPendingBankTransferSubmission({
      bookingRef: 'OXY-WIRE-993',
      guestName: 'Chioma Okonkwo',
      guestPhone: '+2348060648413',
      amount: 72000,
      fileMeta: { name: 'receipt.jpg', sizeBytes: 200000, formattedSize: '195.3 KB', type: 'image/jpeg' },
    });

    const staffUser = {
      id: 'staff-01',
      name: 'Tola Adeyemi',
      role: 'FRONT_DESK',
    };

    const approved = approveBankTransfer(submission, staffUser);
    assert.strictEqual(approved.status, 'VERIFIED');
    assert.strictEqual(approved.verifiedBy.name, 'Tola Adeyemi');
    assert.ok(approved.verifiedAt);
  });

  runTest('Unauthorized staff role (e.g. HOUSEKEEPING) is forbidden from approving wire transfers', () => {
    const submission = createPendingBankTransferSubmission({
      bookingRef: 'OXY-WIRE-994',
      guestName: 'Guest',
      guestPhone: '+2348060648413',
      amount: 48000,
      fileMeta: { name: 'receipt.jpg', sizeBytes: 200000, formattedSize: '195.3 KB', type: 'image/jpeg' },
    });

    const housekeeper = {
      id: 'staff-02',
      name: 'Ibrahim',
      role: 'HOUSEKEEPING',
    };

    assert.throws(() => approveBankTransfer(submission, housekeeper), /Unauthorized/);
  });

  console.log('\n================================================================');
  console.log(`📊 MODULE 3 SUMMARY: ${passedTests}/${passedTests} TESTS PASSED`);
  console.log('🎉 ALL MODULE 3 TESTS (PAYSTACK & BANK TRANSFERS) PASSED PERFECTLY!');
  console.log('================================================================\n');
}

executeTestSuite();

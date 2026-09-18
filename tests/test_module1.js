import { 
  verifyPaystackSignature, 
  sanitizePhoneNumber, 
  sanitizeEmail, 
  sanitizePlainText, 
  generateSecureBookingReference 
} from '../src/lib/security.js';

import { 
  hashPassword, 
  verifyPassword, 
  createSessionToken, 
  verifySessionToken, 
  isAuthorized, 
  STAFF_ROLES 
} from '../src/lib/auth.js';

import fs from 'fs';
import path from 'path';

/**
 * 🧪 OXYGEN ORBIS — MODULE 1 COMPREHENSIVE TEST SUITE
 * Validates cryptographic security, defensive sanitization,
 * password hashing, session tokens, and database schema invariants.
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `— ${details}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🏨 RUNNING TEST SUITE: MODULE 1 (Security, Auth & Database)');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: CRYPTOGRAPHIC PAYSTACK WEBHOOK VERIFICATION
  // --------------------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Cryptographic Webhook Security (HMAC-SHA512)');
  const secretKey = 'sk_test_oxygen_orbis_mock_secret_key_84920';
  const rawPayload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'OXY-TRX-991', amount: 11500000, status: 'success' },
  });

  // Generate a legitimate HMAC-SHA512 signature
  const crypto = await import('crypto');
  const validSig = crypto
    .createHmac('sha512', secretKey)
    .update(rawPayload)
    .digest('hex');

  // Test 1.1: Legitimate signature succeeds
  const isValid = verifyPaystackSignature(rawPayload, validSig, secretKey);
  assert(isValid === true, 'Legitimate Paystack webhook signature is accepted');

  // Test 1.2: Tampered payload fails
  const tamperedPayload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'OXY-TRX-991', amount: 100, status: 'success' }, // Hacker changed amount!
  });
  const isTamperedRejected = verifyPaystackSignature(tamperedPayload, validSig, secretKey);
  assert(isTamperedRejected === false, 'Tampered payload (hacker modified amount) is rejected');

  // Test 1.3: Forged signature fails
  const forgedSig = 'a'.repeat(128);
  const isForgedRejected = verifyPaystackSignature(rawPayload, forgedSig, secretKey);
  assert(isForgedRejected === false, 'Forged/random signature is rejected');

  // Test 1.4: Null or empty inputs fail gracefully without crashing
  assert(verifyPaystackSignature(null, validSig, secretKey) === false, 'Null payload handled safely');
  assert(verifyPaystackSignature(rawPayload, '', secretKey) === false, 'Empty signature handled safely');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: INPUT SANITIZATION & DEFENSIVE PARSING
  // --------------------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: Input Sanitization (Phone, Email, XSS)');

  // Phone sanitization tests
  assert(sanitizePhoneNumber('08060648413') === '+2348060648413', 'Local 11-digit Nigerian phone normalized to E.164');
  assert(sanitizePhoneNumber('2348060648413') === '+2348060648413', '234 prefix normalized to +234');
  assert(sanitizePhoneNumber('+234 806 064 8413') === '+2348060648413', 'Spaced formatted phone normalized');
  assert(sanitizePhoneNumber('+14155552671') === '+14155552671', 'Valid international US phone preserved');
  assert(sanitizePhoneNumber('invalid-text-phone') === null, 'Garbage string rejected as invalid phone');
  assert(sanitizePhoneNumber('080123') === null, 'Short incomplete phone rejected');

  // Email sanitization tests
  assert(sanitizeEmail('guest@example.com') === 'guest@example.com', 'Valid standard email accepted');
  assert(sanitizeEmail('  GUEST.VIP@HOTEL.NG  ') === 'guest.vip@hotel.ng', 'Uppercase email trimmed and lowercased');
  assert(sanitizeEmail('bad-email-without-at.com') === null, 'Malformed email rejected');
  assert(sanitizeEmail("admin@oxygenorbis.com\r\nBcc: hacker@bad.com") === null, 'CRLF Header Injection attempt blocked');

  // XSS and plain text sanitization
  const maliciousInput = '<script>alert("Hacked!")</script>Quiet room with pool view please.';
  const sanitized = sanitizePlainText(maliciousInput);
  assert(!sanitized.includes('<script>') && sanitized.includes('Quiet room'), 'HTML script tags stripped from user notes');

  // Booking reference format
  const ref = generateSecureBookingReference();
  assert(ref.startsWith('OXY-') && ref.length === 10, `Generated reference format is valid: ${ref}`);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: AUTHENTICATION, PBKDF2 HASHING & RBAC
  // --------------------------------------------------------------------------
  console.log('\n📦 TEST GROUP 3: Authentication & Role-Based Access Control');

  const password = 'SuperSecretResortPassword2026!';
  const hashedPassword = hashPassword(password);

  // PBKDF2 structure check
  assert(hashedPassword.startsWith('pbkdf2:100000:'), 'Password hashed with 100,000 rounds of PBKDF2');

  // Correct password verification
  assert(verifyPassword(password, hashedPassword) === true, 'Correct password verifies successfully');

  // Incorrect password rejection
  assert(verifyPassword('WrongPassword123', hashedPassword) === false, 'Incorrect password rejected');

  // Session Token lifecycle
  const userPayload = {
    userId: 'usr_84920',
    username: 'manager_andre',
    role: STAFF_ROLES.SUPER_ADMIN,
  };
  const testSecret = 'mock-jwt-secret-key-for-test-suite-32chars';
  const token = createSessionToken(userPayload, testSecret);

  assert(typeof token === 'string' && token.split('.').length === 3, 'Signed session token structure is valid (3 segments)');

  const decoded = verifySessionToken(token, testSecret);
  assert(decoded.userId === userPayload.userId && decoded.role === STAFF_ROLES.SUPER_ADMIN, 'Token decoded and signature verified');

  // Tampered token rejection
  const tamperedToken = token.slice(0, -5) + 'X9Z2Q';
  let tamperedDetected = false;
  try {
    verifySessionToken(tamperedToken, testSecret);
  } catch (err) {
    tamperedDetected = true;
  }
  assert(tamperedDetected === true, 'Tampered token signature detected and rejected');

  // Role authorization guards
  assert(isAuthorized(STAFF_ROLES.SUPER_ADMIN, [STAFF_ROLES.FRONT_DESK]) === true, 'SuperAdmin bypasses specific role restrictions');
  assert(isAuthorized(STAFF_ROLES.FRONT_DESK, [STAFF_ROLES.FRONT_DESK]) === true, 'FrontDesk authorized for FrontDesk routes');
  assert(isAuthorized(STAFF_ROLES.HOUSEKEEPING, [STAFF_ROLES.SUPER_ADMIN]) === false, 'Housekeeping forbidden from SuperAdmin routes');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: DATABASE SCHEMA & CONSTRAINTS VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n📦 TEST GROUP 4: Database Schema Invariants (schema.sql)');
  const schemaPath = path.resolve('schema.sql');
  const schemaExists = fs.existsSync(schemaPath);
  assert(schemaExists === true, 'schema.sql exists in project root');

  if (schemaExists) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    assert(schemaContent.includes('CREATE EXTENSION IF NOT EXISTS "btree_gist"'), 'GIST extension declared for double-booking exclusion');
    assert(schemaContent.includes('EXCLUDE USING gist'), 'Mathematical exclusion constraint declared on physical room units');
    assert(schemaContent.includes('room_unit_status AS ENUM'), 'room_unit_status ENUM defined');
    assert(schemaContent.includes('booking_status AS ENUM'), 'booking_status ENUM defined');
    assert(schemaContent.includes('CHECK (check_out > check_in)'), 'check_dates_validity constraint enforced');
    assert(schemaContent.includes('deluxe-king') && schemaContent.includes('presidential-suite'), 'Oxygen Orbis room categories pre-seeded');
  }

  // --------------------------------------------------------------------------
  // SUMMARY RESULTS
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL MODULE 1 TESTS PASSED PERFECTLY!');
  } else {
    console.error(`⚠️ ${failedTests} TEST(S) FAILED!`);
  }
  console.log('================================================================\n');

  return failedTests === 0;
}

runTestSuite().then((success) => {
  process.exit(success ? 0 : 1);
});

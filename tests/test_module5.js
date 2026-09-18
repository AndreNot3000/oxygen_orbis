import assert from 'assert';
import { 
  INITIAL_ROOM_UNITS, 
  INITIAL_PMS_RESERVATIONS, 
  INITIAL_PENDING_TRANSFERS,
  canCheckInToRoom, 
  calculatePmsStats 
} from '../src/services/pmsService.js';
import { generateSignedPassPayload, verifySignedPass } from '../src/services/digitalPassService.js';

console.log('================================================================');
console.log('🏨 RUNNING TEST SUITE: MODULE 5 (Staff Portal & Front Desk PMS)');
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

async function executeTestSuite() {
  // -------------------------------------------------------------
  // TEST GROUP 1: CARD 5.1 - 40-Room Visual Gantt Timeline Grid
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Physical Inventory & Gantt Grid (Card 5.1)');

  runTest('Initializes exactly 40 physical room units across 4 floors', () => {
    assert.strictEqual(INITIAL_ROOM_UNITS.length, 40);
    const floors = new Set(INITIAL_ROOM_UNITS.map((r) => r.floor));
    assert.deepStrictEqual([...floors].sort(), [1, 2, 3, 4]);
  });

  runTest('Calculates real-time PMS operational metrics accurately', () => {
    const stats = calculatePmsStats(INITIAL_ROOM_UNITS, INITIAL_PMS_RESERVATIONS);
    assert.strictEqual(stats.totalRooms, 40);
    assert.ok(stats.occupiedCount > 0);
    assert.ok(stats.availableCount > 0);
    assert.ok(stats.occupancyPercentage >= 0 && stats.occupancyPercentage <= 100);
  });

  runTest('Categorizes room units correctly into distinct tiers', () => {
    const deluxeKingCount = INITIAL_ROOM_UNITS.filter((r) => r.typeId === 'deluxe-king').length;
    const executiveCount = INITIAL_ROOM_UNITS.filter((r) => r.typeId === 'executive-room').length;
    const penthouseCount = INITIAL_ROOM_UNITS.filter((r) => r.typeId === 'presidential-suite').length;

    assert.strictEqual(deluxeKingCount, 20); // Floors 1 & 2
    assert.strictEqual(executiveCount, 10);  // Floor 3
    assert.strictEqual(penthouseCount, 10);  // Floor 4
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: CARD 5.2 - In-Browser 5-Sec QR Check-In / Check-Out
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: In-Browser 5-Sec QR Check-In (Card 5.2)');

  runTest('Generates and verifies authentic guest QR stay pass for front desk scanner', () => {
    const pass = generateSignedPassPayload({
      reference: 'OXY-TEST-501',
      guestName: 'Chief Tunde Alabi',
      roomName: 'Deluxe King',
      roomUnit: 'Room 204',
      checkIn: '2026-10-02',
      checkOut: '2026-10-04',
      totalFormatted: '₦110,400',
    });

    const verification = verifySignedPass(pass.qrString);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.pass.guest, 'Chief Tunde Alabi');
    assert.strictEqual(verification.pass.ref, 'OXY-TEST-501');
  });

  runTest('Blocks check-in into a DIRTY or CLEANING room unit', () => {
    const dirtyUnit = { unitNumber: '104', status: 'DIRTY', housekeeping: 'DIRTY' };
    const check = canCheckInToRoom(dirtyUnit);
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason.includes('dirty'));
  });

  runTest('Blocks check-in into a MAINTENANCE room unit', () => {
    const maintenanceUnit = { unitNumber: '107', status: 'MAINTENANCE', housekeeping: 'BLOCKED' };
    const check = canCheckInToRoom(maintenanceUnit);
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason.includes('maintenance'));
  });

  runTest('Allows check-in into an AVAILABLE and INSPECTED_CLEAN room unit', () => {
    const cleanUnit = { unitNumber: '201', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN' };
    const check = canCheckInToRoom(cleanUnit);
    assert.strictEqual(check.allowed, true);
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: CARD 5.3 - Housekeeping & Room Status Workflow
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 3: Housekeeping & Room Status Workflow (Card 5.3)');

  runTest('Transitions room through complete turnover lifecycle (OCCUPIED -> DIRTY -> CLEANING -> INSPECTED_CLEAN)', () => {
    let unit = { unitNumber: '205', status: 'OCCUPIED', housekeeping: 'INSPECTED_CLEAN', currentGuest: 'Guest A' };

    // Guest checks out:
    unit = { ...unit, status: 'DIRTY', housekeeping: 'DIRTY', currentGuest: null };
    assert.strictEqual(unit.status, 'DIRTY');
    assert.strictEqual(canCheckInToRoom(unit).allowed, false);

    // Housekeeper starts cleaning:
    unit = { ...unit, housekeeping: 'CLEANING_IN_PROGRESS' };
    assert.strictEqual(unit.housekeeping, 'CLEANING_IN_PROGRESS');
    assert.strictEqual(canCheckInToRoom(unit).allowed, false);

    // Supervisor inspects and approves:
    unit = { ...unit, status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN' };
    assert.strictEqual(unit.status, 'AVAILABLE');
    assert.strictEqual(unit.housekeeping, 'INSPECTED_CLEAN');
    assert.strictEqual(canCheckInToRoom(unit).allowed, true);
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: CARD 5.4 - Manual Walk-In & Double Booking Protection
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 4: Walk-In Creator & Double-Booking Protection (Card 5.4)');

  runTest('Prevents assigning walk-in guest to an already occupied physical room unit', () => {
    const occupiedUnit = INITIAL_ROOM_UNITS.find((r) => r.status === 'OCCUPIED');
    assert.ok(occupiedUnit);
    const check = canCheckInToRoom(occupiedUnit);
    assert.strictEqual(check.allowed, false);
    assert.ok(check.reason.includes('occupied'));
  });

  runTest('Pending wire transfer queue contains pre-seeded submissions awaiting reconciliation', () => {
    assert.ok(INITIAL_PENDING_TRANSFERS.length >= 2);
    const xfer = INITIAL_PENDING_TRANSFERS[0];
    assert.strictEqual(xfer.status, 'AWAITING_VERIFICATION');
    assert.ok(xfer.narration.startsWith('#OXY-'));
    assert.strictEqual(xfer.bankName, 'Guaranty Trust Bank (GTBank)');
  });

  console.log('\n================================================================');
  console.log(`📊 MODULE 5 SUMMARY: ${passedTests}/${passedTests} TESTS PASSED`);
  console.log('🎉 ALL MODULE 5 TESTS (STAFF PMS, GANTT & SCANNER) PASSED PERFECTLY!');
  console.log('================================================================\n');
}

executeTestSuite();

import assert from 'assert';
import { 
  DEFAULT_RATE_RULES, 
  calculateDynamicNightRate, 
  calculateOtaVsDirectRoi, 
  calculate12MonthProjections,
  generateFinancialStatementCsv 
} from '../src/services/revenueService.js';

console.log('================================================================');
console.log('🏨 RUNNING TEST SUITE: MODULE 6 (Revenue Analytics & Rates)');
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
  // TEST GROUP 1: CARD 6.1 - Dynamic Rate Engine & Surcharges
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Dynamic Rate Engine & Peak Overrides (Card 6.1)');

  runTest('Calculates midweek standard rate at base price with 0% surge', () => {
    // 2026-11-18 is Wednesday (midweek)
    const quote = calculateDynamicNightRate('deluxe-king', '2026-11-18');
    assert.strictEqual(quote.rate, 48000);
    assert.strictEqual(quote.pricingTier, 'MIDWEEK_STANDARD');
    assert.strictEqual(quote.appliedSurgePct, 0);
  });

  runTest('Applies +15% weekend staycation surge on Friday night', () => {
    // 2026-11-20 is Friday
    const quote = calculateDynamicNightRate('deluxe-king', '2026-11-20');
    // 48,000 + (48,000 * 0.15) = 55,200
    assert.strictEqual(quote.rate, 55200);
    assert.strictEqual(quote.pricingTier, 'WEEKEND_STAYCATION');
    assert.strictEqual(quote.appliedSurgePct, 15);
  });

  runTest('Applies +15% weekend staycation surge on Saturday night for Executive Suite', () => {
    // 2026-11-21 is Saturday
    const quote = calculateDynamicNightRate('executive-room', '2026-11-21');
    // 72,000 + (72,000 * 0.15) = 82,800
    assert.strictEqual(quote.rate, 82800);
    assert.strictEqual(quote.pricingTier, 'WEEKEND_STAYCATION');
    assert.strictEqual(quote.appliedSurgePct, 15);
  });

  runTest('Respects custom weekend surge rules (e.g. +25% custom override)', () => {
    const customRules = {
      ...DEFAULT_RATE_RULES,
      weekendSurgePercentage: 25,
    };
    // 2026-11-20 is Friday
    const quote = calculateDynamicNightRate('deluxe-king', '2026-11-20', customRules);
    // 48,000 + (48,000 * 0.25) = 60,000
    assert.strictEqual(quote.rate, 60000);
    assert.strictEqual(quote.appliedSurgePct, 25);
  });

  runTest('Enforces Independence Staycation Weekend peak rate override (+20%)', () => {
    // 2026-10-02 is during Independence Weekend (2026-10-01 to 2026-10-04)
    const quote = calculateDynamicNightRate('deluxe-king', '2026-10-02');
    // 48,000 + (48,000 * 0.20) = 57,600
    assert.strictEqual(quote.rate, 57600);
    assert.strictEqual(quote.pricingTier, 'HOLIDAY_PEAK');
    assert.strictEqual(quote.appliedSurgePct, 20);
    assert.strictEqual(quote.reason, 'Independence Staycation Weekend');
  });

  runTest('Enforces Detty December & New Year peak override (+35%)', () => {
    // 2026-12-25 is Christmas Day
    const quote = calculateDynamicNightRate('presidential-suite', '2026-12-25');
    // 145,000 + (145,000 * 0.35) = 195,750
    assert.strictEqual(quote.rate, 195750);
    assert.strictEqual(quote.pricingTier, 'HOLIDAY_PEAK');
    assert.strictEqual(quote.appliedSurgePct, 35);
    assert.strictEqual(quote.reason, 'Detty December & New Year Peak');
  });

  runTest('Enforces Easter holiday override (+25%)', () => {
    // 2027-03-27 is Easter Saturday
    const quote = calculateDynamicNightRate('executive-room', '2027-03-27');
    // 72,000 + (72,000 * 0.25) = 90,000
    assert.strictEqual(quote.rate, 90000);
    assert.strictEqual(quote.pricingTier, 'HOLIDAY_PEAK');
    assert.strictEqual(quote.appliedSurgePct, 25);
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: CARD 6.2 - Direct vs OTA ROI & Commission Calculator
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: Direct Booking vs OTA ROI Calculator (Card 6.2)');

  runTest('Calculates baseline OTA vs Direct ROI metrics accurately', () => {
    const metrics = calculateOtaVsDirectRoi({
      monthlyBookings: 45,
      avgBookingValue: 150000,
      otaCommissionRate: 0.20,
      paystackFeeRate: 0.015,
    });

    assert.strictEqual(metrics.monthlyGross, 6750000);
    assert.strictEqual(metrics.annualGross, 81000000);
    assert.strictEqual(metrics.annualOtaLoss, 16200000); // ₦16.2M lost to OTAs
    assert.strictEqual(metrics.annualDirectFee, 1215000); // ₦1.215M Paystack fee
    assert.strictEqual(metrics.annualSavings, 14985000); // ₦14.985M saved direct
    assert.strictEqual(metrics.monthlySavings, 1248750); // ~₦1.25M saved per month
  });

  runTest('Adjusts calculations for Booking.com (18%) and Expedia (22%)', () => {
    const bdcMetrics = calculateOtaVsDirectRoi({
      monthlyBookings: 50,
      avgBookingValue: 100000,
      otaCommissionRate: 0.18,
    });
    // Gross: 5,000,000 * 12 = 60,000,000
    // OTA 18%: 10,800,000
    // Paystack 1.5%: 900,000
    // Net Savings: 9,900,000
    assert.strictEqual(bdcMetrics.annualOtaLoss, 10800000);
    assert.strictEqual(bdcMetrics.annualSavings, 9900000);

    const expediaMetrics = calculateOtaVsDirectRoi({
      monthlyBookings: 50,
      avgBookingValue: 100000,
      otaCommissionRate: 0.22,
    });
    assert.strictEqual(expediaMetrics.annualOtaLoss, 13200000);
    assert.strictEqual(expediaMetrics.annualSavings, 12300000);
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: CARD 6.2 - Revenue & Occupancy Projections (ADR & RevPAR)
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 3: Revenue & Occupancy Analytics (ADR & RevPAR) (Card 6.2)');

  runTest('Calculates 12-month projections with ADR and RevPAR metrics', () => {
    const projections = calculate12MonthProjections({
      monthlyBookings: 45,
      avgBookingValue: 150000,
      otaCommissionRate: 0.20,
      totalResortRooms: 40,
    });

    assert.strictEqual(projections.monthlyData.length, 12);
    assert.ok(projections.summary.totalGross > 0);
    assert.ok(projections.summary.avgOccupancy > 0 && projections.summary.avgOccupancy <= 100);
    assert.ok(projections.summary.avgAdr > 0);
    assert.ok(projections.summary.avgRevpar > 0);
  });

  runTest('Verifies mathematical formulas for ADR and RevPAR', () => {
    const projections = calculate12MonthProjections({
      monthlyBookings: 40,
      avgBookingValue: 120000,
      totalResortRooms: 40,
      avgLengthOfStay: 2,
    });

    // January: 31 days, available nights = 40 * 31 = 1240
    // Bookings = 40 * 1.10 = 44; occupied nights = 88
    // grossRevenue = 44 * 120,000 = 5,280,000
    const jan = projections.monthlyData[0];
    assert.strictEqual(jan.month, 'January');
    assert.strictEqual(jan.availableNights, 1240);
    assert.strictEqual(jan.adr, Math.round(jan.grossRevenue / jan.occupiedNights));
    assert.strictEqual(jan.revpar, Math.round(jan.grossRevenue / jan.availableNights));
  });

  runTest('Identifies Detty December as highest gross revenue and occupancy month', () => {
    const projections = calculate12MonthProjections({ monthlyBookings: 50 });
    const dec = projections.monthlyData.find((m) => m.month === 'December');
    const jun = projections.monthlyData.find((m) => m.month === 'June');

    assert.ok(dec.grossRevenue > jun.grossRevenue);
    assert.ok(dec.occupancyRate > jun.occupancyRate);
    assert.ok(dec.revpar > jun.revpar);
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: CARD 6.2 - Executive 12-Month CSV Export
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 4: Executive 12-Month Financial CSV Statement (Card 6.2)');

  runTest('Generates standard CSV document with header banner and columns', () => {
    const csv = generateFinancialStatementCsv({
      monthlyBookings: 45,
      avgBookingValue: 150000,
      otaCommissionRate: 0.20,
    });

    assert.ok(csv.includes('# OXYGEN ORBIS HOTEL & RESORT — DIRECT BOOKING FINANCIAL PROJECTIONS'));
    assert.ok(csv.includes('Month,Projected Bookings,Gross Revenue (NGN)'));
    assert.ok(csv.includes('Occupancy Rate (%),ADR (NGN),RevPAR (NGN)'));
    assert.ok(csv.includes('ANNUAL TOTAL'));
  });

  runTest('Contains exactly 12 individual calendar month rows', () => {
    const csv = generateFinancialStatementCsv();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((m) => {
      assert.ok(csv.includes(m), `CSV should include month ${m}`);
    });
  });

  runTest('Reflects Detty December peak surge in December projections', () => {
    const csv = generateFinancialStatementCsv({
      monthlyBookings: 40,
      avgBookingValue: 100000,
    });

    const lines = csv.split('\n');
    const decLine = lines.find((l) => l.startsWith('December'));
    const novLine = lines.find((l) => l.startsWith('November'));

    assert.ok(decLine, 'December line must exist in CSV');
    assert.ok(novLine, 'November line must exist in CSV');

    const decBookings = Number(decLine.split(',')[1]);
    const novBookings = Number(novLine.split(',')[1]);

    // December has 1.35x multiplier vs 1.10x November
    assert.ok(decBookings > novBookings, 'December bookings must exceed November due to Detty December peak');
  });

  console.log('\n================================================================');
  console.log(`📊 MODULE 6 SUMMARY: ${passedTests}/15 TESTS PASSED`);
  console.log('🎉 ALL MODULE 6 TESTS (DYNAMIC RATES & REVENUE) PASSED PERFECTLY!');
  console.log('================================================================\n');
}

executeTestSuite();

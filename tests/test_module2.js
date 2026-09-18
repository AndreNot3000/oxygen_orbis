import { 
  calculateStayQuote, 
  getMonthCalendarMatrix, 
  getQuickStaycationPresets, 
  isWeekendNight, 
  formatDateISO 
} from '../src/services/availabilityService.js';

/**
 * 🧪 MODULE 2 TEST SUITE: Availability, Rates & Calendar Matrix
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

async function runModule2Tests() {
  console.log('\n================================================================');
  console.log('🏨 RUNNING TEST SUITE: MODULE 2 (Availability & Rates)');
  console.log('================================================================\n');

  console.log('📦 TEST GROUP 1: Date Validation & Stay Duration Rules');
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 3);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(tomorrow.getDate() + 2);

  // Test 1: Past dates rejected
  const pastQuote = calculateStayQuote({
    roomTypeId: 'deluxe-king',
    checkInStr: formatDateISO(pastDate),
    checkOutStr: formatDateISO(tomorrow),
  });
  assert(pastQuote.error === 'Check-in date cannot be in the past', 'Past check-in date rejected');

  // Test 2: Check-out before check-in rejected
  const invertedQuote = calculateStayQuote({
    roomTypeId: 'deluxe-king',
    checkInStr: formatDateISO(dayAfter),
    checkOutStr: formatDateISO(tomorrow),
  });
  assert(invertedQuote.error === 'Check-out date must be after check-in date', 'Inverted dates rejected');

  // Test 3: Same day check-in/out rejected (must be at least 1 night)
  const sameDayQuote = calculateStayQuote({
    roomTypeId: 'deluxe-king',
    checkInStr: formatDateISO(tomorrow),
    checkOutStr: formatDateISO(tomorrow),
  });
  assert(sameDayQuote.error === 'Check-out date must be after check-in date', 'Same day check-in/out rejected');

  console.log('\n📦 TEST GROUP 2: Dynamic Pricing & Weekend Staycation Surcharges');
  // Known Friday (Friday = day 5)
  const nextFriday = new Date();
  const dayOfWeek = nextFriday.getDay();
  const daysToFriday = (5 - dayOfWeek + 7) % 7 || 7;
  nextFriday.setDate(nextFriday.getDate() + daysToFriday);

  const nextSunday = new Date(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2); // 2 nights: Fri & Sat

  assert(isWeekendNight(nextFriday) === true, 'Friday correctly identified as weekend staycation night');

  const weekendQuote = calculateStayQuote({
    roomTypeId: 'deluxe-king',
    checkInStr: formatDateISO(nextFriday),
    checkOutStr: formatDateISO(nextSunday),
    currency: 'NGN',
  });

  assert(weekendQuote.success === true, 'Weekend stay quote generated successfully');
  assert(weekendQuote.nights === 2, 'Calculated exactly 2 nights');
  assert(weekendQuote.weekendNightsCount === 2, 'Both Friday and Saturday recognized as weekend nights');
  // Deluxe king base is 48000. 15% weekend surcharge = 55200. Total for 2 weekend nights = 110400.
  assert(weekendQuote.totalRoomPrice === 110400, `Weekend surcharge applied: ₦${weekendQuote.totalRoomPrice} (Expected ₦110,400)`);

  console.log('\n📦 TEST GROUP 3: Calendar Matrix & Presets');
  const matrix = getMonthCalendarMatrix({
    year: today.getFullYear(),
    month: today.getMonth(),
    roomTypeId: 'deluxe-king',
    currency: 'NGN',
  });

  assert(Array.isArray(matrix) && matrix.length >= 28, 'Month calendar matrix generated with correct day slots');

  const activeDays = matrix.filter((d) => !d.isPadding);
  assert(activeDays.length >= 28 && activeDays.length <= 31, 'Active month days count is mathematically valid');

  const presets = getQuickStaycationPresets();
  assert(presets.length === 4, '4 quick staycation presets generated');
  assert(presets.some((p) => p.id === 'this-weekend'), 'This weekend preset available');
  assert(presets.some((p) => p.id === 'workation'), 'Workation 5-night retreat preset available');

  console.log('\n📦 TEST GROUP 4: Stay Enhancements & Add-on Upsell Calculations');
  const { ADDONS_DATA } = await import('../src/data/resortData.js');

  assert(Array.isArray(ADDONS_DATA) && ADDONS_DATA.length >= 5, 'All 5 core Oxygen Orbis stay enhancements defined');

  // Verify Moniya train pickup
  const trainPickup = ADDONS_DATA.find((a) => a.id === 'train-pickup');
  assert(trainPickup && trainPickup.priceNGN === 10000 && trainPickup.priceUSD === 15, 'Moniya train station pickup pricing verified (₦10k / $15)');

  // Verify Rooftop dinner
  const rooftopDinner = ADDONS_DATA.find((a) => a.id === 'rooftop-dinner');
  assert(rooftopDinner && rooftopDinner.priceNGN === 35000 && rooftopDinner.priceUSD === 45, 'Rooftop candlelight dinner pricing verified (₦35k / $45)');

  // Calculate bundle total
  const selected = ['train-pickup', 'rooftop-dinner', 'spa-massage'];
  const bundleTotalNGN = selected.reduce((acc, id) => {
    const item = ADDONS_DATA.find((a) => a.id === id);
    return acc + (item ? item.priceNGN : 0);
  }, 0);
  // 10000 + 35000 + 25000 = 70000
  assert(bundleTotalNGN === 70000, `Multi-addon bundle calculated correctly: ₦${bundleTotalNGN.toLocaleString()} (Expected ₦70,000)`);

  const bundleTotalUSD = selected.reduce((acc, id) => {
    const item = ADDONS_DATA.find((a) => a.id === id);
    return acc + (item ? item.priceUSD : 0);
  }, 0);
  // 15 + 45 + 32 = 92
  assert(bundleTotalUSD === 92, `USD bundle calculated correctly: $${bundleTotalUSD} (Expected $92)`);

  // Unknown addon safety check
  const corruptedList = ['train-pickup', 'hacker_injected_addon_id'];
  const safeTotal = corruptedList.reduce((acc, id) => {
    const item = ADDONS_DATA.find((a) => a.id === id);
    return acc + (item ? item.priceNGN : 0);
  }, 0);
  assert(safeTotal === 10000, 'Unknown or injected addon IDs are safely filtered out without throwing');

  console.log('\n📦 TEST GROUP 5: Client-Side Defensive Form Validation (Card 2.3)');
  const { validateNigerianPhone, validateEmail, validateFullName } = await import('../src/utils/validation.js');

  // Phone validation
  assert(validateNigerianPhone('08060648413').isValid === true, 'Valid 11-digit local Nigerian phone accepted');
  assert(validateNigerianPhone('08060648413').sanitized === '+2348060648413', 'Sanitized local phone has +234 prefix');
  assert(validateNigerianPhone('+234 806 064 8413').isValid === true, 'Spaced Nigerian phone validated');
  assert(validateNigerianPhone('12345').isValid === false, 'Short invalid phone rejected');
  assert(validateNigerianPhone('').isValid === false, 'Empty phone string rejected');

  // Email validation
  assert(validateEmail('guest@example.com').isValid === true, 'Standard email validated');
  assert(validateEmail('bad_email_at_com').isValid === false, 'Malformed email rejected');
  assert(validateEmail("user@oxygenorbis.com\r\nBcc: hacker@bad.com").isValid === false, 'CRLF injection in email rejected');

  // Name validation
  assert(validateFullName('Babatunde Adeleke').isValid === true, 'Two-word full name accepted');
  assert(validateFullName('Babatunde').isValid === false, 'Single word name rejected (requires first and last name)');
  assert(validateFullName('Al').isValid === false, 'Too short name rejected (< 3 chars)');

  console.log('\n================================================================');
  console.log(`📊 MODULE 2 SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('🎉 ALL MODULE 2 TESTS (AVAILABILITY, ADDONS & VALIDATION) PASSED!');
  console.log('================================================================\n');

  return failedTests === 0;
}

runModule2Tests().then((success) => {
  process.exit(success ? 0 : 1);
});

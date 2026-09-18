/**
 * 📈 REVENUE ANALYTICS & DYNAMIC RATE MANAGEMENT SERVICE (MODULE 6)
 * Handles seasonal pricing surcharges, holiday rate overrides,
 * direct vs. OTA commission savings calculations, and financial CSV exports.
 */

export const DEFAULT_RATE_RULES = {
  baseRates: {
    'deluxe-king': 48000,
    'executive-room': 72000,
    'presidential-suite': 145000,
  },
  weekendSurgePercentage: 15, // 15% surge on Friday and Saturday
  holidayOverrides: [
    {
      id: 'independence',
      name: 'Independence Staycation Weekend',
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      surgePercentage: 20,
      minNights: 2,
    },
    {
      id: 'detty-december',
      name: 'Detty December & New Year Peak',
      startDate: '2026-12-18',
      endDate: '2027-01-05',
      surgePercentage: 35,
      minNights: 3,
    },
    {
      id: 'easter',
      name: 'Easter Serenity Retreat',
      startDate: '2027-03-26',
      endDate: '2027-03-30',
      surgePercentage: 25,
      minNights: 2,
    },
  ],
};

/**
 * Computes dynamic rate for a room category on a specific date.
 * Enforces priority: Holiday Override > Weekend Staycation Surge > Base Rate.
 * 
 * @param {string} roomTypeId 
 * @param {string|Date} dateInput 
 * @param {Object} [rules] 
 * @returns {Object} { rate: number, pricingTier: string, appliedSurgePct: number }
 */
export function calculateDynamicNightRate(roomTypeId, dateInput, rules = DEFAULT_RATE_RULES) {
  const baseRate = rules.baseRates[roomTypeId] || 48000;
  
  let date;
  let dateStr;
  if (typeof dateInput === 'string') {
    dateStr = dateInput.slice(0, 10);
    const [y, m, d] = dateStr.split('-').map(Number);
    date = new Date(y, m - 1, d, 12, 0, 0); // Noon prevents UTC/midnight day shift
  } else {
    date = dateInput;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }
  const dayOfWeek = date.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

  // 1. Check Holiday Overrides
  const holiday = rules.holidayOverrides.find(
    (h) => dateStr >= h.startDate && dateStr <= h.endDate
  );

  if (holiday) {
    const surge = Math.round(baseRate * (holiday.surgePercentage / 100));
    return {
      rate: baseRate + surge,
      pricingTier: 'HOLIDAY_PEAK',
      appliedSurgePct: holiday.surgePercentage,
      reason: holiday.name,
    };
  }

  // 2. Check Weekend Staycation Surge (Friday and Saturday nights)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    const surge = Math.round(baseRate * (rules.weekendSurgePercentage / 100));
    return {
      rate: baseRate + surge,
      pricingTier: 'WEEKEND_STAYCATION',
      appliedSurgePct: rules.weekendSurgePercentage,
      reason: 'Weekend Staycation Rush (Fri/Sat)',
    };
  }

  // 3. Standard Midweek Rate
  return {
    rate: baseRate,
    pricingTier: 'MIDWEEK_STANDARD',
    appliedSurgePct: 0,
    reason: 'Standard Midweek Tranquility Rate',
  };
}

/**
 * Calculates stay quote across a multi-night stay range using dynamic nightly pricing.
 * Computes exact daily sums, highest surge applied, and verifies minimum night stay policies.
 * 
 * @param {Object} params
 * @param {string} params.roomTypeId
 * @param {string} params.checkInStr - 'YYYY-MM-DD'
 * @param {string} params.checkOutStr - 'YYYY-MM-DD'
 * @param {string} [params.currency='NGN']
 * @param {Object} [params.rules]
 * @returns {Object} Stay quote breakdown
 */
export function calculateStayDynamicQuote({
  roomTypeId,
  checkInStr,
  checkOutStr,
  currency = 'NGN',
  rules = DEFAULT_RATE_RULES,
}) {
  if (!checkInStr || !checkOutStr) {
    const baseRate = rules.baseRates[roomTypeId] || 48000;
    const rateInCurrency = currency === 'USD' ? Math.round(baseRate / 750) : baseRate;
    return {
      nights: 1,
      totalRoomPrice: rateInCurrency,
      highestSurge: 0,
      primaryReason: 'Standard Midweek Rate',
      primaryTier: 'MIDWEEK_STANDARD',
      requiredMinNights: 1,
      isMinStaySatisfied: true,
      dailyBreakdown: [],
    };
  }

  const [y1, m1, d1] = checkInStr.split('-').map(Number);
  const [y2, m2, d2] = checkOutStr.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 12, 0, 0);

  const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  let total = 0;
  let highestSurge = 0;
  let primaryReason = 'Standard Midweek Rate';
  let primaryTier = 'MIDWEEK_STANDARD';
  let requiredMinNights = 1;
  const dailyBreakdown = [];

  const current = new Date(start);
  while (current < end) {
    const curStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const quote = calculateDynamicNightRate(roomTypeId, curStr, rules);
    
    // Check holiday min nights
    const holiday = rules.holidayOverrides.find((h) => curStr >= h.startDate && curStr <= h.endDate);
    if (holiday && holiday.minNights > requiredMinNights) {
      requiredMinNights = holiday.minNights;
    }

    if (quote.appliedSurgePct > highestSurge) {
      highestSurge = quote.appliedSurgePct;
      primaryReason = quote.reason;
      primaryTier = quote.pricingTier;
    }

    const rateInCurrency = currency === 'USD' ? Math.round(quote.rate / 750) : quote.rate;
    total += rateInCurrency;
    dailyBreakdown.push({
      date: curStr,
      rate: rateInCurrency,
      tier: quote.pricingTier,
      reason: quote.reason,
      surge: quote.appliedSurgePct,
    });
    current.setDate(current.getDate() + 1);
  }

  return {
    nights,
    totalRoomPrice: total,
    highestSurge,
    primaryReason,
    primaryTier,
    requiredMinNights,
    isMinStaySatisfied: nights >= requiredMinNights,
    dailyBreakdown,
  };
}

/**
 * Calculates Direct Booking vs. OTA (Booking.com/Agoda) Commission Comparison
 * 
 * @param {Object} params
 * @param {number} params.monthlyBookings - Total expected reservations per month
 * @param {number} params.avgBookingValue - Average transaction value in NGN
 * @param {number} [params.otaCommissionRate=0.20] - OTA percentage (e.g. 0.20 for 20%)
 * @param {number} [params.paystackFeeRate=0.015] - Direct processor fee (1.5%)
 * @returns {Object} Financial metrics breakdown
 */
export function calculateOtaVsDirectRoi({
  monthlyBookings = 45,
  avgBookingValue = 150000,
  otaCommissionRate = 0.20,
  paystackFeeRate = 0.015,
}) {
  const monthlyGross = monthlyBookings * avgBookingValue;
  const annualGross = monthlyGross * 12;

  // OTA Scenario (Hotel loses 18-20% on every booking)
  const annualOtaLoss = Math.round(annualGross * otaCommissionRate);
  const netRevenueViaOta = annualGross - annualOtaLoss;

  // Direct Booking Scenario (Hotel keeps 98.5%, paying only Paystack 1.5%)
  const annualDirectFee = Math.round(annualGross * paystackFeeRate);
  const netRevenueViaDirect = annualGross - annualDirectFee;

  // Net Savings
  const annualSavings = annualOtaLoss - annualDirectFee;
  const monthlySavings = Math.round(annualSavings / 12);
  const roiMultiplier = ((annualSavings / annualDirectFee) * 100).toFixed(0);

  return {
    monthlyBookings,
    avgBookingValue,
    monthlyGross,
    annualGross,
    otaCommissionRate,
    annualOtaLoss,
    annualDirectFee,
    annualSavings,
    monthlySavings,
    netRevenueViaOta,
    netRevenueViaDirect,
    roiMultiplier,
  };
}

/**
 * Calculates 12-Month Projections for Oxygen Orbis Resort, factoring in
 * local Nigerian seasonal peaks (Detty December, Independence Weekend, Easter, Valentine),
 * total physical room inventory (40 rooms), ADR, RevPAR, and OTA commission savings.
 * 
 * @param {Object} params
 * @param {number} [params.monthlyBookings=45]
 * @param {number} [params.avgBookingValue=150000]
 * @param {number} [params.otaCommissionRate=0.20]
 * @param {number} [params.paystackFeeRate=0.015]
 * @param {number} [params.totalResortRooms=40]
 * @param {number} [params.avgLengthOfStay=2]
 * @returns {Object} { monthlyData: Array, summary: Object }
 */
export function calculate12MonthProjections({
  monthlyBookings = 45,
  avgBookingValue = 150000,
  otaCommissionRate = 0.20,
  paystackFeeRate = 0.015,
  totalResortRooms = 40,
  avgLengthOfStay = 2,
} = {}) {
  const months = [
    { name: 'January', days: 31, seasonality: 1.10, tag: 'New Year & Holiday Spillover' },
    { name: 'February', days: 28, seasonality: 1.05, tag: 'Valentine Staycations' },
    { name: 'March', days: 31, seasonality: 1.00, tag: 'Corporate & Midweek Retreats' },
    { name: 'April', days: 30, seasonality: 1.15, tag: 'Easter Holiday Surge' },
    { name: 'May', days: 31, seasonality: 0.95, tag: 'Standard Midweek Tranquility' },
    { name: 'June', days: 30, seasonality: 0.90, tag: 'Mid-Year Corporate Sessions' },
    { name: 'July', days: 31, seasonality: 1.05, tag: 'Summer Vacationers' },
    { name: 'August', days: 31, seasonality: 1.10, tag: 'Diaspora & Ibadan Festivals' },
    { name: 'September', days: 30, seasonality: 0.95, tag: 'Post-Summer Corporate Bookings' },
    { name: 'October', days: 31, seasonality: 1.15, tag: 'Independence Weekend Peak' },
    { name: 'November', days: 30, seasonality: 1.10, tag: 'Pre-Holiday Staycation Rush' },
    { name: 'December', days: 31, seasonality: 1.35, tag: 'Detty December & New Year Peak' },
  ];

  let totalBookings = 0;
  let totalGross = 0;
  let totalOtaLoss = 0;
  let totalDirectFee = 0;
  let totalNetDirect = 0;
  let totalSavings = 0;
  let totalOccupiedNights = 0;
  let totalAvailableNights = 0;

  const monthlyData = months.map((m) => {
    const bookings = Math.round(monthlyBookings * m.seasonality);
    const grossRevenue = bookings * avgBookingValue;
    const otaLoss = Math.round(grossRevenue * otaCommissionRate);
    const directFee = Math.round(grossRevenue * paystackFeeRate);
    const netDirect = grossRevenue - directFee;
    const savings = otaLoss - directFee;

    const availableNights = totalResortRooms * m.days;
    const occupiedNights = bookings * avgLengthOfStay;
    const occupancyRate = Math.min(100, Math.round((occupiedNights / availableNights) * 100));
    const adr = occupiedNights > 0 ? Math.round(grossRevenue / occupiedNights) : 0;
    const revpar = availableNights > 0 ? Math.round(grossRevenue / availableNights) : 0;

    totalBookings += bookings;
    totalGross += grossRevenue;
    totalOtaLoss += otaLoss;
    totalDirectFee += directFee;
    totalNetDirect += netDirect;
    totalSavings += savings;
    totalOccupiedNights += occupiedNights;
    totalAvailableNights += availableNights;

    return {
      month: m.name,
      shortMonth: m.name.slice(0, 3),
      days: m.days,
      tag: m.tag,
      seasonality: m.seasonality,
      bookings,
      occupiedNights,
      availableNights,
      grossRevenue,
      otaLoss,
      directFee,
      netDirect,
      savings,
      occupancyRate,
      adr,
      revpar,
    };
  });

  const avgOccupancy = totalAvailableNights > 0 ? Math.round((totalOccupiedNights / totalAvailableNights) * 100) : 0;
  const avgAdr = totalOccupiedNights > 0 ? Math.round(totalGross / totalOccupiedNights) : 0;
  const avgRevpar = totalAvailableNights > 0 ? Math.round(totalGross / totalAvailableNights) : 0;

  return {
    monthlyData,
    summary: {
      totalBookings,
      totalGross,
      totalOtaLoss,
      totalDirectFee,
      totalNetDirect,
      totalSavings,
      totalOccupiedNights,
      totalAvailableNights,
      avgOccupancy,
      avgAdr,
      avgRevpar,
      otaCommissionRate,
    },
  };
}

/**
 * Generates an executive 12-Month Financial Statement CSV for resort management and ownership.
 * Includes Monthly Gross Revenue, Direct Savings vs OTAs, Occupancy %, ADR, and RevPAR.
 * 
 * @param {Object} params 
 * @returns {string} CSV formatted content string
 */
export function generateFinancialStatementCsv(params = {}) {
  const { monthlyData, summary } = calculate12MonthProjections(params);

  const headers = [
    'Month',
    'Projected Bookings',
    'Gross Revenue (NGN)',
    `OTA Commission If Third-Party (${(summary.otaCommissionRate * 100).toFixed(0)}%)`,
    'Paystack Direct Fee (1.5%)',
    'Net Direct Retained (NGN)',
    'Direct Booking Profit Retained (NGN)',
    'Occupancy Rate (%)',
    'ADR (NGN)',
    'RevPAR (NGN)',
  ];

  const rows = monthlyData.map((m) => [
    m.month,
    m.bookings,
    m.grossRevenue,
    m.otaLoss,
    m.directFee,
    m.netDirect,
    m.savings,
    `${m.occupancyRate}%`,
    m.adr,
    m.revpar,
  ].join(','));

  // Summary Row with exact seasonal sums & weighted averages
  const summaryRow = [
    'ANNUAL TOTAL',
    summary.totalBookings,
    summary.totalGross,
    summary.totalOtaLoss,
    summary.totalDirectFee,
    summary.totalNetDirect,
    summary.totalSavings,
    `${summary.avgOccupancy}%`,
    summary.avgAdr,
    summary.avgRevpar,
  ].join(',');

  return [
    `# OXYGEN ORBIS HOTEL & RESORT — DIRECT BOOKING FINANCIAL PROJECTIONS`,
    `# Generated for Management Review: Moniya Ibadan`,
    headers.join(','),
    ...rows,
    summaryRow,
  ].join('\n');
}

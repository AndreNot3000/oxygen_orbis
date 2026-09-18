import { ROOMS_DATA } from '../data/resortData.js';

/**
 * 🏨 OXYGEN ORBIS AVAILABILITY & CALENDAR ENGINE
 * Real-time inventory calculation, weekend rate modeling (Fri/Sat staycation surge),
 * and quick-date preset generators.
 */

// Simulated booked dates for realistic resort availability demo
const SIMULATED_BLOCKED_DATES = new Set([
  // Format: 'YYYY-MM-DD'
]);

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a specific date is a Friday or Saturday night (peak staycation demand in Ibadan)
 */
export function isWeekendNight(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // 5 = Friday, 6 = Saturday
}

/**
 * Generates itemized day-by-day rates for a staycation range.
 * Adds a 15% luxury weekend surcharge for Friday/Saturday stays.
 */
export function calculateStayQuote({
  roomTypeId,
  checkInStr,
  checkOutStr,
  currency = 'NGN',
}) {
  const room = ROOMS_DATA.find((r) => r.id === roomTypeId) || ROOMS_DATA[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(checkInStr);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutStr);
  checkOut.setHours(0, 0, 0, 0);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { error: 'Invalid dates selected' };
  }

  if (checkIn < today) {
    return { error: 'Check-in date cannot be in the past' };
  }

  if (checkOut <= checkIn) {
    return { error: 'Check-out date must be after check-in date' };
  }

  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (nights > 30) {
    return { error: 'Maximum stay is 30 nights' };
  }

  const dailyBreakdown = [];
  let totalRoomPrice = 0;
  let weekendNightsCount = 0;

  const current = new Date(checkIn);
  while (current < checkOut) {
    const isWeekend = isWeekendNight(current);
    const dateStr = formatDateISO(current);

    if (isWeekend) weekendNightsCount++;

    const baseRate = currency === 'USD' ? room.priceUSD : room.priceNGN;
    // 15% weekend staycation rate adjustment for Friday/Saturday
    const dayRate = isWeekend ? Math.round(baseRate * 1.15) : baseRate;

    dailyBreakdown.push({
      date: dateStr,
      isWeekend,
      rate: dayRate,
    });

    totalRoomPrice += dayRate;
    current.setDate(current.getDate() + 1);
  }

  const avgNightlyRate = Math.round(totalRoomPrice / nights);

  return {
    success: true,
    room,
    checkIn: formatDateISO(checkIn),
    checkOut: formatDateISO(checkOut),
    nights,
    weekendNightsCount,
    currency,
    dailyBreakdown,
    totalRoomPrice,
    avgNightlyRate,
    formattedTotal: currency === 'USD' ? `$${totalRoomPrice.toLocaleString()}` : `₦${totalRoomPrice.toLocaleString()}`,
    formattedAvgRate: currency === 'USD' ? `$${avgNightlyRate.toLocaleString()}` : `₦${avgNightlyRate.toLocaleString()}`,
  };
}

/**
 * Returns month calendar days for visual rate matrix.
 */
export function getMonthCalendarMatrix({ year, month, roomTypeId, currency = 'NGN' }) {
  const room = ROOMS_DATA.find((r) => r.id === roomTypeId) || ROOMS_DATA[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const days = [];

  // Padding days from previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ isPadding: true });
  }

  // Active days in month
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    currentDate.setHours(0, 0, 0, 0);
    const dateStr = formatDateISO(currentDate);

    const isPast = currentDate < today;
    const isWeekend = isWeekendNight(currentDate);
    const isBlocked = SIMULATED_BLOCKED_DATES.has(dateStr);

    const baseRate = currency === 'USD' ? room.priceUSD : room.priceNGN;
    const rate = isWeekend ? Math.round(baseRate * 1.15) : baseRate;

    // Remaining rooms simulation based on weekend or date
    const roomsRemaining = isBlocked ? 0 : (isWeekend ? 3 : 8);

    days.push({
      dateStr,
      dayNumber: d,
      isPadding: false,
      isPast,
      isWeekend,
      isAvailable: !isPast && !isBlocked && roomsRemaining > 0,
      roomsRemaining,
      rate,
      formattedRate: currency === 'USD' ? `$${rate}` : `₦${(rate / 1000).toFixed(0)}k`,
    });
  }

  return days;
}

/**
 * Returns quick date presets for popular staycation plans.
 */
export function getQuickStaycationPresets() {
  const today = new Date();

  // Helper to find next target day of week
  const getNextDayOfWeek = (dayOfWeek, refDate = new Date()) => {
    const d = new Date(refDate);
    const currentDay = d.getDay();
    let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7;
    d.setDate(d.getDate() + daysToAdd);
    return d;
  };

  // 1. This Weekend (Upcoming Friday to Sunday)
  const thisFriday = getNextDayOfWeek(5, today);
  const thisSunday = new Date(thisFriday);
  thisSunday.setDate(thisFriday.getDate() + 2);

  // 2. Next Weekend
  const nextFriday = new Date(thisFriday);
  nextFriday.setDate(thisFriday.getDate() + 7);
  const nextSunday = new Date(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2);

  // 3. Midweek Recharge (Next Tuesday to Thursday)
  const nextTuesday = getNextDayOfWeek(2, today);
  const nextThursday = new Date(nextTuesday);
  nextThursday.setDate(nextTuesday.getDate() + 2);

  // 4. 5-Night Workation & Retreat (Next Monday to Saturday)
  const nextMonday = getNextDayOfWeek(1, today);
  const nextSaturday = new Date(nextMonday);
  nextSaturday.setDate(nextMonday.getDate() + 5);

  return [
    {
      id: 'this-weekend',
      label: '🚆 This Weekend (Fri - Sun)',
      subtitle: '2 Nights • Perfect Lagos Escape',
      checkIn: formatDateISO(thisFriday),
      checkOut: formatDateISO(thisSunday),
    },
    {
      id: 'next-weekend',
      label: '🌴 Next Weekend (Fri - Sun)',
      subtitle: '2 Nights • Plan Ahead',
      checkIn: formatDateISO(nextFriday),
      checkOut: formatDateISO(nextSunday),
    },
    {
      id: 'midweek',
      label: '🧘 Midweek Recharge (Tue - Thu)',
      subtitle: '2 Nights • Quiet & Peaceful',
      checkIn: formatDateISO(nextTuesday),
      checkOut: formatDateISO(nextThursday),
    },
    {
      id: 'workation',
      label: '💼 5-Night Retreat (Mon - Sat)',
      subtitle: '5 Nights • Fiber Wi-Fi & Pool',
      checkIn: formatDateISO(nextMonday),
      checkOut: formatDateISO(nextSaturday),
    },
  ];
}

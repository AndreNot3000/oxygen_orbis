/**
 * 🏨 PROPERTY MANAGEMENT SYSTEM (PMS) CORE SERVICE (MODULE 5)
 * Manages physical inventory across all 40 room units, visual Gantt timeline data,
 * 5-second QR check-in/out workflows, and real-time housekeeping transitions.
 */

// 40 Physical Room Units across 4 Floors at Oxygen Orbis
export const INITIAL_ROOM_UNITS = [
  // Floor 1 — Ground Courtyard & Cabins (101 - 110)
  { unitNumber: '101', floor: 1, typeId: 'standard-room', typeName: 'Standard Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 33000 },
  { unitNumber: '102', floor: 1, typeId: 'standard-room', typeName: 'Standard Room', status: 'OCCUPIED', housekeeping: 'INSPECTED_CLEAN', currentGuest: 'Adewale Bakare', currentBookingRef: 'OXY-102941', priceNGN: 33000 },
  { unitNumber: '103', floor: 1, typeId: 'standard-room', typeName: 'Standard Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 33000 },
  { unitNumber: '104', floor: 1, typeId: 'single-cabin', typeName: 'Single Cabin', status: 'DIRTY', housekeeping: 'DIRTY', priceNGN: 35000 },
  { unitNumber: '105', floor: 1, typeId: 'single-cabin', typeName: 'Single Cabin', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 35000 },
  { unitNumber: '106', floor: 1, typeId: 'classic-room', typeName: 'Classic Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 38000 },
  { unitNumber: '107', floor: 1, typeId: 'classic-room', typeName: 'Classic Room', status: 'MAINTENANCE', housekeeping: 'BLOCKED', notes: 'AC Compressor servicing', priceNGN: 38000 },
  { unitNumber: '108', floor: 1, typeId: 'classic-room', typeName: 'Classic Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 38000 },
  { unitNumber: '109', floor: 1, typeId: 'standard-plus', typeName: 'Standard Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 40000 },
  { unitNumber: '110', floor: 1, typeId: 'standard-plus', typeName: 'Standard Plus', status: 'DIRTY', housekeeping: 'CLEANING_IN_PROGRESS', priceNGN: 40000 },

  // Floor 2 — Upper Garden Sanctuary (201 - 210)
  { unitNumber: '201', floor: 2, typeId: 'classic-plus', typeName: 'Classic Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 45000 },
  { unitNumber: '202', floor: 2, typeId: 'classic-plus', typeName: 'Classic Plus', status: 'OCCUPIED', housekeeping: 'INSPECTED_CLEAN', currentGuest: 'Engr. Dapo Alabi', currentBookingRef: 'OXY-202819', priceNGN: 45000 },
  { unitNumber: '203', floor: 2, typeId: 'classic-plus', typeName: 'Classic Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 45000 },
  { unitNumber: '204', floor: 2, typeId: 'deluxe-king', typeName: 'Deluxe Room', status: 'RESERVED', housekeeping: 'INSPECTED_CLEAN', reservedFor: 'Upcoming Arrival', currentBookingRef: 'OXY-489218', priceNGN: 48000 },
  { unitNumber: '205', floor: 2, typeId: 'deluxe-king', typeName: 'Deluxe Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 48000 },
  { unitNumber: '206', floor: 2, typeId: 'deluxe-king', typeName: 'Deluxe Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 48000 },
  { unitNumber: '207', floor: 2, typeId: 'deluxe-king', typeName: 'Deluxe Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 48000 },
  { unitNumber: '208', floor: 2, typeId: 'deluxe-plus', typeName: 'Deluxe Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 55000 },
  { unitNumber: '209', floor: 2, typeId: 'deluxe-plus', typeName: 'Deluxe Plus', status: 'DIRTY', housekeeping: 'DIRTY', priceNGN: 55000 },
  { unitNumber: '210', floor: 2, typeId: 'deluxe-plus', typeName: 'Deluxe Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 55000 },

  // Floor 3 — Poolside & Diplomatic Wing (301 - 310)
  { unitNumber: '301', floor: 3, typeId: 'diplomatic-room', typeName: 'Diplomatic Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 60000 },
  { unitNumber: '302', floor: 3, typeId: 'diplomatic-room', typeName: 'Diplomatic Room', status: 'OCCUPIED', housekeeping: 'INSPECTED_CLEAN', currentGuest: 'Mrs. Folake K.', currentBookingRef: 'OXY-302194', priceNGN: 60000 },
  { unitNumber: '303', floor: 3, typeId: 'diplomatic-room', typeName: 'Diplomatic Room', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 60000 },
  { unitNumber: '304', floor: 3, typeId: 'diplomatic-plus', typeName: 'Diplomatic Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 65000 },
  { unitNumber: '305', floor: 3, typeId: 'diplomatic-plus', typeName: 'Diplomatic Plus', status: 'RESERVED', housekeeping: 'INSPECTED_CLEAN', currentBookingRef: 'OXY-305912', priceNGN: 65000 },
  { unitNumber: '306', floor: 3, typeId: 'diplomatic-plus', typeName: 'Diplomatic Plus', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 65000 },
  { unitNumber: '307', floor: 3, typeId: 'junior-cabin', typeName: 'Junior Cabin', status: 'DIRTY', housekeeping: 'DIRTY', priceNGN: 80000 },
  { unitNumber: '308', floor: 3, typeId: 'junior-cabin', typeName: 'Junior Cabin', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 80000 },
  { unitNumber: '309', floor: 3, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
  { unitNumber: '310', floor: 3, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },

  // Floor 4 — Grand Chalet & Executive Suites Wing (401 - 410)
  { unitNumber: '401', floor: 4, typeId: 'senior-cabin', typeName: 'Senior Cabin', status: 'OCCUPIED', housekeeping: 'INSPECTED_CLEAN', currentGuest: 'Senator B. Adeleke', currentBookingRef: 'OXY-401001', priceNGN: 100000 },
  { unitNumber: '402', floor: 4, typeId: 'senior-cabin', typeName: 'Senior Cabin', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 100000 },
  { unitNumber: '403', floor: 4, typeId: 'senior-cabin', typeName: 'Senior Cabin', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 100000 },
  { unitNumber: '404', floor: 4, typeId: 'senior-cabin', typeName: 'Senior Cabin', status: 'DIRTY', housekeeping: 'CLEANING_IN_PROGRESS', priceNGN: 100000 },
  { unitNumber: '405', floor: 4, typeId: 'senior-cabin', typeName: 'Senior Cabin', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 100000 },
  { unitNumber: '406', floor: 4, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
  { unitNumber: '407', floor: 4, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
  { unitNumber: '408', floor: 4, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
  { unitNumber: '409', floor: 4, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
  { unitNumber: '410', floor: 4, typeId: 'executive-suite', typeName: 'Executive Suite', status: 'AVAILABLE', housekeeping: 'INSPECTED_CLEAN', priceNGN: 83000 },
];

/**
 * Pre-seeded reservations for the Front Desk PMS Timeline
 */
export const INITIAL_PMS_RESERVATIONS = [
  {
    id: 'res_01',
    bookingRef: 'OXY-489218',
    guestName: 'Babatunde Adeleke',
    guestPhone: '+2348060648413',
    guestEmail: 'babatunde@example.com',
    roomTypeId: 'deluxe-king',
    roomTypeName: 'Deluxe Room',
    unitNumber: '204',
    checkIn: '2026-10-02',
    checkOut: '2026-10-04',
    nights: 2,
    guests: 2,
    totalAmount: 110400,
    status: 'CONFIRMED',
    paymentStatus: 'PAID_PAYSTACK',
    addons: ['Moniya Train VIP Pickup', 'Romantic Rooftop Dinner'],
    notes: 'Arriving on 2:30 PM Lagos train from Ebute Metta station',
  },
  {
    id: 'res_02',
    bookingRef: 'OXY-102941',
    guestName: 'Adewale Bakare',
    guestPhone: '+2348023456789',
    guestEmail: 'adewale@example.com',
    roomTypeId: 'standard-room',
    roomTypeName: 'Standard Room',
    unitNumber: '102',
    checkIn: '2026-09-30',
    checkOut: '2026-10-03',
    nights: 3,
    guests: 2,
    totalAmount: 99000,
    status: 'CHECKED_IN',
    paymentStatus: 'PAID_TRANSFER',
    addons: ['Oxygen Signature Spa Massage'],
  },
  {
    id: 'res_03',
    bookingRef: 'OXY-401001',
    guestName: 'Senator B. Adeleke',
    guestPhone: '+2348039876543',
    guestEmail: 'senator@example.com',
    roomTypeId: 'senior-cabin',
    roomTypeName: 'Senior Cabin',
    unitNumber: '401',
    checkIn: '2026-10-01',
    checkOut: '2026-10-05',
    nights: 4,
    guests: 4,
    totalAmount: 400000,
    status: 'CHECKED_IN',
    paymentStatus: 'PAID_PAYSTACK',
    addons: ['Chilled Champagne on Arrival', 'VIP Train Pickup'],
  },
];

/**
 * Pre-seeded manual bank transfers awaiting verification
 */
export const INITIAL_PENDING_TRANSFERS = [
  {
    id: 'xfer_01',
    bookingReference: 'OXY-981240',
    guestName: 'Dr. Kemi Adeleke',
    guestPhone: '+2348060648413',
    amount: 100000,
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0789234512',
    narration: '#OXY-981240',
    receiptFileName: 'gtworld_transfer_100k.png',
    receiptFileSize: '1.4 MB',
    submittedAt: '10 mins ago',
    status: 'AWAITING_VERIFICATION',
    roomType: 'Senior Cabin',
  },
  {
    id: 'xfer_02',
    bookingReference: 'OXY-872319',
    guestName: 'Folarin Ogunbanjo',
    guestPhone: '+2348123456789',
    amount: 83000,
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0789234512',
    narration: '#OXY-872319',
    receiptFileName: 'zenith_mobile_83k.jpg',
    receiptFileSize: '820 KB',
    submittedAt: '4 mins ago',
    status: 'AWAITING_VERIFICATION',
    roomType: 'Executive Suite',
  },
];

/**
 * Validates check-in safety: ensures room is inspected clean and not blocked.
 */
export function canCheckInToRoom(unit) {
  if (!unit) return { allowed: false, reason: 'Room unit not found.' };
  if (unit.status === 'OCCUPIED') return { allowed: false, reason: `Room ${unit.unitNumber} is currently occupied by another guest.` };
  if (unit.status === 'MAINTENANCE' || unit.housekeeping === 'BLOCKED') return { allowed: false, reason: `Room ${unit.unitNumber} is under maintenance.` };
  if (unit.housekeeping === 'DIRTY' || unit.housekeeping === 'CLEANING_IN_PROGRESS') {
    return { allowed: false, reason: `Room ${unit.unitNumber} is currently dirty/cleaning. Must be INSPECTED_CLEAN before guest check-in.` };
  }
  return { allowed: true };
}

/**
 * Calculates real-time PMS operational statistics
 */
export function calculatePmsStats(rooms, reservations) {
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const dirtyCount = rooms.filter((r) => r.housekeeping === 'DIRTY' || r.housekeeping === 'CLEANING_IN_PROGRESS').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE' && r.housekeeping === 'INSPECTED_CLEAN').length;
  const occupancyPercentage = Math.round((occupiedCount / totalRooms) * 100);

  return {
    totalRooms,
    occupiedCount,
    availableCount,
    dirtyCount,
    maintenanceCount,
    occupancyPercentage,
  };
}

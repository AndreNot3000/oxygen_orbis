import React, { useState } from 'react';
import { 
  X, Shield, Calendar, QrCode, CheckCircle2, AlertTriangle, 
  Sparkles, BedDouble, Users, Clock, Check, ArrowRight, 
  RefreshCw, Search, Smartphone, DollarSign, FileText, Send, UserCheck, Plus,
  Lock, LogOut, KeyRound, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { 
  INITIAL_ROOM_UNITS, 
  INITIAL_PMS_RESERVATIONS, 
  INITIAL_PENDING_TRANSFERS,
  canCheckInToRoom,
  calculatePmsStats,
  getRelativeDateStr,
  generateTimelineDates
} from '../services/pmsService';
import { generateSignedPassPayload, verifySignedPass } from '../services/digitalPassService';
import { dispatchWhatsAppMessage, formatStaffAlertMessage } from '../services/whatsappDispatcher';
import { RESORT_INFO, ROOMS_DATA } from '../data/resortData';

// Authorized Staff Directory & Credentials for Front Desk Security Gate
export const AUTHORIZED_STAFF_MEMBERS = [
  {
    pin: '1974',
    name: 'Tola Adeyemi',
    role: 'Front Desk Lead',
    badge: 'FRONT DESK OFFICER',
    department: 'Reception & Guest Services',
    avatar: '👩🏾‍💼',
    shift: 'Day Shift (Active)',
  },
  {
    pin: '2026',
    name: 'Engr. Ibrahim Sanusi',
    role: 'Duty Manager / Operations Lead',
    badge: 'GENERAL MANAGEMENT',
    department: 'Resort Executive Suite',
    avatar: '👨🏾‍💼',
    shift: 'Executive Oversight',
  },
];

export default function StaffPortalModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Active Tab: 'timeline' | 'scanner' | 'housekeeping' | 'transfers' | 'walkin'
  const [activeTab, setActiveTab] = useState('timeline');

  // PMS Data State
  const [rooms, setRooms] = useState(INITIAL_ROOM_UNITS);
  const [reservations, setReservations] = useState(INITIAL_PMS_RESERVATIONS);
  const [pendingTransfers, setPendingTransfers] = useState(INITIAL_PENDING_TRANSFERS);

  // Filter States for Timeline Grid
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState(null);
  const [liveActionNotice, setLiveActionNotice] = useState(null);

  // Open Room & Guest Inspection Modal (always brings up stay dossier & actions)
  const handleOpenRoomDetails = (roomUnit) => {
    const currentRoom = rooms.find((r) => r.unitNumber === roomUnit.unitNumber) || roomUnit;
    const reservation = reservations.find(
      (r) => r.unitNumber === currentRoom.unitNumber || (currentRoom.currentBookingRef && r.bookingRef === currentRoom.currentBookingRef)
    );
    setSelectedRoomForDetails({ ...currentRoom, reservation });
  };
  const [manualQrInput, setManualQrInput] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [scannerNotice, setScannerNotice] = useState(null);

  // Staff Security Gate & Authentication State
  const [authenticatedStaff, setAuthenticatedStaff] = useState(() => {
    try {
      if (typeof window !== 'undefined' && (window.location.hash.includes('demo') || window.location.search.includes('demo'))) {
        return AUTHORIZED_STAFF_MEMBERS[0];
      }
      const saved = sessionStorage.getItem('oxy_staff_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // PIN Keypad Handlers
  const handlePinDigit = (digit) => {
    setPinError('');
    if (enteredPin.length < 4) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        verifyPinCode(newPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinError('');
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPinError('');
    setEnteredPin('');
  };

  const verifyPinCode = (pinToTest) => {
    setIsVerifying(true);
    setTimeout(() => {
      const staff = AUTHORIZED_STAFF_MEMBERS.find((s) => s.pin === pinToTest);
      if (staff) {
        setAuthenticatedStaff(staff);
        setPinError('');
        setEnteredPin('');
        try {
          sessionStorage.setItem('oxy_staff_session', JSON.stringify(staff));
        } catch (e) {}
      } else {
        setPinError('Access Denied: Invalid Security PIN. Please contact Reception Manager.');
        setEnteredPin('');
      }
      setIsVerifying(false);
    }, 200);
  };

  const handleQuickDemoLogin = (staffMember) => {
    setEnteredPin(staffMember.pin);
    verifyPinCode(staffMember.pin);
  };

  const handleLockTerminal = () => {
    setAuthenticatedStaff(null);
    setEnteredPin('');
    setPinError('');
    try {
      sessionStorage.removeItem('oxy_staff_session');
    } catch (e) {}
  };

  // Walk-in Form State
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInRoomType, setWalkInRoomType] = useState('standard-room');
  const [walkInUnitNumber, setWalkInUnitNumber] = useState('101');
  const [walkInCheckIn, setWalkInCheckIn] = useState(() => getRelativeDateStr(0));
  const [walkInCheckOut, setWalkInCheckOut] = useState(() => getRelativeDateStr(2));
  const [walkInPayment, setWalkInPayment] = useState('POS Terminal (Front Desk)');
  const [walkInSuccessNotice, setWalkInSuccessNotice] = useState(null);

  // Calculate real-time stats
  const stats = calculatePmsStats(rooms, reservations);

  // Timeline date headers (Today + next 6 days dynamically calculated from current day)
  const timelineDates = React.useMemo(() => generateTimelineDates(), []);

  // Filtered rooms with floor, status, and search query
  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'ALL' && r.floor !== parseInt(floorFilter)) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUnit = r.unitNumber.toLowerCase().includes(q);
      const matchType = r.typeName.toLowerCase().includes(q);
      const matchGuest = r.currentGuest && r.currentGuest.toLowerCase().includes(q);
      if (!matchUnit && !matchType && !matchGuest) return false;
    }
    return true;
  });

  // Handle QR Scan / Lookup
  const handleVerifyScannedString = (qrString) => {
    setScannerError(null);
    setScannerNotice(null);

    const verification = verifySignedPass(qrString);
    if (!verification.isValid) {
      setScannerError(verification.error || 'Invalid QR code');
      setScannedPass(null);
      return;
    }

    setScannedPass(verification.pass);
    setScannerNotice('QR Code Cryptographically Verified • Authentic Oxygen Orbis Stay Pass');
  };

  // Sample quick scan triggers
  const handleQuickSampleScan = (sampleType) => {
    if (sampleType === 'valid_babatunde') {
      const { qrString } = generateSignedPassPayload({
        reference: 'OXY-489218',
        guestName: 'Babatunde Adeleke',
        roomName: 'Deluxe King Room',
        roomUnit: 'Room 204',
        checkIn: getRelativeDateStr(0),
        checkOut: getRelativeDateStr(2),
        guests: 2,
        totalFormatted: '₦110,400',
      });
      handleVerifyScannedString(qrString);
    } else if (sampleType === 'counterfeit_tampered') {
      // Tampered unit in pass
      const tampered = JSON.stringify({
        iss: 'Oxygen Orbis Hotel & Resort',
        ref: 'OXY-489218',
        guest: 'Babatunde Adeleke',
        unit: 'Penthouse 401 (TAMPERED UPGRADE)',
        sig: 'deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678',
      });
      handleVerifyScannedString(tampered);
    }
  };

  // Execute Check-in for scanned guest
  const handleExecuteCheckIn = () => {
    if (!scannedPass) return;
    const unitNumber = scannedPass.unit ? scannedPass.unit.replace(/[^\d]/g, '') : '204';
    const unit = rooms.find((r) => r.unitNumber === unitNumber);

    const check = canCheckInToRoom(unit);
    if (!check.allowed) {
      setScannerError(`Check-In Blocked: ${check.reason}`);
      return;
    }

    // Update room unit status to OCCUPIED
    setRooms((prev) =>
      prev.map((r) =>
        r.unitNumber === unitNumber
          ? { ...r, status: 'OCCUPIED', currentGuest: scannedPass.guest, currentBookingRef: scannedPass.ref }
          : r
      )
    );

    // Update reservation
    setReservations((prev) =>
      prev.map((res) =>
        res.bookingRef === scannedPass.ref
          ? { ...res, status: 'CHECKED_IN', checkedInAt: new Date().toLocaleTimeString() }
          : res
      )
    );

    setScannerNotice(`✓ Success: ${scannedPass.guest} Checked-in to Room ${unitNumber}! Keycard active.`);
  };

  // Execute Check-out
  const handleExecuteCheckOut = (unitNumber, bookingRef) => {
    // Transition room to DIRTY for Housekeeping
    setRooms((prev) =>
      prev.map((r) =>
        r.unitNumber === unitNumber
          ? { ...r, status: 'DIRTY', housekeeping: 'DIRTY', currentGuest: null, currentBookingRef: null }
          : r
      )
    );

    // Transition reservation
    if (bookingRef) {
      setReservations((prev) =>
        prev.map((res) =>
          res.bookingRef === bookingRef
            ? { ...res, status: 'CHECKED_OUT', checkedOutAt: new Date().toLocaleTimeString() }
            : res
        )
      );
    }

    setSelectedRoomForDetails(null);
    setLiveActionNotice(`✓ Guest checked out of Room ${unitNumber}! Room marked as DIRTY for Housekeeping queue.`);
    setTimeout(() => setLiveActionNotice(null), 6000);
  };

  // Housekeeping transitions
  const handleUpdateHousekeeping = (unitNumber, nextStatus) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.unitNumber === unitNumber) {
          const newRoomStatus = nextStatus === 'INSPECTED_CLEAN' ? 'AVAILABLE' : r.status;
          return { ...r, housekeeping: nextStatus, status: newRoomStatus };
        }
        return r;
      })
    );

    if (nextStatus === 'INSPECTED_CLEAN') {
      setLiveActionNotice(`✓ Room ${unitNumber} inspected & marked as CLEAN! Ready for immediate check-in.`);
      setTimeout(() => setLiveActionNotice(null), 6000);
    } else if (nextStatus === 'CLEANING_IN_PROGRESS') {
      setLiveActionNotice(`⏳ Room ${unitNumber} turnover started (Cleaning in progress).`);
      setTimeout(() => setLiveActionNotice(null), 6000);
    }

    setSelectedRoomForDetails((prev) => {
      if (prev && prev.unitNumber === unitNumber) {
        const newRoomStatus = nextStatus === 'INSPECTED_CLEAN' ? 'AVAILABLE' : prev.status;
        return { ...prev, housekeeping: nextStatus, status: newRoomStatus };
      }
      return prev;
    });
  };

  // Approve Bank Transfer
  const handleApproveTransfer = (xferId) => {
    const xfer = pendingTransfers.find((x) => x.id === xferId);
    if (!xfer) return;

    // Pick clean available room
    const availableUnit = rooms.find(
      (r) => r.status === 'AVAILABLE' && r.housekeeping === 'INSPECTED_CLEAN'
    );

    if (availableUnit) {
      setRooms((prev) =>
        prev.map((r) =>
          r.unitNumber === availableUnit.unitNumber
            ? { ...r, status: 'RESERVED', currentBookingRef: xfer.bookingReference }
            : r
        )
      );
    }

    setPendingTransfers((prev) => prev.filter((x) => x.id !== xferId));

    // Simulated staff WhatsApp notification trigger
    dispatchWhatsAppMessage({
      recipientPhone: xfer.guestPhone,
      message: `Dear ${xfer.guestName}, your bank transfer of ₦${xfer.amount.toLocaleString()} for reservation #${xfer.bookingReference} has been verified and confirmed! Unit #${availableUnit?.unitNumber || '204'} reserved.`,
    });

    alert(`Transfer for #${xfer.bookingReference} approved! Unit #${availableUnit?.unitNumber || '204'} allocated.`);
  };

  // Submit Walk-in Form
  const handleWalkInSubmit = (e) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;

    const unit = rooms.find((r) => r.unitNumber === walkInUnitNumber);
    if (unit && unit.status === 'OCCUPIED') {
      alert(`Room ${walkInUnitNumber} is currently occupied! Please pick an available room.`);
      return;
    }

    const ref = `OXY-WLK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Add reservation
    const newRes = {
      id: `res_wlk_${Date.now()}`,
      bookingRef: ref,
      guestName: walkInName,
      guestPhone: walkInPhone,
      roomTypeId: walkInRoomType,
      roomTypeName: unit?.typeName || 'Deluxe King',
      unitNumber: walkInUnitNumber,
      checkIn: walkInCheckIn,
      checkOut: walkInCheckOut,
      nights: 2,
      guests: 2,
      totalAmount: unit?.priceNGN ? unit.priceNGN * 2 : 96000,
      status: 'CHECKED_IN',
      paymentStatus: `PAID_${walkInPayment.toUpperCase().replace(/\s+/g, '_')}`,
      addons: ['Walk-in Welcome Drink'],
    };

    setReservations((prev) => [newRes, ...prev]);

    // Update room to OCCUPIED
    setRooms((prev) =>
      prev.map((r) =>
        r.unitNumber === walkInUnitNumber
          ? { ...r, status: 'OCCUPIED', currentGuest: walkInName, currentBookingRef: ref }
          : r
      )
    );

    setWalkInSuccessNotice(`Walk-in guest ${walkInName} registered & checked in to Room ${walkInUnitNumber}! Ref: #${ref}`);
    setWalkInName('');
    setWalkInPhone('');
  };

  // -------------------------------------------------------------
  // SECURITY GATE: RESTRICTED ACCESS TERMINAL (PIN PROTECTION)
  // -------------------------------------------------------------
  if (!authenticatedStaff) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#120601] border border-[#C9854A]/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-[#E0C8A8] relative">
          
          {/* Ambient Warm Radial Lighting */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#C9854A]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#7A4020]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Security Banner & Close Button */}
          <div className="p-4 sm:p-5 border-b border-[#4A2010] bg-[#1A0C06]/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9854A] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Staff Security Terminal
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#2A1208] hover:bg-[#3D1A0C] text-[#C9A070] hover:text-white transition cursor-pointer"
              title="Close & Exit to Guest Website"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Security Lock Body */}
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            
            {/* Resort Crest Logo */}
            <div className="w-16 h-16 rounded-2xl bg-[#2A1208] border border-[#C9854A]/50 p-2 flex items-center justify-center shadow-lg shadow-black/60 mb-3">
              <img src="/logo.png" alt="Oxygen Orbis Logo" className="w-12 h-12 object-contain" />
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
              Oxygen Orbis Resort
            </h3>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C9854A] font-semibold mt-0.5">
              Property Management System (PMS)
            </p>

            <div className="mt-3 px-3 py-1.5 rounded-full bg-[#2A1208] border border-[#4A2010] text-[10.5px] text-[#E0C8A8] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C9854A]" />
              <span>Restricted Access • Authorized Personnel Only</span>
            </div>

            <p className="text-xs text-[#C9A070] mt-3 leading-relaxed max-w-xs">
              Enter your 4-digit security PIN to access live guest folios, room turnover grids, and payment reconciliations.
            </p>

            {/* PIN Code Visual Dots Display */}
            <div className="flex items-center justify-center gap-3 my-5">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-[#C9854A] border-[#E0A86A] scale-110 shadow-[0_0_12px_rgba(201,133,74,0.6)]'
                        : 'border-[#4A2010] bg-[#1A0C06]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="w-full mb-3 px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 text-left animate-in shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] my-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinDigit(digit.toString())}
                  disabled={isVerifying}
                  className="h-12 rounded-xl bg-[#2A1208]/90 hover:bg-[#3D1A0C] border border-[#4A2010] hover:border-[#C9854A]/50 text-white font-mono text-lg font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handlePinClear}
                disabled={isVerifying}
                className="h-12 rounded-xl bg-[#2A1208]/50 hover:bg-[#3D1A0C] border border-[#4A2010] text-[#C9A070] text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>
              <button
                onClick={() => handlePinDigit('0')}
                disabled={isVerifying}
                className="h-12 rounded-xl bg-[#2A1208]/90 hover:bg-[#3D1A0C] border border-[#4A2010] hover:border-[#C9854A]/50 text-white font-mono text-lg font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                disabled={isVerifying}
                className="h-12 rounded-xl bg-[#2A1208]/50 hover:bg-[#3D1A0C] border border-[#4A2010] text-[#C9A070] text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                ⌫
              </button>
            </div>

            {/* Quick Demo Access (One-Click Testing For Evaluators) */}
            <div className="w-full mt-5 pt-4 border-t border-[#4A2010]/80">
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#C9A070] block mb-2 font-medium">
                ⚡ Quick Demo Access (1-Click Test Login):
              </span>
              <div className="flex flex-col gap-1.5 w-full">
                {AUTHORIZED_STAFF_MEMBERS.map((staff) => (
                  <button
                    key={staff.pin}
                    onClick={() => handleQuickDemoLogin(staff)}
                    disabled={isVerifying}
                    className="w-full px-3 py-2 rounded-xl bg-[#2A1208]/60 hover:bg-[#3D1A0C] border border-[#4A2010] hover:border-[#C9854A]/40 text-left flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{staff.avatar}</span>
                      <div>
                        <div className="font-semibold text-white">{staff.name}</div>
                        <div className="text-[10px] text-[#C9A070]">{staff.role}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#1A0C06] border border-[#C9854A]/30 text-[10px] font-mono text-[#E0A86A]">
                      PIN: {staff.pin}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120601] border border-[#C9854A]/40 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col text-[#E0C8A8] relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#4A2010] bg-[#1A0C06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1208] border border-[#C9854A]/40 p-1 flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="Oxygen Orbis Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9854A]">
                  Front Desk PMS • Live Terminal
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                Oxygen Orbis Reception Portal
              </h2>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#120601] border border-[#4A2010]">
              <span className="text-[#C9A070] block text-[9px] uppercase">Occupancy</span>
              <span className="font-bold text-emerald-400">{stats.occupancyPercentage}% ({stats.occupiedCount}/40)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#120601] border border-[#4A2010]">
              <span className="text-[#C9A070] block text-[9px] uppercase">Available Clean</span>
              <span className="font-bold text-white">{stats.availableCount} Rooms</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#120601] border border-[#4A2010]">
              <span className="text-[#C9A070] block text-[9px] uppercase">Housekeeping</span>
              <span className="font-bold text-amber-400">{stats.dirtyCount} Pending</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#120601] border border-[#4A2010]">
              <span className="text-[#C9A070] block text-[9px] uppercase">Active Staff</span>
              <span className="font-bold text-[#E0A86A]">{authenticatedStaff.name} ({authenticatedStaff.badge})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleLockTerminal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2A1208] border border-[#4A2010] hover:border-red-500/50 text-[#C9A070] hover:text-red-300 transition-all cursor-pointer shadow-sm"
              title="Lock Terminal & Log Out"
            >
              <Lock className="w-3.5 h-3.5 text-[#C9854A]" />
              <span className="hidden sm:inline">Lock Terminal</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#2A1208] hover:bg-[#3D1A0C] text-[#C9A070] hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation — Modern Segmented Luxury Bar (No scrollbar clipping) */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#160802] border-b border-[#4A2010] flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs">
          {[
            { id: 'timeline', label: 'Timeline Gantt (40 Rooms)', icon: Calendar },
            { id: 'scanner', label: '5-Sec QR Check-In', icon: QrCode },
            { id: 'housekeeping', label: 'Housekeeping Queue', icon: RefreshCw, badge: stats.dirtyCount, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
            { id: 'transfers', label: 'Wire Transfers', icon: DollarSign, badge: pendingTransfers.length, badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
            { id: 'walkin', label: 'Walk-In / Phone Booking', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#C9854A] to-[#B06A2E] text-[#1A0C06] font-bold shadow-md shadow-[#C9854A]/25 scale-[1.02]'
                    : 'bg-[#1A0C06] text-[#E0C8A8] hover:text-white hover:bg-[#2A1208] border border-[#4A2010]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A0C06]' : 'text-[#C9854A]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${isActive ? 'bg-black/20 text-[#1A0C06] border-black/30' : tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#120601]">
          
          {/* TAB 1: VISUAL TIMELINE GRID (GANTT CHART) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              
              {/* Executive Filter & Search Toolbar */}
              <div className="p-3 bg-[#1A0C06] border border-[#4A2010] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                {/* Left: Floor Segmented Pills */}
                <div className="flex items-center gap-1.5 bg-[#120601] p-1 rounded-xl border border-[#4A2010] text-xs">
                  <span className="text-[11px] text-[#C9A070] font-bold px-2">Floor:</span>
                  {[
                    { id: 'ALL', label: 'All (40)' },
                    { id: '1', label: 'F1 • Rooms & Cabins' },
                    { id: '2', label: 'F2 • Sanctuary & Deluxe' },
                    { id: '3', label: 'F3 • Diplomatic & Cabins' },
                    { id: '4', label: 'F4 • Grand Chalet & Suites' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFloorFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                        floorFilter === f.id
                          ? 'bg-[#C9854A] text-[#1A0C06] font-bold shadow-sm'
                          : 'text-[#C9A070] hover:text-white hover:bg-[#2A1208]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Center: Status Filter Pills with Colored Glow Dots */}
                <div className="flex items-center gap-1 bg-[#080E15] p-1 rounded-xl border border-[#1E2D3E] text-xs">
                  <span className="text-[11px] text-slate-400 font-bold px-2">Status:</span>
                  {[
                    { id: 'ALL', label: 'All', dot: 'bg-slate-400' },
                    { id: 'AVAILABLE', label: `Available (${stats.availableCount})`, dot: 'bg-emerald-400' },
                    { id: 'OCCUPIED', label: `Occupied (${stats.occupiedCount})`, dot: 'bg-sky-400' },
                    { id: 'DIRTY', label: `Turnover (${stats.dirtyCount})`, dot: 'bg-amber-400' },
                    { id: 'MAINTENANCE', label: `Blocked (${stats.maintenanceCount})`, dot: 'bg-rose-400' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                        statusFilter === st.id
                          ? 'bg-[#1C2C3B] text-[#C5A880] font-bold border border-[#C5A880]/50 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-[#121C27]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>

                {/* Right: Quick Search Input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter room # or guest..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#080E15] border border-[#1E2D3E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Operation Notice */}
              {liveActionNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{liveActionNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveActionNotice(null)}
                    className="text-emerald-400 hover:text-white text-xs px-2 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Gantt Timeline Table */}
              <div className="border border-[#1E2D3E] rounded-2xl overflow-x-auto bg-[#0A1118] shadow-2xl">
                <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#0E1722] text-slate-300 border-b border-[#1E2D3E]">
                      <th className="p-3 font-semibold uppercase tracking-wider text-[#C5A880] sticky left-0 bg-[#0E1722] z-20 w-52 shadow-[2px_0_10px_rgba(0,0,0,0.5)] border-r border-[#1E2D3E]">
                        <div className="flex items-center justify-between">
                          <span>Room / Unit</span>
                          <span className="text-[10px] text-slate-500 font-normal">{filteredRooms.length} of 40</span>
                        </div>
                      </th>
                      {timelineDates.map((d) => (
                        <th 
                          key={d.dateStr} 
                          className={`p-3 font-semibold text-center border-l border-[#1E2D3E] ${
                            d.isToday ? 'bg-[#172533] border-t-2 border-t-[#C5A880]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-white font-bold">{d.label}</span>
                            {d.isToday && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[#C5A880] text-black text-[9px] font-extrabold uppercase">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{d.dateStr}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2634]">
                    {filteredRooms.map((roomUnit) => {
                      const activeRes = reservations.find((r) => r.unitNumber === roomUnit.unitNumber);

                      let dotColor = 'bg-emerald-400';
                      let statusText = 'Clean Vacant';
                      if (roomUnit.status === 'OCCUPIED') {
                        dotColor = 'bg-sky-400';
                        statusText = `In-House: ${roomUnit.currentGuest?.split(' ')[0]}`;
                      } else if (roomUnit.housekeeping === 'DIRTY' || roomUnit.housekeeping === 'CLEANING_IN_PROGRESS') {
                        dotColor = 'bg-amber-400';
                        statusText = 'Turnover Needed';
                      } else if (roomUnit.status === 'MAINTENANCE') {
                        dotColor = 'bg-rose-400';
                        statusText = 'Under Servicing';
                      }

                      return (
                        <tr
                          key={roomUnit.unitNumber}
                          className="hover:bg-[#101A24] transition group"
                        >
                          {/* Sticky Room Left Header */}
                          <td 
                            onClick={() => handleOpenRoomDetails(roomUnit)}
                            className="p-3 sticky left-0 bg-[#0A1118] group-hover:bg-[#101A24] z-10 border-r border-[#1E2D3E] cursor-pointer shadow-[2px_0_10px_rgba(0,0,0,0.4)] transition hover:border-r hover:border-r-[#C5A880]"
                            title="Click to view full room & guest dossier"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm font-mono tracking-wide group-hover:text-[#C5A880] transition">
                                    Room {roomUnit.unitNumber}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-[#162432] text-[#C5A880] text-[9px] font-mono border border-[#243546]">
                                    F{roomUnit.floor}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                  {roomUnit.typeName}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-[#C5A880] font-mono">
                                  ₦{(roomUnit.priceNGN / 1000).toFixed(0)}k
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400" title={statusText}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Timeline Day Slots */}
                          {timelineDates.map((day, idx) => {
                            const isReservedDay = activeRes && (day.dateStr >= activeRes.checkIn && day.dateStr < activeRes.checkOut);

                            return (
                              <td 
                                key={day.dateStr} 
                                className={`p-1.5 border-l border-[#1A2634] text-center relative ${
                                  day.isToday ? 'bg-[#111C28]/40' : ''
                                }`}
                              >
                                {isReservedDay ? (
                                  /* Active Confirmed Reservation Block */
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRoomDetails(roomUnit);
                                    }}
                                    className="p-2 rounded-xl bg-gradient-to-r from-[#2B2214] via-[#3D301C] to-[#2B2214] border border-[#C5A880] shadow-md text-left cursor-pointer hover:scale-[1.02] active:scale-95 transition"
                                    title="Click to view guest folio & room controls"
                                  >
                                    <div className="flex items-center justify-between text-[11px] font-bold text-white truncate">
                                      <span className="truncate">{activeRes.guestName}</span>
                                      <span className="text-[9px] font-mono text-[#C5A880] shrink-0 ml-1">
                                        #{activeRes.bookingRef.slice(-4)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-[#DBC297] mt-0.5">
                                      <span>{activeRes.nights} Nights</span>
                                      <span className="text-emerald-400 font-semibold">PAID</span>
                                    </div>
                                  </div>
                                ) : roomUnit.status === 'OCCUPIED' && idx === 0 ? (
                                  /* In-House Occupied Guest */
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRoomDetails(roomUnit);
                                    }}
                                    className="p-2 rounded-xl bg-gradient-to-r from-[#0E2738] to-[#123147] border border-sky-500/60 shadow-md text-left cursor-pointer hover:scale-[1.02] active:scale-95 transition"
                                    title="Click to view in-house guest details & check-out controls"
                                  >
                                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-200 truncate">
                                      <span className="truncate">{roomUnit.currentGuest}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 text-[8px] font-extrabold uppercase shrink-0">
                                        IN-HOUSE
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-sky-400/80 block mt-0.5 font-mono">
                                      #{roomUnit.currentBookingRef?.slice(-4) || 'KEY-ISSUED'}
                                    </span>
                                  </div>
                                ) : roomUnit.housekeeping === 'DIRTY' && idx === 0 ? (
                                  /* Housekeeping Needed TODAY ONLY (Not repeated 5 times!) */
                                  <div 
                                    onClick={() => handleOpenRoomDetails(roomUnit)}
                                    className="p-2 rounded-xl bg-[#2A1D0B] border border-amber-500/60 text-left cursor-pointer hover:scale-[1.02] active:scale-95 transition flex items-center justify-between gap-1"
                                    title="Click to view housekeeping details"
                                  >
                                    <div>
                                      <span className="text-[10px] font-bold text-amber-300 block">
                                        Turnover Required
                                      </span>
                                      <span className="text-[9px] text-amber-400/70 block">
                                        Housekeeping Queue
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateHousekeeping(roomUnit.unitNumber, 'INSPECTED_CLEAN');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[9px] transition shrink-0"
                                      title="Click to mark clean immediately"
                                    >
                                      Clean
                                    </button>
                                  </div>
                                ) : roomUnit.status === 'MAINTENANCE' && idx === 0 ? (
                                  /* Maintenance Blocked */
                                  <div 
                                    onClick={() => handleOpenRoomDetails(roomUnit)}
                                    className="p-2 rounded-xl bg-rose-950/40 border border-rose-600/40 text-left cursor-pointer hover:scale-[1.02] transition"
                                    title="Click to view maintenance details"
                                  >
                                    <span className="text-[10px] font-bold text-rose-300 block">
                                      Blocked Unit
                                    </span>
                                    <span className="text-[9px] text-rose-400/70 block truncate">
                                      {roomUnit.notes || 'Servicing'}
                                    </span>
                                  </div>
                                ) : (
                                  /* Clean Available Slot (Calm & Elegant — Click to Quick-Book!) */
                                  <div 
                                    onClick={() => {
                                      setWalkInUnitNumber(roomUnit.unitNumber);
                                      setWalkInRoomType(roomUnit.typeId);
                                      setWalkInCheckIn(day.dateStr);
                                      setActiveTab('walkin');
                                    }}
                                    className="h-10 rounded-xl border border-dashed border-[#1C2C3B] hover:border-[#C5A880]/60 hover:bg-[#152331] transition flex items-center justify-center group/slot cursor-pointer"
                                    title={`Click to book Room ${roomUnit.unitNumber} on ${day.label}`}
                                  >
                                    <span className="text-[10px] text-slate-600 group-hover/slot:text-[#C5A880] transition font-semibold flex items-center gap-1 opacity-0 group-hover/slot:opacity-100">
                                      <Plus className="w-3 h-3" />
                                      <span>Book</span>
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: IN-BROWSER 5-SEC QR SCANNER */}
          {activeTab === 'scanner' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  5-Second Reception Mobile Pass Scanner
                </h3>
                <p className="text-xs text-slate-400">
                  Scan guest QR pass with reception webcam or paste scanned payload to verify HMAC signature.
                </p>
              </div>

              {/* Simulated Camera Scanner Viewport */}
              <div className="relative rounded-3xl bg-black border-2 border-[#C5A880] p-6 text-center overflow-hidden shadow-2xl">
                {/* Laser scan animation bar */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10B981] animate-pulse"></div>

                <div className="w-48 h-48 border-2 border-dashed border-[#C5A880]/70 rounded-2xl mx-auto flex flex-col items-center justify-center p-4">
                  <QrCode className="w-16 h-16 text-[#C5A880] animate-bounce" />
                  <span className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">
                    Align QR Pass Here
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSampleScan('valid_babatunde')}
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-bold transition"
                  >
                    ⚡ Test Scan: Babatunde Adeleke (#OXY-489218)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSampleScan('counterfeit_tampered')}
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-300 font-bold transition"
                  >
                    ⚠️ Test Scan: Counterfeit/Tampered Pass
                  </button>
                </div>
              </div>

              {/* Manual QR Input Fallback */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste scanned QR payload string or booking ref..."
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  className="flex-1 bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A880]"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyScannedString(manualQrInput)}
                  className="px-4 py-2 rounded-xl bg-[#C5A880] text-black font-bold text-xs hover:bg-[#D4AF37]"
                >
                  Verify
                </button>
              </div>

              {/* Notice & Error Messages */}
              {scannerNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{scannerNotice}</span>
                </div>
              )}

              {scannerError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scannerError}</span>
                </div>
              )}

              {/* Verified Guest Dossier Card */}
              {scannedPass && (
                <div className="p-5 rounded-2xl bg-[#111B24] border border-[#C5A880] space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-[#243546]">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block">
                        Verified Pass
                      </span>
                      <h4 className="font-serif text-lg font-bold text-white">{scannedPass.guest}</h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#C5A880]">#{scannedPass.ref}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Accommodation</span>
                      <span className="font-semibold text-white">{scannedPass.room}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Assigned Unit</span>
                      <span className="font-bold text-[#C5A880]">{scannedPass.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Dates</span>
                      <span className="text-white">{scannedPass.in} to {scannedPass.out}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Payment Amount</span>
                      <span className="font-bold text-emerald-400">{scannedPass.amt} (PAID)</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#243546] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleExecuteCheckIn}
                      className="gold-gradient-btn px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#C5A880]/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Check-In & Issue Keycard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScannedPass(null)}
                      className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOUSEKEEPING QUEUE */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white mb-1">
                    Housekeeping & Sanitation Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Front Desk is blocked from assigning rooms until marked INSPECTED_CLEAN.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
                  {stats.dirtyCount} Rooms Needing Turnover
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {rooms
                  .filter((r) => r.housekeeping !== 'INSPECTED_CLEAN')
                  .map((unit) => (
                    <div key={unit.unitNumber} className="p-4 rounded-2xl bg-[#111B24] border border-[#243546] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-white">Room {unit.unitNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          unit.housekeeping === 'DIRTY' ? 'bg-amber-950 text-amber-300 border border-amber-500' : 'bg-rose-950 text-rose-300 border border-rose-500'
                        }`}>
                          {unit.housekeeping}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <span className="text-slate-400 block text-[10px] uppercase">Tier & Floor</span>
                        <span>{unit.typeName} • Floor {unit.floor}</span>
                      </div>

                      <div className="pt-2 border-t border-[#243546] flex gap-2">
                        {unit.housekeeping === 'DIRTY' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateHousekeeping(unit.unitNumber, 'CLEANING_IN_PROGRESS')}
                            className="flex-1 py-1.5 rounded-xl bg-[#172430] hover:bg-[#243546] text-amber-300 font-semibold text-xs border border-amber-500/40 transition"
                          >
                            Start Cleaning
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateHousekeeping(unit.unitNumber, 'INSPECTED_CLEAN')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
                        >
                          ✓ Mark Clean
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT WIRE TRANSFERS QUEUE */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  Pending Bank Transfers (GTBank Statement Reconciler)
                </h3>
                <p className="text-xs text-slate-400">
                  Review uploaded receipts against corporate GTBank account (0789234512) and confirm reservation.
                </p>
              </div>

              <div className="space-y-3">
                {pendingTransfers.map((xfer) => (
                  <div key={xfer.id} className="p-4 rounded-2xl bg-[#111B24] border border-[#243546] flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{xfer.guestName}</span>
                        <span className="font-mono text-xs text-[#C5A880]">#{xfer.bookingReference}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          {xfer.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Phone: {xfer.guestPhone} • Category: {xfer.roomType}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Receipt: <strong className="text-slate-200">{xfer.receiptFileName}</strong> ({xfer.receiptFileSize}) • Expected Remark: <span className="font-mono text-white">{xfer.narration}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg font-bold text-[#C5A880]">
                        ₦{xfer.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApproveTransfer(xfer.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Allocate Room</span>
                      </button>
                    </div>
                  </div>
                ))}

                {pendingTransfers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No pending transfers awaiting verification! All wire receipts reconciled.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: WALK-IN / PHONE BOOKING CREATOR */}
          {activeTab === 'walkin' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  Manual Walk-In & Phone Reservation Creator
                </h3>
                <p className="text-xs text-slate-400">
                  Directly record in-person walk-ins or phone reservations to instantly block online double-bookings.
                </p>
              </div>

              {walkInSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{walkInSuccessNotice}</span>
                </div>
              )}

              <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                      Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chief Olumide"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      className="w-full bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0803 123 4567"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      className="w-full bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#E0C8A8] uppercase block mb-1">
                      Room Category (12 Authentic Tiers)
                    </label>
                    <select
                      value={walkInRoomType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setWalkInRoomType(newType);
                        const matchUnit = rooms.find(
                          (r) => r.typeId === newType && r.status === 'AVAILABLE' && r.housekeeping === 'INSPECTED_CLEAN'
                        );
                        if (matchUnit) {
                          setWalkInUnitNumber(matchUnit.unitNumber);
                        }
                      }}
                      className="w-full bg-[#1A0C06] border border-[#4A2010] rounded-xl px-3 py-2.5 text-white"
                    >
                      {ROOMS_DATA.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} (₦{room.priceNGN.toLocaleString()}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#E0C8A8] uppercase block mb-1">
                      Assign Available Unit
                    </label>
                    <select
                      value={walkInUnitNumber}
                      onChange={(e) => setWalkInUnitNumber(e.target.value)}
                      className="w-full bg-[#1A0C06] border border-[#4A2010] rounded-xl px-3 py-2.5 text-white font-mono"
                    >
                      {rooms
                        .filter((r) => r.status === 'AVAILABLE' && r.housekeeping === 'INSPECTED_CLEAN')
                        .map((r) => (
                          <option key={r.unitNumber} value={r.unitNumber}>
                            Room {r.unitNumber} • {r.typeName} (Floor {r.floor} • ₦{r.priceNGN?.toLocaleString()})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                      Check-In Date
                    </label>
                    <input
                      type="date"
                      value={walkInCheckIn}
                      onChange={(e) => setWalkInCheckIn(e.target.value)}
                      className="w-full bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      value={walkInCheckOut}
                      onChange={(e) => setWalkInCheckOut(e.target.value)}
                      className="w-full bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Settlement / Payment Method
                  </label>
                  <select
                    value={walkInPayment}
                    onChange={(e) => setWalkInPayment(e.target.value)}
                    className="w-full bg-[#111B24] border border-[#243546] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="POS Terminal (Front Desk)">Contactless Card POS Terminal</option>
                    <option value="Direct Bank Transfer">Direct Bank Transfer (Verified)</option>
                    <option value="Corporate Bill to Company">Corporate Bill to Company</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-[#243546] flex justify-end">
                  <button
                    type="submit"
                    className="gold-gradient-btn px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#C5A880]/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Reservation & Check-In</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* ROOM & GUEST STAY DOSSIER MODAL (Viewport Center Pop-up) */}
      {selectedRoomForDetails && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedRoomForDetails(null)}
        >
          <div 
            className="bg-[#0D1620] border-2 border-[#C5A880] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-slate-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#121E2B] via-[#172534] to-[#121E2B] border-b border-[#243546] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A880] to-[#8C7147] p-0.5 flex items-center justify-center text-black font-black text-lg shadow-lg">
                  {selectedRoomForDetails.unitNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-white">
                      Room {selectedRoomForDetails.unitNumber}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#1B2A38] text-[#C5A880] border border-[#2D4052] text-[10px] font-mono">
                      Floor {selectedRoomForDetails.floor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedRoomForDetails.typeName} • ₦{selectedRoomForDetails.priceNGN.toLocaleString()} / night
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoomForDetails(null)}
                className="p-2 rounded-full bg-[#1A2634] hover:bg-[#253648] text-slate-400 hover:text-white transition"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Room Condition & Status Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#091017] border border-[#1E2D3E] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Occupancy Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedRoomForDetails.status === 'OCCUPIED' ? 'bg-sky-400 animate-pulse' :
                      selectedRoomForDetails.status === 'AVAILABLE' ? 'bg-emerald-400' :
                      selectedRoomForDetails.status === 'MAINTENANCE' ? 'bg-rose-400' : 'bg-amber-400'
                    }`}></span>
                    <span className="font-bold text-sm text-white">
                      {selectedRoomForDetails.status === 'OCCUPIED' ? 'In-House Guest' :
                       selectedRoomForDetails.status === 'AVAILABLE' ? 'Available / Vacant' :
                       selectedRoomForDetails.status === 'MAINTENANCE' ? 'Maintenance Block' : 'Turnover Needed'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#091017] border border-[#1E2D3E] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Housekeeping State
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedRoomForDetails.housekeeping === 'INSPECTED_CLEAN' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}></span>
                    <span className="font-bold text-sm text-white">
                      {selectedRoomForDetails.housekeeping === 'INSPECTED_CLEAN' ? 'Inspected Clean' :
                       selectedRoomForDetails.housekeeping === 'CLEANING_IN_PROGRESS' ? 'Cleaning Active' : 'Dirty / Turnover'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Dossier (if occupied or reservation attached) */}
              {(selectedRoomForDetails.currentGuest || selectedRoomForDetails.reservation) ? (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#111C27] to-[#0A121A] border border-[#233547] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#1E2D3E] pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider block">
                        Guest Dossier & Folio
                      </span>
                      <h4 className="font-serif text-base font-bold text-white">
                        {selectedRoomForDetails.currentGuest || selectedRoomForDetails.reservation?.guestName}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#182635] text-[#C5A880] font-mono text-xs font-bold border border-[#293E52]">
                      #{selectedRoomForDetails.currentBookingRef || selectedRoomForDetails.reservation?.bookingRef || 'OXY-INHOUSE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Phone / Mobile</span>
                      <span className="font-mono text-slate-200">
                        {selectedRoomForDetails.reservation?.guestPhone || '+234 803 398 7126'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Email Address</span>
                      <span className="text-slate-200 truncate block">
                        {selectedRoomForDetails.reservation?.guestEmail || 'guest@oxygenorbis.ng'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Stay Dates</span>
                      <span className="text-white font-medium">
                        {selectedRoomForDetails.reservation?.checkIn || getRelativeDateStr(0)} → {selectedRoomForDetails.reservation?.checkOut || getRelativeDateStr(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Settlement Status</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {selectedRoomForDetails.reservation?.paymentStatus?.replace('PAID_', 'PAID (') + ')' || 'PAID (VERIFIED)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {selectedRoomForDetails.reservation?.addons && selectedRoomForDetails.reservation.addons.length > 0 && (
                    <div className="pt-2 border-t border-[#1E2D3E]">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">Booked Add-Ons:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoomForDetails.reservation.addons.map((addon, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#162534] text-[#C5A880] text-[10px] border border-[#243A4E]">
                            ✦ {addon}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRoomForDetails.reservation?.notes && (
                    <div className="p-2.5 rounded-xl bg-[#091017] border border-[#1E2D3E] text-[11px] text-slate-300">
                      <strong className="text-[#C5A880]">Arrival Notes: </strong>
                      {selectedRoomForDetails.reservation.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#091017] border border-[#1E2D3E] text-center text-xs text-slate-400">
                  No active guest in this room. Room is vacant and available for walk-in booking or reservation assignment.
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#1E2D3E]">
                {selectedRoomForDetails.status === 'OCCUPIED' && (
                  <button
                    type="button"
                    onClick={() => handleExecuteCheckOut(
                      selectedRoomForDetails.unitNumber, 
                      selectedRoomForDetails.currentBookingRef || selectedRoomForDetails.reservation?.bookingRef
                    )}
                    className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Check-Out Guest & Release Room</span>
                  </button>
                )}

                {selectedRoomForDetails.housekeeping === 'DIRTY' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateHousekeeping(selectedRoomForDetails.unitNumber, 'CLEANING_IN_PROGRESS')}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A2634] hover:bg-[#253648] text-amber-300 border border-amber-500/40 font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start Cleaning</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateHousekeeping(selectedRoomForDetails.unitNumber, 'INSPECTED_CLEAN')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Inspected & Clean</span>
                    </button>
                  </>
                )}

                {selectedRoomForDetails.status === 'AVAILABLE' && selectedRoomForDetails.housekeeping === 'INSPECTED_CLEAN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setWalkInUnitNumber(selectedRoomForDetails.unitNumber);
                      setWalkInRoomType(selectedRoomForDetails.typeId);
                      setSelectedRoomForDetails(null);
                      setActiveTab('walkin');
                    }}
                    className="gold-gradient-btn px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#C5A880]/20 active:scale-95"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Book Walk-In Guest</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedRoomForDetails(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#141F2B] border border-[#243546] text-slate-300 hover:text-white text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

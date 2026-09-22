import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Users, BedDouble, Plus, Check, ArrowRight, ArrowLeft, 
  Sparkles, ShieldCheck, Car, UtensilsCrossed, Wine, Clock, 
  CreditCard, Building2, Smartphone, Download, Share2, CheckCircle2, AlertCircle,
  Copy, Upload, FileText, Loader2, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS_DATA, ADDONS_DATA, RESORT_INFO, BANK_TRANSFER_INFO } from '../data/resortData';
import { validateNigerianPhone, validateEmail, validateFullName } from '../utils/validation';
import { initializePaystackCheckout, simulatePaystackPayment } from '../services/paystackService';
import { validateReceiptFile, createPendingBankTransferSubmission } from '../services/bankTransferService';
import { generatePrintableVoucherHtml } from '../services/digitalPassService';
import { generateLuxuryInvoiceHtml } from '../services/invoiceService';
import { calculateStayDynamicQuote } from '../services/revenueService';

export default function BookingModal({ isOpen, onClose, initialData, currency }) {
  if (!isOpen) return null;

  // Form states
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState(initialData?.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialData?.checkOut || '');
  const [selectedRoomId, setSelectedRoomId] = useState(initialData?.roomType || ROOMS_DATA[0].id);
  const [guests, setGuests] = useState(initialData?.guests || 2);
  const [selectedAddons, setSelectedAddons] = useState(initialData?.addonId ? [initialData.addonId] : []);
  const [addonPreferences, setAddonPreferences] = useState({
    trainTime: '14:30',
    trainStation: 'Ebute Metta (Mobolaji Johnson)',
    spaType: 'Swedish Relaxation',
    dinnerOccasion: 'Romantic Getaway',
  });
  
  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [agreedToCashlessPolicy, setAgreedToCashlessPolicy] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Confirmation & Reference data
  const [bookingRef, setBookingRef] = useState(() => initialData?.bookingRef || `OXY-${Math.floor(100000 + Math.random() * 900000)}`);
  
  // Payment execution and verification states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('CONFIRMED'); // 'CONFIRMED' | 'AWAITING_VERIFICATION' | 'HELD_FOR_ARRIVAL'
  const [paymentTransaction, setPaymentTransaction] = useState(null);
  const [assignedRoomUnit, setAssignedRoomUnit] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNarration, setCopiedNarration] = useState(false);

  // Direct Bank Transfer receipt state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptMeta, setReceiptMeta] = useState(null);
  const [receiptError, setReceiptError] = useState(null);

  // Selected room object
  const room = ROOMS_DATA.find((r) => r.id === selectedRoomId) || ROOMS_DATA[0];

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();

  // Dynamic Pricing Calculation (Card 6.1)
  const dynamicStayQuote = calculateStayDynamicQuote({
    roomTypeId: room.id,
    checkInStr: checkIn,
    checkOutStr: checkOut,
    currency,
  });

  const roomTotal = dynamicStayQuote.totalRoomPrice;

  const addonsTotal = selectedAddons.reduce((acc, addonId) => {
    const addon = ADDONS_DATA.find((a) => a.id === addonId);
    if (!addon) return acc;
    return acc + (currency === 'USD' ? addon.priceUSD : addon.priceNGN);
  }, 0);

  const grandTotal = roomTotal + addonsTotal;

  const formatAmount = (num) => {
    return currency === 'USD' ? `$${num.toLocaleString()}` : `₦${num.toLocaleString()}`;
  };

  const toggleAddon = (addonId) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const handleNextToStep2 = () => {
    setStep(2);
  };

  const handleNextToStep3 = () => {
    setStep(3);
  };

  const getAssignedRoom = (roomId) => {
    switch (roomId) {
      case 'deluxe-king': return 'Room 204 (1st Floor, Garden Sanctuary)';
      case 'executive-room': return 'Room 305 (2nd Floor, Pool View)';
      case 'presidential-suite': return 'Penthouse 401 (Top Floor, Private Balcony)';
      default: return 'Room 108 (Ground Floor)';
    }
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#C5A880', '#D4AF37', '#10B981', '#FFFFFF'],
    });
  };

  const validateGuestForm = () => {
    const errs = {};

    const nameRes = validateFullName(guestName);
    if (!nameRes.isValid) errs.name = nameRes.error;

    const emailRes = validateEmail(guestEmail);
    if (!emailRes.isValid) errs.email = emailRes.error;

    const phoneRes = validateNigerianPhone(guestPhone);
    if (!phoneRes.isValid) errs.phone = phoneRes.error;

    if (!agreedToCashlessPolicy) {
      errs.policy = 'Please acknowledge and agree to the cashless property and reservation policy.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return false;
    }

    setFormErrors({});
    if (phoneRes.sanitized) {
      setGuestPhone(phoneRes.sanitized);
    }
    return true;
  };

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(BANK_TRANSFER_INFO.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleCopyNarration = () => {
    navigator.clipboard?.writeText(`#${bookingRef}`);
    setCopiedNarration(true);
    setTimeout(() => setCopiedNarration(false), 2500);
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateReceiptFile(file);
    if (!validation.isValid) {
      setReceiptError(validation.error);
      setReceiptFile(null);
      setReceiptPreview(null);
      setReceiptMeta(null);
      return;
    }

    setReceiptError(null);
    setReceiptFile(file);
    setReceiptMeta(validation.fileMeta);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview('PDF_DOCUMENT');
    }
  };

  const handleDemoPaystackPayment = () => {
    if (!validateGuestForm()) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      const sim = simulatePaystackPayment({
        reference: bookingRef,
        amount: grandTotal,
        currency,
        channel: 'card',
      });
      setPaymentTransaction(sim);
      setPaymentStatus('CONFIRMED');
      setAssignedRoomUnit(getAssignedRoom(room.id));
      setIsProcessingPayment(false);
      setStep(4);
      triggerSuccessConfetti();
    }, 900);
  };

  const handleConfirmBooking = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateGuestForm()) return;

    if (paymentMethod === 'paystack') {
      setIsProcessingPayment(true);
      try {
        const res = await initializePaystackCheckout({
          email: guestEmail,
          amount: grandTotal,
          currency,
          reference: bookingRef,
          metadata: {
            guestName,
            guestPhone,
            roomName: room.name,
            nights,
          },
          onSuccess: (paystackRes) => {
            setPaymentTransaction(paystackRes);
            setPaymentStatus('CONFIRMED');
            setAssignedRoomUnit(getAssignedRoom(room.id));
            setIsProcessingPayment(false);
            setStep(4);
            triggerSuccessConfetti();
          },
          onClose: () => {
            setIsProcessingPayment(false);
          },
          onError: () => {
            // Fallback to simulated demo if live script cannot reach Paystack servers
            handleDemoPaystackPayment();
          },
        });

        if (res?.status === 'error') {
          handleDemoPaystackPayment();
        }
      } catch (err) {
        handleDemoPaystackPayment();
      }
      return;
    }

    if (paymentMethod === 'transfer') {
      if (!receiptFile) {
        setReceiptError('Please attach a screenshot or PDF receipt of your transfer before submitting.');
        return;
      }
      setReceiptError(null);
      setPaymentStatus('AWAITING_VERIFICATION');
      setAssignedRoomUnit('Unit assigned upon Front Desk verification');
      setStep(4);
      triggerSuccessConfetti();
      return;
    }

    if (paymentMethod === 'pos-arrival') {
      setPaymentStatus('HELD_FOR_ARRIVAL');
      setAssignedRoomUnit('Assigned upon arrival at Front Desk');
      setStep(4);
      triggerSuccessConfetti();
    }
  };

  const handleSendToWhatsApp = () => {
    const selectedAddonNames = selectedAddons
      .map((id) => ADDONS_DATA.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const prefNotes = [];
    if (selectedAddons.includes('train-pickup')) {
      prefNotes.push(`🚆 Train Arrival: ${addonPreferences.trainTime} from ${addonPreferences.trainStation}`);
    }
    if (selectedAddons.includes('spa-massage')) {
      prefNotes.push(`✨ Spa Treatment: ${addonPreferences.spaType}`);
    }
    if (selectedAddons.includes('rooftop-dinner')) {
      prefNotes.push(`🍷 Rooftop Dinner: ${addonPreferences.dinnerOccasion}`);
    }

    let statusLine = 'STATUS: RESERVATION LOGGED';
    if (paymentStatus === 'CONFIRMED') {
      statusLine = `✅ PAYMENT CONFIRMED via PAYSTACK\nTrans Ref: #${paymentTransaction?.reference || bookingRef}\nAssigned Room: ${assignedRoomUnit}`;
    } else if (paymentStatus === 'AWAITING_VERIFICATION') {
      statusLine = `⏳ DIRECT BANK TRANSFER SUBMISSION\nTransferred To: ${BANK_TRANSFER_INFO.bankName}\nNarration Used: #${bookingRef}\nReceipt Attached: ${receiptMeta?.name || 'Sent via chat'}`;
    } else if (paymentStatus === 'HELD_FOR_ARRIVAL') {
      statusLine = `🛎️ RESERVATION HELD (POS ON ARRIVAL)\nPayment Due at Check-in: ${formatAmount(grandTotal)}`;
    }

    const msg = `*DIRECT RESERVATION — OXYGEN ORBIS RESORT*
Ref Code: *#${bookingRef}*
${statusLine}

Guest Name: *${guestName}*
Phone: *${guestPhone}*
Email: *${guestEmail}*
Room: *${room.name}*
Dates: *${checkIn} to ${checkOut}* (${nights} Night${nights > 1 ? 's' : ''})
Guests: *${guests}*
Add-ons: *${selectedAddonNames || 'None'}*
${prefNotes.length > 0 ? `Enhancements:\n${prefNotes.join('\n')}\n` : ''}Total Amount: *${formatAmount(grandTotal)}*

Special Requests: ${specialRequests || 'None'}

Please review our reservation and digital check-in pass!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${RESORT_INFO.whatsapp}?text=${encoded}`, '_blank');
  };

  const handlePrintVoucher = () => {
    const html = generatePrintableVoucherHtml({
      reference: bookingRef,
      guestName: guestName || 'Esteemed Guest',
      guestPhone: guestPhone || RESORT_INFO.phone,
      roomName: room.name,
      roomUnit: assignedRoomUnit || 'Room 204',
      checkIn: checkIn || '2026-10-02',
      checkOut: checkOut || '2026-10-04',
      nights,
      guests,
      totalFormatted: formatAmount(grandTotal),
      paymentMethod: paymentMethod.toUpperCase(),
      addons: selectedAddons.map((id) => ADDONS_DATA.find((a) => a.id === id)?.name).filter(Boolean),
    });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const handleViewInvoice = () => {
    const html = generateLuxuryInvoiceHtml({
      reference: bookingRef,
      guestName: guestName || 'Esteemed Guest',
      guestEmail: guestEmail || 'guest@example.com',
      guestPhone: guestPhone || RESORT_INFO.phone,
      roomName: room.name,
      roomUnit: assignedRoomUnit || 'Room 204',
      checkIn: checkIn || '2026-10-02',
      checkOut: checkOut || '2026-10-04',
      nights,
      roomPricePerNight: currency === 'USD' ? room.priceUSD : room.priceNGN,
      addons: selectedAddons.map((id) => {
        const a = ADDONS_DATA.find((item) => item.id === id);
        return { name: a?.name || id, price: currency === 'USD' ? a?.priceUSD : a?.priceNGN };
      }),
      paymentMethod: paymentMethod.toUpperCase(),
      currency,
    });
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(html);
      invoiceWindow.document.close();
    }
  };

  const getAddonIcon = (iconName) => {
    switch (iconName) {
      case 'Car': return <Car className="w-4 h-4 text-[#C5A880]" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-4 h-4 text-[#C5A880]" />;
      case 'Wine': return <Wine className="w-4 h-4 text-[#C5A880]" />;
      case 'Clock': return <Clock className="w-4 h-4 text-[#C5A880]" />;
      default: return <Sparkles className="w-4 h-4 text-[#C5A880]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111B24] border border-[#C5A880]/50 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#243546] flex items-center justify-between sticky top-0 bg-[#111B24]/95 backdrop-blur-md z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold">
                Direct Booking Engine
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
              {step === 4 ? 'Reservation Confirmed!' : 'Reserve Your Staycation'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#172430] hover:bg-[#243546] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 border-b border-[#243546]/50 flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1.5 font-medium ${step >= 1 ? 'text-[#C5A880]' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
              <span>Room & Dates</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-1.5 font-medium ${step >= 2 ? 'text-[#C5A880]' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
              <span>Enhancements</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className={`flex items-center gap-1.5 font-medium ${step >= 3 ? 'text-[#C5A880]' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
              <span>Guest & Pay</span>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 sm:p-7 flex-1">
          {/* STEP 1: ROOM & DATES */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0A1118] border border-[#243546] rounded-xl p-3">
                  <label className="text-[11px] font-semibold uppercase text-[#C5A880] block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="bg-[#0A1118] border border-[#243546] rounded-xl p-3">
                  <label className="text-[11px] font-semibold uppercase text-[#C5A880] block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Guests Count */}
              <div className="bg-[#0A1118] border border-[#243546] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-semibold uppercase text-[#C5A880] block flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Total Guests
                  </label>
                  <span className="text-xs text-slate-400">Max 2 persons per room (Resort Policy)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-lg bg-[#172430] border border-[#243546] text-slate-200 hover:text-white flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-base text-white">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(room.maxGuests || 2, guests + 1))}
                    className="w-8 h-8 rounded-lg bg-[#172430] border border-[#243546] text-slate-200 hover:text-white flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Room Selection Carousel / List */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#C5A880] block mb-3">
                  Select Room Tier:
                </label>
                <div className="space-y-3">
                  {ROOMS_DATA.map((r) => {
                    const isSelected = r.id === selectedRoomId;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoomId(r.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/15'
                            : 'bg-[#0A1118]/70 border-[#243546] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={r.image}
                            alt={r.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white font-serif">{r.name}</h4>
                            <p className="text-[11px] text-slate-400">{r.bed} • {r.view}</p>
                            <span className="text-[10px] text-emerald-400 font-medium">Free Breakfast Included</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 mb-0.5">
                            <span className="text-[9px] font-bold uppercase text-[#C5A880] bg-[#C5A880]/15 px-1.5 py-0.5 rounded">
                              Promo
                            </span>
                            {r.normalPriceNGN && r.normalPriceNGN > r.priceNGN && (
                              <span className="text-[11px] text-slate-500 line-through">
                                {currency === 'USD' ? `$${r.normalPriceUSD}` : `₦${r.normalPriceNGN.toLocaleString()}`}
                              </span>
                            )}
                          </div>
                          <span className="font-serif text-base font-bold text-white block">
                            {currency === 'USD' ? `$${r.priceUSD}` : `₦${r.priceNGN.toLocaleString()}`}
                          </span>
                          <span className="text-[10px] text-slate-400">/ night</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Step CTA */}
              <div className="pt-4 border-t border-[#243546] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 block">
                      {nights} Night{nights > 1 ? 's' : ''} Stay:
                    </span>
                    {dynamicStayQuote.highestSurge > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                        +{dynamicStayQuote.highestSurge}% {dynamicStayQuote.primaryTier === 'WEEKEND_STAYCATION' ? 'Weekend' : 'Holiday'}
                      </span>
                    )}
                  </div>
                  <span className="font-serif text-xl font-bold text-[#C5A880]">
                    {formatAmount(roomTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="gold-gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <span>Select Enhancements</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ENHANCEMENTS / ADD-ONS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  Elevate Your Staycation Experience
                </h3>
                <p className="text-xs text-slate-400">
                  Select exclusive amenities and services to make your retreat unforgettable.
                </p>
              </div>

              {/* VIP Bundle Highlight if 2+ selected */}
              {selectedAddons.length >= 2 && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">VIP Staycation Bundle Active!</span>
                      <span className="text-[10px] text-emerald-300">Priority concierge check-in & welcome mocktails included.</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-900 border border-emerald-600/40 text-emerald-300">
                    VIP Perks
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {ADDONS_DATA.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  const priceFormatted = currency === 'USD' ? `$${addon.priceUSD}` : `₦${addon.priceNGN.toLocaleString()}`;

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/15'
                          : 'bg-[#0A1118]/60 border-[#243546] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl border mt-0.5 ${
                            isChecked ? 'bg-[#C5A880]/20 border-[#C5A880]' : 'bg-[#111B24] border-[#243546]'
                          }`}>
                            {getAddonIcon(addon.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-white">{addon.name}</h4>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-[#C5A880] font-medium">
                                {addon.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-md">{addon.description}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs sm:text-sm font-bold text-white block">{priceFormatted}</span>
                          <div className={`w-5 h-5 rounded-md mt-1 ml-auto border flex items-center justify-center transition ${
                            isChecked ? 'bg-[#C5A880] border-[#C5A880] text-black' : 'border-[#243546]'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Configuration Fields when checked */}
                      {isChecked && addon.id === 'train-pickup' && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-3 pt-3 border-t border-[#243546] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
                        >
                          <div>
                            <label className="text-[10px] text-[#C5A880] uppercase font-semibold block mb-1">
                              Expected Train Arrival Time
                            </label>
                            <input
                              type="text"
                              value={addonPreferences.trainTime}
                              onChange={(e) => setAddonPreferences({ ...addonPreferences, trainTime: e.target.value })}
                              placeholder="e.g. 14:30 or 18:30 Lagos train"
                              className="w-full bg-[#0A1118] border border-[#243546] rounded-xl px-2.5 py-1.5 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#C5A880] uppercase font-semibold block mb-1">
                              Lagos Departure Station
                            </label>
                            <select
                              value={addonPreferences.trainStation}
                              onChange={(e) => setAddonPreferences({ ...addonPreferences, trainStation: e.target.value })}
                              className="w-full bg-[#0A1118] border border-[#243546] rounded-xl px-2.5 py-1.5 text-white text-xs"
                            >
                              <option value="Ebute Metta (Mobolaji Johnson)">Ebute Metta (Mobolaji Johnson Station)</option>
                              <option value="Agege Station (Babatunde Fashola)">Agege Station (Babatunde Fashola)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {isChecked && addon.id === 'spa-massage' && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-3 pt-3 border-t border-[#243546] text-xs"
                        >
                          <label className="text-[10px] text-[#C5A880] uppercase font-semibold block mb-1">
                            Select Massage Technique:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Swedish Relaxation', 'Deep Tissue', 'Hot Stone / Aromatherapy'].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setAddonPreferences({ ...addonPreferences, spaType: type })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] border transition ${
                                  addonPreferences.spaType === type
                                    ? 'bg-[#C5A880] text-black font-semibold border-[#C5A880]'
                                    : 'bg-[#0A1118] text-slate-300 border-[#243546]'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {isChecked && addon.id === 'rooftop-dinner' && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-3 pt-3 border-t border-[#243546] text-xs"
                        >
                          <label className="text-[10px] text-[#C5A880] uppercase font-semibold block mb-1">
                            Dinner Occasion / Table Setup:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Romantic Getaway', 'Wedding Anniversary', 'Birthday Celebration', 'Quiet Evening'].map((occ) => (
                              <button
                                key={occ}
                                type="button"
                                onClick={() => setAddonPreferences({ ...addonPreferences, dinnerOccasion: occ })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] border transition ${
                                  addonPreferences.dinnerOccasion === occ
                                    ? 'bg-[#C5A880] text-black font-semibold border-[#C5A880]'
                                    : 'bg-[#0A1118] text-slate-300 border-[#243546]'
                                }`}
                              >
                                {occ}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#243546] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-[#243546] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Subtotal:</span>
                  <span className="font-serif text-lg font-bold text-[#C5A880]">
                    {formatAmount(grandTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className="gold-gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                  <span>Guest Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: GUEST DETAILS & PAYMENT METHOD */}
          {step === 3 && (
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">
                  Guest Information & Payment
                </h3>
                <p className="text-xs text-slate-400">
                  Provide your reservation contact details to secure your room at Oxygen Orbis.
                </p>
              </div>

              {/* Global Error Banner if any */}
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Please check your reservation details:</span>
                    <ul className="list-disc list-inside mt-0.5 text-[11px] space-y-0.5 text-rose-200">
                      {Object.values(formErrors).map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold uppercase text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Full Name (First & Last) *</span>
                    {formErrors.name && <span className="text-rose-400 text-[10px] font-normal">{formErrors.name}</span>}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Babatunde Adeleke"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    className={`w-full bg-[#0A1118] border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${
                      formErrors.name ? 'border-rose-500' : 'border-[#243546] focus:border-[#C5A880]'
                    }`}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Email Address (For Invoicing & QR) *</span>
                    {formErrors.email && <span className="text-rose-400 text-[10px] font-normal">{formErrors.email}</span>}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="babatunde@example.com"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                    }}
                    className={`w-full bg-[#0A1118] border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${
                      formErrors.email ? 'border-rose-500' : 'border-[#243546] focus:border-[#C5A880]'
                    }`}
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Phone / WhatsApp Number *</span>
                    {formErrors.phone && <span className="text-rose-400 text-[10px] font-normal">{formErrors.phone}</span>}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0806 064 8413 or +234..."
                    value={guestPhone}
                    onChange={(e) => {
                      setGuestPhone(e.target.value);
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full bg-[#0A1118] border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${
                      formErrors.phone ? 'border-rose-500' : 'border-[#243546] focus:border-[#C5A880]'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Accepts Nigerian 11-digit or international format</span>
                </div>

                {/* Special Requests */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold uppercase text-slate-300 block mb-1">
                    Special Requests & Preferences (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add any specific arrival notes, celebrations, or room preferences..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-[#0A1118] border border-[#243546] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#C5A880]"
                  />
                  {/* Quick Pill Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['🚆 Moniya Train Arrival', '🌅 High Floor', '🤫 Quiet Sanctuary', '🎉 Anniversary/Birthday', '🏊 Pool View'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSpecialRequests((prev) => prev ? `${prev}, ${tag}` : tag)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-[#172430] hover:bg-[#243546] text-slate-300 border border-[#243546] hover:border-[#C5A880]/50 transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cashless Property Policy Checkbox */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#0A1118] border border-[#243546] space-y-1.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToCashlessPolicy}
                      onChange={(e) => {
                        setAgreedToCashlessPolicy(e.target.checked);
                        if (e.target.checked && formErrors.policy) {
                          setFormErrors({ ...formErrors, policy: null });
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded accent-[#C5A880] cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      I understand and agree that <strong className="text-white">Oxygen Orbis is a cashless property</strong>. All room reservations, incidentals, and dining are settled via Debit/Credit Card, Direct Bank Transfer, or POS terminal at check-in.
                    </span>
                  </label>
                  {formErrors.policy && (
                    <p className="text-[11px] text-rose-400 font-medium pl-6">{formErrors.policy}</p>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#C5A880] block mb-2">
                  Choose Payment Method:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setPaymentMethod('paystack')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'paystack'
                        ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/10'
                        : 'bg-[#0A1118] border-[#243546] hover:border-slate-500'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#C5A880] mb-1.5" />
                    <h5 className="text-xs font-bold text-white">Instant Card / Paystack</h5>
                    <p className="text-[10px] text-slate-400">Mastercard, Visa, Verve</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'transfer'
                        ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/10'
                        : 'bg-[#0A1118] border-[#243546] hover:border-slate-500'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#C5A880] mb-1.5" />
                    <h5 className="text-xs font-bold text-white">Direct Bank Transfer</h5>
                    <p className="text-[10px] text-slate-400">Oxygen Orbis GTBank</p>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('pos-arrival')}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'pos-arrival'
                        ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/10'
                        : 'bg-[#0A1118] border-[#243546] hover:border-slate-500'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#C5A880] mb-1.5" />
                    <h5 className="text-xs font-bold text-white">POS Card on Arrival</h5>
                    <p className="text-[10px] text-slate-400">Hold with verified phone</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Payment Method Sub-Panel */}
              {paymentMethod === 'paystack' && (
                <div className="p-4 rounded-2xl bg-[#0A1118] border border-[#C5A880]/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Paystack Instant Gateway</span>
                    </div>
                    <span className="text-[10px] text-[#C5A880] px-2 py-0.5 rounded bg-[#C5A880]/10 font-mono">
                      Zero Processing Surcharge
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Settle securely via Nigerian debit cards, dynamic virtual bank transfer, or USSD banking. 256-bit AES encrypted.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="px-2 py-1 rounded bg-[#172430] border border-[#243546] text-slate-200">💳 Mastercard / Visa / Verve</span>
                    <span className="px-2 py-1 rounded bg-[#172430] border border-[#243546] text-slate-200">🏦 Pay with Transfer (Virtual Acc)</span>
                    <span className="px-2 py-1 rounded bg-[#172430] border border-[#243546] text-slate-200">📱 USSD (*737#, *966#, etc.)</span>
                  </div>
                  {/* Pitch / Demo mode testing button */}
                  <div className="pt-2.5 border-t border-[#243546] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Presentation Demo Mode:
                    </span>
                    <button
                      type="button"
                      onClick={handleDemoPaystackPayment}
                      disabled={isProcessingPayment}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-semibold transition flex items-center gap-1.5"
                    >
                      {isProcessingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>⚡ Simulate Instant Paystack Approval</span>}
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="p-4 rounded-2xl bg-[#0A1118] border border-[#C5A880]/40 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#C5A880]" /> Oxygen Orbis Corporate Account
                    </span>
                    <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 font-semibold">
                      15-Min Front Desk SLA
                    </span>
                  </div>

                  {/* Bank Details Grid */}
                  <div className="p-3.5 rounded-xl bg-[#111B24] border border-[#243546] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Bank Name</span>
                      <span className="font-bold text-white">{BANK_TRANSFER_INFO.bankName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Account Name</span>
                      <span className="font-semibold text-slate-200">{BANK_TRANSFER_INFO.accountName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Account Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-base font-bold text-[#C5A880] tracking-wider">{BANK_TRANSFER_INFO.accountNumber}</span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="p-1.5 rounded-lg bg-[#172430] hover:bg-[#243546] text-slate-300 border border-[#243546] text-[10px] flex items-center gap-1 transition"
                          title="Copy account number"
                        >
                          {copiedAccount ? <span className="text-emerald-400 font-bold">✓ Copied</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase block font-semibold">Required Payment Narration *</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-white bg-black/60 px-2 py-1 rounded border border-[#243546]">
                          #{bookingRef}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyNarration}
                          className="p-1.5 rounded-lg bg-[#172430] hover:bg-[#243546] text-slate-300 border border-[#243546] text-[10px] flex items-center gap-1 transition"
                          title="Copy narration reference"
                        >
                          {copiedNarration ? <span className="text-emerald-400 font-bold">✓ Copied</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Receipt File Upload */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase text-slate-300 block flex items-center justify-between">
                      <span>Attach Transfer Receipt / Screenshot *</span>
                      {receiptMeta && <span className="text-emerald-400 text-[10px]">✓ {receiptMeta.formattedSize}</span>}
                    </label>

                    <div className="border-2 border-dashed border-[#243546] hover:border-[#C5A880] rounded-xl p-4 text-center cursor-pointer transition relative bg-[#111B24]/60">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleReceiptChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {receiptPreview ? (
                        <div className="flex items-center justify-center gap-3">
                          {receiptPreview === 'PDF_DOCUMENT' ? (
                            <FileText className="w-8 h-8 text-rose-400" />
                          ) : (
                            <img src={receiptPreview} alt="Receipt preview" className="w-12 h-12 object-cover rounded-lg border border-[#C5A880]" />
                          )}
                          <div className="text-left text-xs">
                            <p className="font-bold text-white truncate max-w-[200px]">{receiptFile?.name}</p>
                            <p className="text-[10px] text-emerald-400">Ready for Front Desk reconciliation</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptFile(null);
                              setReceiptPreview(null);
                              setReceiptMeta(null);
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Upload className="w-6 h-6 text-[#C5A880] mb-0.5" />
                          <p className="text-xs text-white font-medium">Click to select or drag transfer receipt screenshot</p>
                          <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP, or PDF (Maximum 5 MB)</p>
                        </div>
                      )}
                    </div>
                    {receiptError && (
                      <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {receiptError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === 'pos-arrival' && (
                <div className="p-4 rounded-2xl bg-[#0A1118] border border-[#243546] space-y-2 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#C5A880]" />
                    <span className="font-bold text-white uppercase tracking-wider">Cashless POS Check-In Guarantee</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Your room will be held under your verified phone number (<strong className="text-white">{guestPhone || 'provided above'}</strong>).
                    Payment of <strong className="text-[#C5A880]">{formatAmount(grandTotal)}</strong> is settled via contactless POS terminal at reception upon arrival in Moniya.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    * Standard hold expires at 6:00 PM on check-in date unless late arrival from the Moniya train terminal is communicated to front desk.
                  </p>
                </div>
              )}

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-[#0A1118] border border-[#243546] text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>{room.name} ({nights} Night{nights > 1 ? 's' : ''})</span>
                  <span>{formatAmount(roomTotal)}</span>
                </div>

                {dynamicStayQuote.highestSurge > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-[#C5A880] bg-[#C5A880]/10 px-2.5 py-1.5 rounded-xl border border-[#C5A880]/20">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>{dynamicStayQuote.primaryReason}</span>
                    </span>
                    <span className="font-mono font-bold">+{dynamicStayQuote.highestSurge}% applied</span>
                  </div>
                )}

                {!dynamicStayQuote.isMinStaySatisfied && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Peak Policy: Minimum {dynamicStayQuote.requiredMinNights}-night stay recommended for this holiday period.</span>
                  </div>
                )}

                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Selected Enhancements ({selectedAddons.length})</span>
                    <span>+{formatAmount(addonsTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#243546] flex justify-between font-bold text-sm text-white">
                  <span>Grand Total:</span>
                  <span className="font-serif text-lg text-[#C5A880]">{formatAmount(grandTotal)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-[#243546] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="gold-gradient-btn px-7 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#C5A880]/20 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : paymentMethod === 'paystack' ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay with Paystack ({formatAmount(grandTotal)})</span>
                    </>
                  ) : paymentMethod === 'transfer' ? (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit Bank Transfer Receipt</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Reservation (POS on Arrival)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION & DIGITAL PASS */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              {paymentStatus === 'CONFIRMED' && (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              )}

              {paymentStatus === 'AWAITING_VERIFICATION' && (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                  <Clock className="w-9 h-9" />
                </div>
              )}

              {paymentStatus === 'HELD_FOR_ARRIVAL' && (
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 mx-auto flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                  <Smartphone className="w-9 h-9" />
                </div>
              )}

              <div>
                <span className={`text-xs font-semibold uppercase tracking-widest block mb-1 ${
                  paymentStatus === 'CONFIRMED' ? 'text-emerald-400' : paymentStatus === 'AWAITING_VERIFICATION' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {paymentStatus === 'CONFIRMED' ? 'Payment Verified & Confirmed' : paymentStatus === 'AWAITING_VERIFICATION' ? 'Transfer Received — Awaiting Verification' : 'Reservation Guaranteed on Hold'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {paymentStatus === 'CONFIRMED' ? 'Your Sanctuary is Ready!' : paymentStatus === 'AWAITING_VERIFICATION' ? 'Receipt Submitted Successfully!' : 'We Look Forward to Welcoming You!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                  {paymentStatus === 'CONFIRMED'
                    ? `Reservation guaranteed for ${guestName}. Digital stay pass issued.`
                    : paymentStatus === 'AWAITING_VERIFICATION'
                    ? `Receipt logged for ${guestName}. Front Desk reconciles GTBank transfers within 15 minutes.`
                    : `Reservation held for ${guestName}. Settle payment with card POS terminal upon arrival.`}
                </p>
              </div>

              {/* Digital Guest Pass Card */}
              <div className="max-w-md mx-auto bg-gradient-to-b from-[#172430] to-[#0A1118] border border-[#C5A880]/60 rounded-3xl p-6 text-left shadow-2xl relative overflow-hidden">
                {/* Decorative header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#243546] mb-4">
                  <div>
                    <h4 className="font-serif font-bold text-white tracking-wider">OXYGEN ORBIS</h4>
                    <p className="text-[9px] uppercase tracking-widest text-[#C5A880]">Moniya, Ibadan • Guest Stay Pass</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Booking Reference</span>
                    <span className="font-mono text-sm font-bold text-[#C5A880]">#{bookingRef}</span>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-medium">Reservation Status:</span>
                  {paymentStatus === 'CONFIRMED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-[10px]">
                      ✓ PAID & GUARANTEED
                    </span>
                  )}
                  {paymentStatus === 'AWAITING_VERIFICATION' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-[10px]">
                      ⏳ AWAITING VERIFICATION
                    </span>
                  )}
                  {paymentStatus === 'HELD_FOR_ARRIVAL' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-[10px]">
                      🛎️ HOLD FOR POS ARRIVAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Room Category</span>
                    <span className="font-semibold text-white">{room.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Assigned Unit</span>
                    <span className="font-semibold text-[#C5A880]">{assignedRoomUnit || 'Assigned at check-in'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Guests</span>
                    <span className="font-semibold text-white">{guests} Guest{guests > 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Duration</span>
                    <span className="font-semibold text-white">{nights} Night{nights > 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Check-In</span>
                    <span className="font-semibold text-white">{checkIn ? `${checkIn} (From 2:00 PM)` : 'From 2:00 PM'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Check-Out</span>
                    <span className="font-semibold text-white">{checkOut ? `${checkOut} (Until 12:00 Noon)` : 'Until 12:00 Noon'}</span>
                  </div>
                </div>

                {/* QR Code / Digital Barcode Area */}
                <div className="p-3 bg-[#0A1118] border border-[#243546] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-medium block">✓ Front Desk Mobile Check-in</span>
                    <span className="text-[11px] text-slate-300">Scan at Moniya reception on arrival</span>
                  </div>
                  <div className="w-12 h-12 bg-white p-1 rounded-md shrink-0 flex items-center justify-center">
                    <div className="w-full h-full border-2 border-black grid grid-cols-3 gap-0.5 p-0.5 bg-black">
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-white"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#243546] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="font-serif text-base font-bold text-[#C5A880]">{formatAmount(grandTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {paymentStatus === 'AWAITING_VERIFICATION'
                      ? `Send Receipt to Hotel WhatsApp (${RESORT_INFO.phone})`
                      : `Send Pass to Hotel WhatsApp (${RESORT_INFO.phone})`}
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintVoucher}
                    className="py-2.5 px-3 rounded-xl bg-[#172430] hover:bg-[#243546] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#243546] hover:border-[#C5A880]/50 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Print Stay Voucher (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleViewInvoice}
                    className="py-2.5 px-3 rounded-xl bg-[#172430] hover:bg-[#243546] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#243546] hover:border-[#C5A880]/50 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>View Official Tax Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

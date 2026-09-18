import React, { useState } from 'react';
import { 
  X, Calendar, ChevronLeft, ChevronRight, Sparkles, 
  BedDouble, Clock, Check, ArrowRight, ShieldCheck, Flame 
} from 'lucide-react';
import { ROOMS_DATA } from '../data/resortData.js';
import { 
  getMonthCalendarMatrix, 
  calculateStayQuote, 
  getQuickStaycationPresets, 
  formatDateISO 
} from '../services/availabilityService.js';

export default function AvailabilityCalendarModal({ 
  isOpen, 
  onClose, 
  currency = 'NGN', 
  onSelectDatesAndBook 
}) {
  if (!isOpen) return null;

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS_DATA[0].id);

  // Default selection: tomorrow + 2 nights
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 1);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckIn.getDate() + 2);

  const [checkIn, setCheckIn] = useState(formatDateISO(defaultCheckIn));
  const [checkOut, setCheckOut] = useState(formatDateISO(defaultCheckOut));
  const [selectingStep, setSelectingStep] = useState('checkIn'); // 'checkIn' or 'checkOut'

  const presets = getQuickStaycationPresets();
  const calendarDays = getMonthCalendarMatrix({
    year: currentYear,
    month: currentMonth,
    roomTypeId: selectedRoomId,
    currency,
  });

  const quote = calculateStayQuote({
    roomTypeId: selectedRoomId,
    checkInStr: checkIn,
    checkOutStr: checkOut,
    currency,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (dateStr, isAvailable) => {
    if (!isAvailable) return;

    if (selectingStep === 'checkIn') {
      setCheckIn(dateStr);
      // Auto-set checkOut to next day
      const nextDay = new Date(dateStr);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(formatDateISO(nextDay));
      setSelectingStep('checkOut');
    } else {
      const start = new Date(checkIn);
      const chosen = new Date(dateStr);

      if (chosen <= start) {
        // Reset checkIn
        setCheckIn(dateStr);
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOut(formatDateISO(nextDay));
        setSelectingStep('checkOut');
      } else {
        setCheckOut(dateStr);
        setSelectingStep('checkIn');
      }
    }
  };

  const applyPreset = (preset) => {
    setCheckIn(preset.checkIn);
    setCheckOut(preset.checkOut);
    setSelectingStep('checkIn');
  };

  const isSelectedRange = (dateStr) => {
    if (!checkIn || !checkOut || !dateStr) return false;
    return dateStr >= checkIn && dateStr <= checkOut;
  };

  const isEndpoint = (dateStr) => {
    return dateStr === checkIn || dateStr === checkOut;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111B24] border border-[#C5A880]/60 rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col relative text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#243546] flex items-center justify-between sticky top-0 bg-[#111B24]/95 backdrop-blur-md z-20">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span className="text-[11px] uppercase tracking-wider text-[#C5A880] font-bold">
                Live Rate & Availability Matrix
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
              Select Your Staycation Dates
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#172430] hover:bg-[#243546] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6 flex-1">
          
          {/* Room Tier Selector Bar */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Room Tier To Check Live Rates:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROOMS_DATA.map((r) => {
                const isSelected = r.id === selectedRoomId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoomId(r.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#172430] border-[#C5A880] shadow-md shadow-[#C5A880]/20'
                        : 'bg-[#0A1118] border-[#243546] hover:border-slate-500'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-white font-serif truncate">{r.name}</h4>
                    <span className="text-[11px] text-[#C5A880] font-semibold block mt-0.5">
                      {currency === 'USD' ? `$${r.priceUSD}` : `₦${(r.priceNGN / 1000).toFixed(0)}k`} / nt
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Staycation Presets */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Popular Lagos-to-Ibadan Presets:
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition text-xs ${
                    checkIn === preset.checkIn && checkOut === preset.checkOut
                      ? 'bg-emerald-950/70 border-emerald-500 text-white'
                      : 'bg-[#0A1118]/80 border-[#243546] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="font-semibold block text-white text-[11px]">{preset.label}</span>
                  <span className="text-[10px] text-slate-400 block">{preset.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Month Navigation & Calendar Grid */}
          <div className="bg-[#0A1118] border border-[#243546] rounded-3xl p-4 sm:p-6 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-[#111B24] border border-[#243546] hover:text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-[#111B24] border border-[#243546] hover:text-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 pb-2 border-b border-[#243546]">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span className="text-amber-400">Fri (Peak)</span>
              <span className="text-amber-400">Sat (Peak)</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarDays.map((day, idx) => {
                if (day.isPadding) {
                  return <div key={`pad-${idx}`} className="h-14 sm:h-16 rounded-xl opacity-0" />;
                }

                const inRange = isSelectedRange(day.dateStr);
                const isBoundary = isEndpoint(day.dateStr);

                return (
                  <button
                    key={day.dateStr}
                    disabled={!day.isAvailable}
                    onClick={() => handleDateClick(day.dateStr, day.isAvailable)}
                    className={`h-14 sm:h-16 p-1 rounded-xl border flex flex-col justify-between text-left transition-all ${
                      !day.isAvailable
                        ? 'opacity-30 cursor-not-allowed bg-slate-900 border-transparent text-slate-600'
                        : isBoundary
                        ? 'bg-[#C5A880] border-[#D4AF37] text-black shadow-lg font-bold scale-[1.03] z-10'
                        : inRange
                        ? 'bg-[#C5A880]/20 border-[#C5A880]/60 text-white'
                        : 'bg-[#111B24] border-[#243546] hover:border-[#C5A880]/60 text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-xs ${isBoundary ? 'font-black' : 'font-semibold'}`}>
                        {day.dayNumber}
                      </span>
                      {day.isWeekend && !day.isPast && (
                        <Flame className={`w-3 h-3 ${isBoundary ? 'text-black' : 'text-amber-400'}`} />
                      )}
                    </div>

                    <div className="text-[10px] truncate">
                      <span className={isBoundary ? 'text-black font-bold' : 'text-[#C5A880]'}>
                        {day.formattedRate}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-[#243546] flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#C5A880]"></span> Selected Stay
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-400" /> Weekend Rate (15% Staycation)
                </span>
              </div>
              <span className="text-slate-400">
                Click Check-In date, then Check-Out date
              </span>
            </div>
          </div>

          {/* Stay Summary & Live Price Quote */}
          {quote.success && (
            <div className="bg-gradient-to-r from-[#172430] to-[#122B22] border border-[#C5A880]/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-white text-base sm:text-lg">
                    {quote.nights} Night{quote.nights > 1 ? 's' : ''} Stay: {quote.checkIn} → {quote.checkOut}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-light mt-0.5">
                  {quote.room.name} • Average {quote.formattedAvgRate} / night
                  {quote.weekendNightsCount > 0 && ` (Includes ${quote.weekendNightsCount} weekend night)`}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Total Room Price:</span>
                  <span className="font-serif text-2xl font-bold text-[#C5A880]">{quote.formattedTotal}</span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectDatesAndBook({
                      checkIn,
                      checkOut,
                      roomType: selectedRoomId,
                    });
                  }}
                  className="gold-gradient-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#C5A880]/20"
                >
                  <span>Book These Dates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

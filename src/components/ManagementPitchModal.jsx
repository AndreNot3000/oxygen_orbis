import React, { useState } from 'react';
import { 
  X, TrendingUp, DollarSign, Clock, ShieldCheck, MessageSquare, 
  Smartphone, Users, CheckCircle2, ArrowRight, Zap, Award, Download,
  Calendar, Sliders, BarChart3, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { RESORT_INFO, ROOMS_DATA } from '../data/resortData';
import { 
  calculateOtaVsDirectRoi, 
  generateFinancialStatementCsv, 
  calculate12MonthProjections,
  DEFAULT_RATE_RULES, 
  calculateDynamicNightRate 
} from '../services/revenueService';

export default function ManagementPitchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Active Tab: 'roi', 'dynamic-rates', 'dm-vs-webapp'
  const [activeTab, setActiveTab] = useState('roi');

  // ROI Calculator Parameters
  const [monthlyBookings, setMonthlyBookings] = useState(45);
  const [avgBookingValue, setAvgBookingValue] = useState(150000);
  const [selectedOta, setSelectedOta] = useState({ name: 'Agoda / Hotels.ng', rate: 0.20 });
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Graph Analytics State (Card 6.2)
  const [graphMode, setGraphMode] = useState('revenue'); // 'revenue' | 'occupancy'
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(11); // Defaults to December peak

  // Dynamic Rate Manager Controls
  const [weekendSurge, setWeekendSurge] = useState(DEFAULT_RATE_RULES.weekendSurgePercentage);
  const [simRoomType, setSimRoomType] = useState('executive-room');
  const [simDate, setSimDate] = useState('2026-10-02'); // Defaults to Independence Weekend Friday

  // Compute live metrics using revenue service
  const roiMetrics = calculateOtaVsDirectRoi({
    monthlyBookings,
    avgBookingValue,
    otaCommissionRate: selectedOta.rate,
    paystackFeeRate: 0.015,
  });

  // 12-Month Projections with Occupancy, ADR, RevPAR, and Direct Savings
  const projections = calculate12MonthProjections({
    monthlyBookings,
    avgBookingValue,
    otaCommissionRate: selectedOta.rate,
    paystackFeeRate: 0.015,
  });
  const activeMonth = projections.monthlyData[selectedMonthIdx] || projections.monthlyData[11];
  const maxGrossMonth = Math.max(...projections.monthlyData.map((m) => m.grossRevenue));

  // Dynamic Rate Simulator Quote
  const currentRules = {
    ...DEFAULT_RATE_RULES,
    weekendSurgePercentage: weekendSurge,
  };
  const rateQuote = calculateDynamicNightRate(simRoomType, simDate, currentRules);
  const selectedRoom = ROOMS_DATA.find((r) => r.id === simRoomType) || ROOMS_DATA[1];

  // Handle CSV Download
  const handleDownloadCsv = () => {
    try {
      const csvContent = generateFinancialStatementCsv({
        monthlyBookings,
        avgBookingValue,
        otaCommissionRate: selectedOta.rate,
        paystackFeeRate: 0.015,
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Oxygen_Orbis_12Month_Financial_Statement_${selectedOta.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0E1722] border-2 border-[#C5A880]/60 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-100 flex flex-col">
        
        {/* Pitch Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#172430] via-[#1A2E26] to-[#172430] border-b border-[#C5A880]/40 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A1208] border border-[#C9854A]/40 p-1.5 flex items-center justify-center shrink-0 shadow-lg">
              <img src="/logo.png" alt="Oxygen Orbis Logo" className="w-full h-full object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/50 text-xs font-bold text-[#C5A880]">
              <Award className="w-3.5 h-3.5" />
              <span>MODULE 6: REVENUE ANALYTICS & DIRECT BOOKING ROI</span>
            </div>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white mb-2">
            Why Oxygen Orbis Needs A Direct Booking WebApp
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-light">
            Direct bookings eliminate 18–22% OTA commissions, automate dynamic weekend pricing, and transition Instagram DM inquiries into instant confirmed revenue.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('roi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'roi'
                  ? 'bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20 font-bold'
                  : 'bg-[#111B24] text-slate-300 hover:text-white border border-[#243546]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>OTA vs Direct ROI & Financials</span>
            </button>

            <button
              onClick={() => setActiveTab('dynamic-rates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dynamic-rates'
                  ? 'bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20 font-bold'
                  : 'bg-[#111B24] text-slate-300 hover:text-white border border-[#243546]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Dynamic Rates & Peak Overrides</span>
            </button>

            <button
              onClick={() => setActiveTab('dm-vs-webapp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dm-vs-webapp'
                  ? 'bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20 font-bold'
                  : 'bg-[#111B24] text-slate-300 hover:text-white border border-[#243546]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Instagram DMs vs Direct WebApp</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          
          {/* TAB 1: ROI & OTA COMMISSION CALCULATOR (CARD 6.2) */}
          {activeTab === 'roi' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-[#111B24] border border-[#243546] rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] block">
                      Commission Elimination Engine & Yield Analytics (Card 6.2)
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      Direct Bookings vs. Online Travel Agencies (OTAs)
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold self-start flex items-center gap-1.5 shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{(roiMetrics.otaCommissionRate * 100).toFixed(0)}% OTA Commission Saved</span>
                  </div>
                </div>

                {/* Executive 5-Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">Annual Direct Savings</span>
                    <div className="my-1">
                      <span className="font-serif text-lg sm:text-xl font-bold text-emerald-400">
                        ₦{(projections.summary.totalSavings / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-200/80">Retained vs OTAs</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0A1118] border border-[#243546] flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Gross</span>
                    <div className="my-1">
                      <span className="font-serif text-lg sm:text-xl font-bold text-white">
                        ₦{(projections.summary.totalGross / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{projections.summary.totalBookings} Stays/Yr</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0A1118] border border-[#243546] flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Occupancy</span>
                    <div className="my-1">
                      <span className="font-serif text-lg sm:text-xl font-bold text-[#C5A880]">
                        {projections.summary.avgOccupancy}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">40 Room Units</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0A1118] border border-[#243546] flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Daily Rate</span>
                    <div className="my-1">
                      <span className="font-serif text-lg sm:text-xl font-bold text-cyan-300">
                        ₦{(projections.summary.avgAdr / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Portfolio ADR</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0A1118] border border-[#243546] flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Resort RevPAR</span>
                    <div className="my-1">
                      <span className="font-serif text-lg sm:text-xl font-bold text-amber-300">
                        ₦{(projections.summary.avgRevpar / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Yield Per Avail Room</span>
                  </div>
                </div>

                {/* Visual 12-Month Performance Graph / Chart (Card 6.2 Core Deliverable) */}
                <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                        <span>12-Month Revenue & Occupancy Seasonality Chart</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Click any month column below to inspect its operational and direct savings dossier.
                      </p>
                    </div>

                    {/* Chart Mode Toggle */}
                    <div className="bg-[#111B24] border border-[#243546] p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto text-xs">
                      <button
                        onClick={() => setGraphMode('revenue')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          graphMode === 'revenue'
                            ? 'bg-[#C5A880] text-black font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ₦ Gross & Direct Savings
                      </button>
                      <button
                        onClick={() => setGraphMode('occupancy')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          graphMode === 'occupancy'
                            ? 'bg-[#C5A880] text-black font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🏨 Occupancy % & RevPAR
                      </button>
                    </div>
                  </div>

                  {/* Visual Bar Chart Grid */}
                  <div className="pt-4 pb-2">
                    <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-48 sm:h-56 items-end relative border-b border-[#243546]/80 pb-2">
                      {/* Horizontal Reference Line */}
                      <div className="absolute top-0 left-0 right-0 border-t border-slate-800/60 pointer-events-none text-[9px] text-slate-600">
                        {graphMode === 'revenue' ? `Max Month: ₦${(maxGrossMonth / 1000000).toFixed(1)}M` : '100% Full Capacity'}
                      </div>
                      <div className="absolute top-1/2 left-0 right-0 border-t border-slate-800/40 pointer-events-none text-[9px] text-slate-600">
                        {graphMode === 'revenue' ? `Midpoint: ₦${(maxGrossMonth / 2000000).toFixed(1)}M` : '50% Occupancy Benchmark'}
                      </div>

                      {projections.monthlyData.map((m, idx) => {
                        const isSelected = selectedMonthIdx === idx;
                        const isPeak = m.seasonality >= 1.15;
                        const heightPct = graphMode === 'revenue'
                          ? Math.max(18, Math.round((m.grossRevenue / maxGrossMonth) * 100))
                          : Math.max(16, m.occupancyRate);

                        return (
                          <div
                            key={m.month}
                            onClick={() => setSelectedMonthIdx(idx)}
                            className={`group relative flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-200 ${
                              isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                            }`}
                          >
                            {/* Peak indicator pill */}
                            {isPeak && (
                              <span className="absolute -top-3 text-[8px] font-bold px-1 py-0.2 rounded bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 whitespace-nowrap hidden sm:block">
                                Peak
                              </span>
                            )}

                            {/* Value tooltip on hover or when selected */}
                            <span className={`text-[9px] font-mono font-bold mb-1 transition-opacity whitespace-nowrap ${
                              isSelected ? 'text-[#C5A880] opacity-100' : 'text-slate-400 opacity-70 group-hover:opacity-100'
                            }`}>
                              {graphMode === 'revenue' 
                                ? `₦${(m.grossRevenue / 1000000).toFixed(1)}M`
                                : `${m.occupancyRate}%`}
                            </span>

                            {/* Bar Cylinder */}
                            <div 
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-end ${
                                isSelected 
                                  ? 'ring-2 ring-[#C5A880] shadow-lg shadow-[#C5A880]/30' 
                                  : 'group-hover:opacity-90'
                              } ${
                                graphMode === 'revenue'
                                  ? isPeak
                                    ? 'bg-gradient-to-t from-amber-900/60 via-[#C5A880]/60 to-[#D4AF37]'
                                    : 'bg-gradient-to-t from-[#111B24] via-[#1C2C3B] to-[#C5A880]/50'
                                  : m.occupancyRate >= 60
                                  ? 'bg-gradient-to-t from-emerald-950 via-emerald-800 to-emerald-400'
                                  : m.occupancyRate >= 50
                                  ? 'bg-gradient-to-t from-amber-950 via-amber-800 to-[#C5A880]'
                                  : 'bg-gradient-to-t from-blue-950 via-blue-800 to-blue-400'
                              }`}
                            >
                              {/* Direct savings zone inside the bar (in revenue mode) */}
                              {graphMode === 'revenue' && (
                                <div 
                                  style={{ height: `${(m.savings / m.grossRevenue) * 100}%` }}
                                  className="w-full bg-emerald-500/50 border-t border-emerald-400/80"
                                  title={`Direct Profit Saved: +₦${m.savings.toLocaleString()}`}
                                />
                              )}
                            </div>

                            {/* Month Label */}
                            <span className={`text-[10px] font-semibold mt-2 transition ${
                              isSelected ? 'text-[#C5A880] font-bold' : 'text-slate-400 group-hover:text-slate-200'
                            }`}>
                              {m.shortMonth}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-4">
                        {graphMode === 'revenue' ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded bg-gradient-to-t from-[#1C2C3B] to-[#C5A880]/60 border border-[#C5A880]/40 inline-block"></span>
                              <span>Projected Gross Revenue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded bg-emerald-500/60 border border-emerald-400 inline-block"></span>
                              <span>Direct Savings Retained</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                              <span>High Demand (&gt;60% Occupancy)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded bg-[#C5A880] inline-block"></span>
                              <span>Target Standard (50–59%)</span>
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Selected: <strong className="text-white">{activeMonth.month}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Active Month Live Inspector Dossier */}
                  <div className="mt-4 p-4 rounded-xl bg-[#111B24] border border-[#243546] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-serif text-base font-bold text-white">
                          {activeMonth.month} Projections
                        </h5>
                        <span className="px-2 py-0.5 rounded-md bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] text-[10px] font-bold">
                          {activeMonth.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {activeMonth.bookings} reservations • {activeMonth.occupiedNights} room nights occupied of {activeMonth.availableNights} available
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                      <div className="p-2 rounded-lg bg-[#0A1118] border border-[#243546]">
                        <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                        <strong className="text-white font-mono">₦{activeMonth.grossRevenue.toLocaleString()}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                        <span className="text-[10px] text-emerald-300 block">Direct Saved</span>
                        <strong className="text-emerald-400 font-mono">+₦{activeMonth.savings.toLocaleString()}</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0A1118] border border-[#243546]">
                        <span className="text-[10px] text-slate-400 block">Occupancy %</span>
                        <strong className="text-[#C5A880] font-mono">{activeMonth.occupancyRate}%</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0A1118] border border-[#243546]">
                        <span className="text-[10px] text-slate-400 block">ADR / RevPAR</span>
                        <strong className="text-cyan-300 font-mono">₦{(activeMonth.adr / 1000).toFixed(0)}k / ₦{(activeMonth.revpar / 1000).toFixed(1)}k</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Parameters & Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Select OTA Channel */}
                  <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-4">
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Third-Party OTA Channel:
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { name: 'Booking.com', rate: 0.18 },
                        { name: 'Agoda / Hotels.ng', rate: 0.20 },
                        { name: 'Expedia Group', rate: 0.22 },
                      ].map((ota) => (
                        <button
                          key={ota.name}
                          onClick={() => setSelectedOta(ota)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                            selectedOta.name === ota.name
                              ? 'bg-[#1C2C3B] border border-[#C5A880] text-white font-bold'
                              : 'bg-[#111B24] text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <span>{ota.name}</span>
                          <span className="text-rose-400 font-mono">{(ota.rate * 100).toFixed(0)}% Fee</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Avg Booking Value Presets */}
                  <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-4">
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Average Booking Value:
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { label: '₦100,000 (1 Night Deluxe)', val: 100000 },
                        { label: '₦150,000 (2 Nights Weekend)', val: 150000 },
                        { label: '₦250,000 (Executive Retreat)', val: 250000 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setAvgBookingValue(item.val)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                            avgBookingValue === item.val
                              ? 'bg-[#1C2C3B] border border-[#C5A880] text-[#C5A880] font-bold'
                              : 'bg-[#111B24] text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Monthly Room Bookings:
                        </label>
                        <span className="font-serif text-lg font-bold text-[#C5A880]">
                          {monthlyBookings}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        value={monthlyBookings}
                        onChange={(e) => setMonthlyBookings(Number(e.target.value))}
                        className="w-full accent-[#C5A880] cursor-pointer h-2 bg-slate-800 rounded-lg mt-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>10 (Low)</span>
                        <span>45 (Expected)</span>
                        <span>120 (Peak)</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 bg-[#111B24] p-2 rounded-xl">
                      Annual Gross: <strong className="text-white">₦{(projections.summary.totalGross / 1000000).toFixed(1)}M</strong>
                    </div>
                  </div>
                </div>

                {/* Financial Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                  <div className="p-4 rounded-2xl bg-[#0A1118] border border-rose-500/30">
                    <span className="text-[11px] text-rose-400 uppercase font-semibold block mb-1">
                      Lost To {selectedOta.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      ({(selectedOta.rate * 100).toFixed(0)}% OTA Commission)
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-rose-400">
                      ₦{(projections.summary.totalOtaLoss / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">Deducted annually</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0A1118] border border-blue-500/30">
                    <span className="text-[11px] text-blue-400 uppercase font-semibold block mb-1">
                      Direct Processing Cost
                    </span>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      (Paystack Gateway at 1.5%)
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-blue-300">
                      ₦{(projections.summary.totalDirectFee / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">Processing fees only</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10">
                    <span className="text-[11px] text-emerald-300 uppercase font-bold block mb-1">
                      NET PROFIT KEPT AT RESORT
                    </span>
                    <span className="text-[10px] text-emerald-200 block mb-1">
                      (Retained In Oxygen Orbis Bank Account)
                    </span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-400">
                      ₦{(projections.summary.totalSavings / 1000000).toFixed(2)} Million
                    </span>
                    <span className="text-[10px] text-emerald-300 font-medium block mt-1">Pure annual direct savings</span>
                  </div>
                </div>

                {/* CSV Download Action Bar */}
                <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Executive 12-Month Financial Statement (CSV)</h4>
                      <p className="text-[11px] text-slate-400">
                        Includes Gross Revenue, OTA Savings, Occupancy %, ADR, and RevPAR breakdown exportable to Excel.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadCsv}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-[#C5A880] text-black hover:bg-[#D4AF37] transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#C5A880]/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Financial Statement (CSV)</span>
                  </button>
                </div>

                {downloadSuccess && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-900/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Financial statement successfully compiled and downloaded to your computer!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC RATES & HOLIDAY OVERRIDES MANAGER */}
          {activeTab === 'dynamic-rates' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-[#111B24] border border-[#243546] rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] block">
                      Revenue Yield & Pricing Rules
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      Dynamic Rate & Peak Weekend Pricing Manager
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#1C2C3B] border border-[#C5A880]/40 text-[#C5A880] text-xs font-semibold self-start">
                    Card 6.1 Deliverable
                  </div>
                </div>

                {/* Weekend Surge Slider */}
                <div className="bg-[#0A1118] border border-[#243546] rounded-2xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        Weekend Staycation Surcharge (Friday & Saturday):
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Capitalizes on high-demand weekend staycation rushes from Lagos and Ibadan executives.
                      </p>
                    </div>
                    <span className="font-mono text-xl font-bold text-[#C5A880]">
                      +{weekendSurge}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="5"
                    value={weekendSurge}
                    onChange={(e) => setWeekendSurge(Number(e.target.value))}
                    className="w-full accent-[#C5A880] cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>10% (Off-Peak)</span>
                    <span>15% (Recommended Standard)</span>
                    <span>35% (Peak Events)</span>
                  </div>
                </div>

                {/* Holiday Overrides Table */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C5A880]" />
                    <span>Scheduled Holiday Rate Overrides (Auto-Triggered by Public Engine)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {DEFAULT_RATE_RULES.holidayOverrides.map((h) => (
                      <div key={h.id} className="p-4 rounded-2xl bg-[#0A1118] border border-[#243546] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-white text-xs">{h.name}</strong>
                            <div className="flex items-center gap-1">
                              {h.minNights && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[9px] font-bold">
                                  {h.minNights}N Min
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                                +{h.surgePercentage}%
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 block mb-2">
                            {h.startDate} to {h.endDate}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSimDate(h.startDate);
                          }}
                          className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1 mt-2"
                        >
                          <span>Test in rate simulator</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Rate Simulator Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#111B24] to-[#172532] border-2 border-[#C5A880]/40">
                  <span className="text-[11px] font-bold text-[#C5A880] uppercase tracking-wider block mb-2">
                    ⚡ Live Rate Calculation Sandbox
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Room Category:</label>
                      <select
                        value={simRoomType}
                        onChange={(e) => setSimRoomType(e.target.value)}
                        className="w-full bg-[#0A1118] border border-[#243546] rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {ROOMS_DATA.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Date:</label>
                      <input
                        type="date"
                        value={simDate}
                        onChange={(e) => setSimDate(e.target.value)}
                        className="w-full bg-[#0A1118] border border-[#243546] rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Pricing Tier Triggered:</label>
                      <div className="px-3 py-2 rounded-xl bg-[#0A1118] border border-[#243546] text-xs font-bold flex items-center justify-between">
                        <span className={
                          rateQuote.pricingTier === 'HOLIDAY_PEAK'
                            ? 'text-amber-400'
                            : rateQuote.pricingTier === 'WEEKEND_STAYCATION'
                            ? 'text-emerald-400'
                            : 'text-blue-300'
                        }>
                          {rateQuote.pricingTier}
                        </span>
                        <span className="font-mono text-xs text-slate-400">+{rateQuote.appliedSurgePct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0A1118] rounded-xl border border-[#243546]">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{rateQuote.reason}</span>
                      <span className="text-xs text-slate-300">
                        Base Rate: ₦{(selectedRoom?.priceNGN || 48000).toLocaleString()} ➔ Surge: +₦{Math.max(0, rateQuote.rate - (selectedRoom?.priceNGN || 48000)).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Yield Rate / Night</span>
                      <span className="font-serif text-xl font-bold text-[#C5A880]">
                        ₦{rateQuote.rate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INSTAGRAM DM VS DIRECT WEBSITE COMPARISON */}
          {activeTab === 'dm-vs-webapp' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="font-serif text-xl font-bold text-white mb-4">
                  Instagram DM Bottlenecks vs. The Oxygen Orbis Direct WebApp
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Instagram DMs Column */}
                  <div className="p-5 rounded-2xl bg-[#111B24] border border-rose-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>Current Instagram DMs Only</span>
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span><strong>Lost Late-Night Bookings:</strong> Travelers browsing at 11:00 PM drop off when nobody replies to their DM immediately.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span><strong>Repetitive Staff Work:</strong> Front desk staff spend hours typing room rates, sending pictures, and answering "do you have light?".</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span><strong>Manual Payment Verification:</strong> Guests sending screenshots of transfers; manual reconciliation leads to errors and double bookings.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">✗</span>
                        <span><strong>No Customer Database:</strong> Instagram followers belong to Meta. If an account is suspended or shadowbanned, direct guest access is lost.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Direct WebApp Solution Column */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111B24] to-[#122B22] border border-emerald-500/50 space-y-3 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Zap className="w-4 h-4" />
                      <span>With This Direct WebApp</span>
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>24/7 Automated Bookings:</strong> Guests can book and pay in under 60 seconds at any time of day or night.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Automated Add-on Upsells:</strong> Automatically sells Moniya train pickups, rooftop dinners, and champagne without staff pitching.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Instant WhatsApp Confirmation:</strong> Front desk and guest both receive instant, organized WhatsApp receipts with QR check-in codes.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Owned Guest Data:</strong> Collect guest phone numbers & emails for automated repeat staycation campaigns (Valentine, Easter, Detty December).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Strategic Advantages */}
              <div className="bg-[#111B24] border border-[#243546] rounded-2xl p-6">
                <h4 className="font-serif text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C5A880]" />
                  <span>Tailored Strategic Advantages for Oxygen Orbis:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-3 bg-[#0A1118] rounded-xl border border-[#243546]">
                    <strong className="text-white block mb-1">🚆 Moniya Train Marketing:</strong>
                    Capitalizes on Lagosians arriving at the Moniya terminal looking for nearby luxury escapes.
                  </div>
                  <div className="p-3 bg-[#0A1118] rounded-xl border border-[#243546]">
                    <strong className="text-white block mb-1">🍸 Nightlife & Event Ticketing:</strong>
                    Ready to support table reservations and tickets for Mac Foster Nightclub and Rooftop Lounge.
                  </div>
                  <div className="p-3 bg-[#0A1118] rounded-xl border border-[#243546]">
                    <strong className="text-white block mb-1">💳 No-Cash Policy Friendly:</strong>
                    Integrates seamless card and bank transfer workflows to eliminate cash handling at the front desk.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-[#243546] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              Prototype connected with live database modeling, dynamic rate engines, and Paystack test mode.
            </p>
            <button
              onClick={onClose}
              className="gold-gradient-btn px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#C5A880]/20"
            >
              <span>Return to Interactive Prototype</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Calendar, Phone, Menu, X, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { RESORT_INFO } from '../data/resortData';

const InstagramIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function Navbar({ 
  currency, 
  setCurrency, 
  onOpenBooking, 
  onOpenPitch, 
  onOpenCalendar, 
  onOpenPms,
  visible = true,
  onMouseEnter,
  onMouseLeave
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out ${
        visible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Ultra-Refined Micro Announcement Ribbon */}
      <div className="bg-[#0C0400]/95 border-b border-[#C9854A]/[0.15] text-[10.5px] py-1.5 px-4 sm:px-8 text-[#C9A070] hidden md:flex items-center justify-between tracking-[0.18em] uppercase font-light">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#C9854A] flex items-center gap-1.5 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9854A] inline-block animate-pulse" />
              Direct Reservation Privilege
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">
              Complimentary Moniya Train Terminal Chauffeur
            </span>
          </div>

          <div className="flex items-center gap-6 text-[#C9A070]">
            <a 
              href={RESORT_INFO.instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[#C9854A] transition-colors flex items-center gap-1.5"
            >
              <InstagramIcon className="w-3 h-3 text-[#C9854A]" />
              <span>{RESORT_INFO.instagram}</span>
            </a>
            <span className="text-zinc-600">•</span>
            <a 
              href={`tel:${RESORT_INFO.phone}`} 
              className="hover:text-[#C9854A] transition-colors flex items-center gap-1.5 text-[#E0C8A8]"
            >
              <Phone className="w-2.5 h-2.5 text-[#C9854A]" />
              <span>{RESORT_INFO.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Luxury Navigation Bar */}
      <nav className="bg-[#120601]/90 backdrop-blur-xl border-b border-[#C9854A]/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-full border border-[#C9854A]/40 bg-gradient-to-br from-[#C9854A]/15 via-transparent to-transparent flex items-center justify-center shadow-[0_0_20px_rgba(201,133,74,0.12)] group-hover:border-[#C9854A] transition-all duration-300">
              <span className="font-serif text-lg font-light text-[#E0A86A] tracking-wider">O</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-[17px] tracking-[0.24em] text-white font-normal group-hover:text-[#E0A86A] transition-colors leading-tight">
                OXYGEN ORBIS
              </span>
              <span className="text-[8.5px] tracking-[0.36em] text-[#C9854A]/85 uppercase font-light mt-0.5">
                Hotel & Resort • Moniya
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7 text-[12px] uppercase tracking-[0.18em] font-medium text-[#E0C8A8]">
            <a 
              href="#rooms" 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              Suites
            </a>
            <a 
              href="#experiences" 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              Experiences
            </a>
            <a 
              href="#lagos-escape" 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 flex items-center gap-2 group after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              <span>Lagos Escape</span>
              <span className="text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded bg-[#C9854A]/15 text-[#C9854A] border border-[#C9854A]/30 uppercase">
                Train
              </span>
            </a>
            <a 
              href="#location" 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              Location
            </a>
            <button 
              onClick={onOpenCalendar} 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 flex items-center gap-1.5 cursor-pointer text-[#E0C8A8] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              <Calendar className="w-3.5 h-3.5 text-[#C9854A]" />
              <span>Calendar</span>
            </button>
            <a 
              href="#faqs" 
              className="hover:text-[#C9854A] transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#C9854A] hover:after:w-full after:transition-all after:duration-300"
            >
              FAQs
            </a>
          </div>

          {/* Actions & CTA Cluster */}
          <div className="hidden md:flex items-center space-x-3.5">
            {/* Currency Switcher */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-full p-0.5 flex items-center text-[11px] font-medium">
              <button
                onClick={() => setCurrency('NGN')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  currency === 'NGN'
                    ? 'bg-[#C9854A] text-[#1A0C06] font-bold shadow-sm'
                    : 'text-[#C9A070] hover:text-white'
                }`}
              >
                ₦ NGN
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#C9854A] text-[#1A0C06] font-bold shadow-sm'
                    : 'text-[#C9A070] hover:text-white'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Staff PMS Button - Sleek Dark Glass */}
            <button
              onClick={onOpenPms}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wider text-[#E0C8A8] bg-white/[0.03] border border-white/[0.1] hover:border-[#C9854A]/50 hover:text-[#E0A86A] transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
              title="Open Front Desk Property Management System (PMS)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9854A]" />
              <span>Staff PMS</span>
            </button>

            {/* Pitch Deck Button - Refined Emerald Glass */}
            <button
              onClick={onOpenPitch}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wider text-emerald-300/90 bg-emerald-500/[0.07] border border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/[0.14] hover:text-emerald-200 transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
              title="Management ROI & Direct Booking Deck"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pitch Deck</span>
            </button>

            {/* Primary Luxury CTA: Book A Stay */}
            <button
              onClick={() => onOpenBooking()}
              className="px-5 py-2 rounded-full text-[11.5px] uppercase tracking-[0.18em] font-bold text-[#1A0C06] bg-gradient-to-r from-[#D4AF37] via-[#C9854A] to-[#B06A2E] hover:from-[#E0A86A] hover:to-[#C9854A] shadow-[0_4px_16px_rgba(201,133,74,0.25)] hover:shadow-[0_6px_22px_rgba(201,133,74,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 cursor-pointer ml-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book A Stay</span>
            </button>
          </div>

          {/* Mobile Menu Trigger & Quick Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenPms}
              className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-white/[0.04] text-[#C9854A] border border-[#C9854A]/30 font-medium"
            >
              PMS
            </button>
            <button
              onClick={onOpenPitch}
              className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/30 font-medium"
            >
              Pitch
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-[#E0C8A8] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#120601]/98 backdrop-blur-2xl border-b border-white/[0.08] px-6 py-6 space-y-5 animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#C9854A]/[0.15]">
            <span className="text-xs uppercase tracking-widest text-[#C9A070]">Currency</span>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-full p-0.5 flex items-center text-xs">
              <button
                onClick={() => setCurrency('NGN')}
                className={`px-3 py-1 rounded-full ${
                  currency === 'NGN' ? 'bg-[#C9854A] text-black font-bold' : 'text-[#C9A070]'
                }`}
              >
                ₦ NGN
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-full ${
                  currency === 'USD' ? 'bg-[#C9854A] text-black font-bold' : 'text-[#C9A070]'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-3.5 text-sm uppercase tracking-[0.16em] font-medium text-zinc-200">
            <a 
              href="#rooms" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#C9854A] py-1 transition-colors"
            >
              Suites & Villas
            </a>
            <a 
              href="#experiences" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#C9854A] py-1 transition-colors"
            >
              Experiences & Dining
            </a>
            <a 
              href="#lagos-escape" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#C9854A] py-1 flex items-center justify-between"
            >
              <span>Lagos Escape</span>
              <span className="text-[9px] bg-[#C9854A]/15 text-[#C9854A] px-2 py-0.5 rounded border border-[#C9854A]/30 tracking-widest">
                2HR TRAIN
              </span>
            </a>
            <a 
              href="#location" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#C9854A] py-1 transition-colors"
            >
              Location & Arrival
            </a>
            <a 
              href="#faqs" 
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#C9854A] py-1 transition-colors"
            >
              Guest FAQs
            </a>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCalendar();
              }}
              className="text-left hover:text-[#C9854A] py-1 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#C9854A]" />
              <span>Rate Calendar</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#C9854A]/[0.15] space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-full font-bold uppercase tracking-[0.18em] text-xs text-[#1A0C06] bg-gradient-to-r from-[#D4AF37] via-[#C9854A] to-[#B06A2E] flex items-center justify-center gap-2 shadow-lg shadow-[#C9854A]/20"
            >
              <Calendar className="w-4 h-4" /> Book A Stay
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPms();
                }}
                className="py-2.5 rounded-full text-[10.5px] uppercase tracking-wider font-semibold bg-white/[0.03] text-[#C9854A] border border-white/[0.08] flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Staff PMS
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPitch();
                }}
                className="py-2.5 rounded-full text-[10.5px] uppercase tracking-wider font-semibold bg-emerald-500/[0.07] text-emerald-300 border border-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Pitch Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

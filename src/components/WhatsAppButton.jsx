import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles, Send, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RESORT_INFO } from '../data/resortData';

export default function WhatsAppButton() {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Smooth entrance delay: let guest appreciate the hero first, then pop up gently
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setTooltipOpen(true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [isDismissed]);

  const handleOpenWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello Oxygen Orbis Hotel & Resort! I am interested in booking a staycation in Moniya, Ibadan. Please share available dates and rates.`
    );
    window.open(`https://wa.me/${RESORT_INFO.whatsapp}?text=${msg}`, '_blank');
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setTooltipOpen(false);
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto select-none">
      {/* Quick Assistance Luxury Popup Bubble */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="mb-2.5 max-w-[250px] sm:max-w-[280px] bg-[#1A0C06]/95 backdrop-blur-2xl border border-[#C9854A]/40 rounded-2xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-slate-200 relative overflow-hidden"
          >
            {/* Subtle ambient light sweep */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#C9854A]/15 rounded-full blur-xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Close assistance popup"
              className="absolute top-2 right-2 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header with live online dot */}
            <div className="flex items-center gap-2 mb-1.5 pr-4">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-[#E5C99F] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C9854A]" />
                Reservations Concierge
              </span>
            </div>

            {/* Content text */}
            <p className="text-[11.5px] text-[#E0C8A8] leading-snug mb-2.5 font-light">
              Planning a staycation? Chat directly with front desk for VIP rates & train pickup.
            </p>

            {/* Quick Action Button */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={handleOpenWhatsApp}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 400, damping: 25 }
        }}
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(16,185,129,0.35)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer relative group"
        title="Chat on WhatsApp (+234 903 398 7126)"
      >
        {/* Ambient pulse ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping pointer-events-none opacity-60" />

        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current group-hover:rotate-12 transition-transform duration-300 relative z-10" />

        {/* Small tooltip indicator toggle if popup was dismissed */}
        {isDismissed && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C9854A] border-2 border-[#1A0C06] flex items-center justify-center text-[8px] font-bold text-black">
            ✦
          </span>
        )}
      </motion.button>
    </div>
  );
}

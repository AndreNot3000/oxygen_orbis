import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { FAQS_DATA } from '../data/resortData';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-24 bg-[#1A0C06] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Help & Details</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-[#C9A070] text-xs sm:text-sm font-light">
            Everything you need to know about planning your stay at Oxygen Orbis.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {FAQS_DATA.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#2A1208] border-[#C9854A]/60 shadow-lg shadow-[#C9854A]/5'
                    : 'bg-[#2A1208]/60 border-[#4A2010] hover:border-[#C9854A]/40'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-white">
                    {faq.q}
                  </span>
                  <div className={`p-1.5 rounded-full shrink-0 transition-transform ${
                    isOpen ? 'bg-[#C9854A] text-black rotate-180' : 'bg-[#321610] text-[#C9A070]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#E0C8A8] font-light leading-relaxed border-t border-[#4A2010]/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Compass, Car, Trees, Sparkles, ArrowRight, Music, ShieldCheck } from 'lucide-react';

export default function LagosEscapeSection({ onOpenBooking }) {
  const highlights = [
    {
      step: '01',
      tag: 'Effortless Transit',
      title: 'Escape the Lagos Rush',
      desc: 'Skip the 4-hour expressway traffic via the comfortable Lagos-to-Ibadan train or a relaxed road trip into peaceful Akinyele.',
      icon: Compass,
    },
    {
      step: '02',
      tag: '10-15 Min Chauffeur',
      title: 'Moniya Station VIP Transfer',
      desc: 'Step off at Moniya Station and let our private chauffeur escort you directly to 11 Aare Onibon Road in just 10-15 minutes.',
      icon: Car,
    },
    {
      step: '03',
      tag: 'Serene Sanctuary',
      title: 'Fresh Air & IITA Proximity',
      desc: 'Breathe clean, crisp air nestled beside the lush IITA Forest Reserve—a tranquil green buffer from the noisy city center.',
      icon: Trees,
    },
    {
      step: '04',
      tag: 'Vibrant Lifestyle',
      title: 'Pool, Sky Lounge & Nightclub',
      desc: 'Dip into the sparkling pool, sip sunset cocktails on the Sky Rooftop, and party into the night at Mac Foster Club.',
      icon: Music,
    },
  ];

  return (
    <section id="lagos-escape" className="py-24 bg-[#1A0C06] relative overflow-hidden scroll-mt-24">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3D1C0A]/30 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/40 text-xs text-[#E0A86A] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C9854A]" />
            <span className="font-semibold uppercase tracking-wider">The Ultimate Ibadan Staycation Retreat</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Escape the City Rush. Immerse in Pure Serenity.
          </h2>
          <p className="text-[#E0C8A8] text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
            Nestled at <strong className="text-white font-medium">11 Aare Onibon Road in Moniya</strong>, Oxygen Orbis is a tranquil haven moments from the lush IITA Forest Reserve and just a 10-15 minute private chauffeur drive from Moniya Train Station. Trade the noise and gridlock for sparkling pools, rooftop mixology, and vibrant nightlife.
          </p>
        </div>

        {/* 4-Card Experience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {highlights.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#2A1208] border border-[#4A2010] rounded-3xl p-6 relative group hover:border-[#C9854A]/50 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl font-bold text-[#C9854A]/60 group-hover:text-[#C9854A] transition">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-semibold text-[#E0A86A] bg-[#321610] px-2.5 py-0.5 rounded-full border border-[#C9854A]/30">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#C9A070] leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#4A2010]/60 flex items-center gap-2 text-[11px] text-[#C9854A]">
                  <IconComponent className="w-3.5 h-3.5 text-[#C9854A]" />
                  <span>Curated resort experience</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner */}
        <div className="bg-gradient-to-r from-[#2A1208] via-[#361810] to-[#2A1208] border border-[#C9854A]/40 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-[#C9854A] font-bold block mb-1">
              Complimentary VIP Chauffeur Service
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
              Book Direct & Receive Moniya VIP Station Transfer
            </h3>
            <p className="text-xs sm:text-sm text-[#E0C8A8] font-light leading-relaxed">
              Reserve your stay directly with Oxygen Orbis to receive complimentary private chauffeur pickup from Moniya Station straight to 11 Aare Onibon Road. Seamless, private, and stress-free.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="gold-gradient-btn px-6 py-3 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#C9854A]/20 cursor-pointer"
            >
              <span>Plan Your Weekend Escape</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

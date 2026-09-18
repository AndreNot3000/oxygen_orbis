import React from 'react';
import { Train, Clock, ShieldCheck, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function LagosEscapeSection({ onOpenBooking }) {
  const steps = [
    {
      step: '01',
      time: 'Friday 4:00 PM',
      title: 'Board at Ebute Metta (Lagos)',
      desc: 'Hop onto the comfortable, air-conditioned train at Mobolaji Johnson Station. Say goodbye to Lagos traffic jams.',
    },
    {
      step: '02',
      time: '2 Hours Later',
      title: 'Scenic, Smooth Train Ride',
      desc: 'Enjoy reading, working on your laptop with steady signal, or resting through the scenic Nigerian landscape.',
    },
    {
      step: '03',
      time: '6:30 PM (Moniya Terminal)',
      title: '6-Minute VIP Shuttle to Resort',
      desc: 'Step off at Moniya Station where our private chauffeur meets you. Arrive at Oxygen Orbis in just 6 minutes.',
    },
    {
      step: '04',
      time: 'Weekend Retreat Begins',
      title: 'Sunset Cocktails & Poolside Bliss',
      desc: 'Check into your suite, dip in the pool, and enjoy the Rooftop Lounge and Mac Foster Nightclub all weekend.',
    },
  ];

  return (
    <section id="lagos-escape" className="py-24 bg-[#1A0C06] relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3D1C0A]/30 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/40 text-xs text-[#E0A86A] mb-3">
            <Train className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">The Ultimate Lagos Weekend Escape</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Zero Traffic. Just 2 Hours by Train.
          </h2>
          <p className="text-[#E0C8A8] text-sm sm:text-base font-light">
            Skip the 4-hour Lagos-Ibadan expressway gridlock. Oxygen Orbis is located directly adjacent to the <strong className="text-white">Moniya Railway Terminal</strong>, making us the premier destination for Lagos staycationers.
          </p>
        </div>

        {/* 4-Step Timeline Journey */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#2A1208] border border-[#4A2010] rounded-3xl p-6 relative group hover:border-[#C9854A]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-3xl font-bold text-[#C9854A]/60 group-hover:text-[#C9854A] transition">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-semibold text-[#E0A86A] bg-[#321610] px-2.5 py-0.5 rounded-full border border-[#C9854A]/30">
                    {item.time}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-[#C9A070] leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#4A2010]/60 flex items-center gap-1.5 text-[11px] text-[#C9854A]">
                <Sparkles className="w-3 h-3" />
                <span>Stress-free experience</span>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Banner */}
        <div className="bg-gradient-to-r from-[#2A1208] via-[#361810] to-[#2A1208] border border-[#C9854A]/40 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-[#C9854A] font-bold block mb-1">
              Complimentary Train Station Pickup
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
              Book Direct & Get Moniya Station VIP Transfer
            </h3>
            <p className="text-xs sm:text-sm text-[#E0C8A8] font-light leading-relaxed">
              Book any Executive Room or Suite directly on this website, and our private air-conditioned vehicle will be waiting at Moniya station to escort you directly to your suite.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="gold-gradient-btn px-6 py-3 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#C9854A]/20"
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

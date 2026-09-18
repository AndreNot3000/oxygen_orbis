import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';
import { TESTIMONIALS_DATA } from '../data/resortData';

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#1A0C06] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Guest Stories</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Loved By Staycationers & Travelers
          </h2>
          <p className="text-[#C9A070] text-xs sm:text-sm font-light">
            Real feedback from weekend visitors, couples, and celebration parties at Oxygen Orbis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS_DATA.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#2A1208] border border-[#4A2010] rounded-3xl p-6 relative flex flex-col justify-between hover:border-[#C9854A]/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-300">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-300" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#C9854A] bg-[#321610] px-2.5 py-1 rounded-full font-medium">
                    {t.room}
                  </span>
                </div>

                <p className="text-[#E0C8A8] text-xs sm:text-sm font-light leading-relaxed italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#4A2010]/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#C9854A]/20 border border-[#C9854A]/50 flex items-center justify-center text-[#C9854A] font-serif font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <p className="text-[11px] text-[#C9A070]">{t.origin}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { Sparkles, GlassWater, Moon, Utensils, Dumbbell, PartyPopper, CheckCircle } from 'lucide-react';
import { RESORT_EXPERIENCES } from '../data/resortData';

export default function AmenitiesSection({ onOpenBooking }) {
  const [activeTab, setActiveTab] = useState(0);

  const icons = [
    <GlassWater className="w-4 h-4" />,
    <Moon className="w-4 h-4" />,
    <PartyPopper className="w-4 h-4" />,
    <Utensils className="w-4 h-4" />,
    <Dumbbell className="w-4 h-4" />,
    <Sparkles className="w-4 h-4" />,
  ];

  return (
    <section id="experiences" className="py-24 bg-[#1A0C06] border-y border-[#4A2010]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Unmatched Experiences</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Where Tranquility Meets Electric Nightlife
          </h2>
          <p className="text-[#C9A070] text-sm sm:text-base font-light">
            You never have to leave the resort grounds. Savor poolside serenity by day, sunset cocktails on the rooftop at dusk, and VIP nightlife at Mac Foster Lounge by night.
          </p>
        </div>

        {/* Tab Selection on Mobile/Desktop */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {RESORT_EXPERIENCES.map((exp, idx) => (
            <button
              key={exp.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === idx
                  ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/20 scale-105'
                  : 'bg-[#2A1208] text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
              }`}
            >
              {icons[idx]}
              <span>{exp.title.split('&')[0]}</span>
            </button>
          ))}
        </div>

        {/* Featured Experience Spotlight */}
        <div className="bg-[#2A1208] border border-[#4A2010] rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 mb-12">
          {/* Visual Showcase */}
          <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] overflow-hidden">
            <img
              src={RESORT_EXPERIENCES[activeTab].image}
              alt={RESORT_EXPERIENCES[activeTab].title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A1208] via-transparent to-black/30" />
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A0C06]/80 text-[#C9854A] border border-[#C9854A]/30 backdrop-blur-md">
              {RESORT_EXPERIENCES[activeTab].tag}
            </span>
            <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-medium bg-black/60 text-slate-200 backdrop-blur-md">
              {RESORT_EXPERIENCES[activeTab].badge}
            </span>
          </div>

          {/* Narrative / Content */}
          <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between bg-[#2A1208]">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#C9854A] font-semibold block mb-2">
                Resort Spotlight
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                {RESORT_EXPERIENCES[activeTab].title}
              </h3>
              <p className="text-[#E0C8A8] text-sm leading-relaxed mb-6 font-light">
                {RESORT_EXPERIENCES[activeTab].description}
              </p>

              <div className="space-y-2.5 text-xs text-[#E0C8A8] mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C9854A]" />
                  <span>Exclusive access and priority reservations for in-house resort guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C9854A]" />
                  <span>Full table service with signature cocktail menu and finger foods</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C9854A]" />
                  <span>Private VIP section reservations available for celebrations</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#4A2010] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <a
                href="#rooms"
                onClick={(e) => {
                  if (onOpenBooking) {
                    e.preventDefault();
                    onOpenBooking();
                  }
                }}
                className="gold-gradient-btn px-6 py-3 rounded-xl text-xs font-bold w-full sm:w-auto inline-flex items-center justify-center gap-1.5 shadow-lg shadow-[#C9854A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                <span>Book Stay To Experience</span>
              </a>
              <span className="text-[11px] text-[#C9A070] text-center sm:text-right font-light">
                Open to guests &amp; visitors
              </span>
            </div>
          </div>
        </div>

        {/* 3-Card Grid of Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#2A1208] border border-[#4A2010] rounded-2xl p-6 hover:border-[#C9854A]/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#C9854A] mb-4">
              <Moon className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white mb-2">Oxygen Rooftop Sky Lounge</h4>
            <p className="text-xs text-[#C9A070] leading-relaxed">
              Unwind with panoramic sunset views over Moniya, signature infused cocktails, gourmet platters, and relaxing shisha under the Ibadan stars.
            </p>
          </div>

          <div className="bg-[#2A1208] border border-[#4A2010] rounded-2xl p-6 hover:border-[#C9854A]/40 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <PartyPopper className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white mb-2">Mac Foster Nightclub &amp; Karaoke</h4>
            <p className="text-xs text-[#C9A070] leading-relaxed">
              Ibadan's high-energy nightlife destination right on the resort premises. VIP bottle service booths, live DJs, and weekend private karaoke rooms.
            </p>
          </div>

          <div className="bg-[#2A1208] border border-[#4A2010] rounded-2xl p-6 hover:border-[#C9854A]/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <GlassWater className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white mb-2">Sparkling Pool &amp; Sun Loungers</h4>
            <p className="text-xs text-[#C9A070] leading-relaxed">
              Swim in pristine, temperature-balanced water or relax with a book in our shaded poolside cabanas while sipping fresh fruit smoothies and cocktails.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

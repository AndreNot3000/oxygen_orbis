import React from 'react';
import { 
  Sparkles, Car, UtensilsCrossed, Wine, Clock, 
  Check, ArrowRight, ShieldCheck, Plus, CheckCircle2 
} from 'lucide-react';
import { ADDONS_DATA } from '../data/resortData.js';

export default function AddonsSection({ currency = 'NGN', onBookWithAddon }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Car': return <Car className="w-5 h-5 text-[#C9854A]" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-5 h-5 text-[#C9854A]" />;
      case 'Wine': return <Wine className="w-5 h-5 text-[#C9854A]" />;
      case 'Clock': return <Clock className="w-5 h-5 text-[#C9854A]" />;
      default: return <Sparkles className="w-5 h-5 text-[#C9854A]" />;
    }
  };

  const formatPrice = (addon) => {
    if (currency === 'USD') {
      return `$${addon.priceUSD}`;
    }
    return `₦${addon.priceNGN.toLocaleString()}`;
  };

  return (
    <section id="enhancements" className="py-24 bg-[#1A0C06] relative border-t border-[#4A2010]/60">
      {/* Glow Effect */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#C9854A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Stay Enhancements</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Curate Your Bespoke Experience
          </h2>
          <p className="text-[#C9A070] text-sm sm:text-base font-light">
            Every staycation at Oxygen Orbis can be customized with private transport, romantic rooftop dining, chilled champagne, and rejuvenating wellness therapies.
          </p>
        </div>

        {/* 5-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADDONS_DATA.map((addon) => (
            <div
              key={addon.id}
              className="bg-[#2A1208] border border-[#4A2010] rounded-3xl p-6 flex flex-col justify-between hover:border-[#C9854A]/50 transition-all duration-300 group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#321610] border border-[#4A2010] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getIcon(addon.icon)}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#1A0C06] text-[#C9854A] border border-[#4A2010]">
                    {addon.category}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-white mb-2 group-hover:text-[#C9854A] transition">
                  {addon.name}
                </h3>
                <p className="text-xs text-[#C9A070] font-light leading-relaxed mb-6">
                  {addon.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#4A2010] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#A07850] uppercase block">Experience Rate</span>
                  <span className="font-serif text-xl font-bold text-white">
                    {formatPrice(addon)}
                  </span>
                </div>

                <button
                  onClick={() => onBookWithAddon(addon.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#321610] hover:bg-[#C9854A] text-slate-200 hover:text-black transition flex items-center gap-1.5 border border-[#4A2010] hover:border-[#C9854A]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Stay</span>
                </button>
              </div>
            </div>
          ))}

          {/* VIP Concierge Special Card */}
          <div className="bg-gradient-to-br from-[#321610] to-[#2A1208] border-2 border-[#C9854A]/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#C9854A]/20 border border-[#C9854A]/40 flex items-center justify-center text-[#C9854A]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#2A1208] text-[#E0A86A] border border-[#C9854A]/40">
                  VIP Bundle
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-white mb-2">
                Custom Staycation Concierge
              </h3>
              <p className="text-xs text-[#E0C8A8] font-light leading-relaxed mb-6">
                Planning a milestone birthday, marriage proposal, or private corporate retreat? Our dedicated guest experience manager will arrange every detail.
              </p>
            </div>

            <div className="pt-4 border-t border-[#4A2010]/60 flex items-center justify-between">
              <span className="text-xs text-[#E0A86A] font-medium">
                Personalized Itinerary
              </span>
              <a
                href="https://wa.me/2349033987126?text=Hello%20Oxygen%20Orbis,%20I%20would%20like%20to%20inquire%20about%20a%20custom%20VIP%20staycation%20package."
                target="_blank"
                rel="noopener noreferrer"
                className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>WhatsApp Concierge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { MapPin, Navigation, Train, Car, Compass, ExternalLink, Phone, Clock } from 'lucide-react';
import { RESORT_INFO } from '../data/resortData';

export default function LocationSection() {
  return (
    <section id="location" className="py-24 bg-[#1A0C06] border-t border-[#4A2010]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Address & Landmarks */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase tracking-wider">Prime Moniya Location</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
                Conveniently Situated in Moniya, Ibadan
              </h2>
              <p className="text-[#E0C8A8] text-sm font-light leading-relaxed">
                Enjoy serene resort tranquility away from city congestion, while remaining within effortless reach of transportation hubs and eco-attractions.
              </p>
            </div>

            {/* Address Card */}
            <div className="p-5 rounded-2xl bg-[#2A1208] border border-[#4A2010] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-[#C9854A]/20 border border-[#C9854A]/40 text-[#C9854A] shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#C9854A] font-bold block">
                  Resort Address
                </span>
                <p className="text-white text-sm font-medium mt-0.5">{RESORT_INFO.address}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#C9A070]">
                  <span className="flex items-center gap-1 text-[#C9854A]">
                    <Clock className="w-3.5 h-3.5" /> 24/7 Front Desk Reception
                  </span>
                  <a 
                    href={`tel:${RESORT_INFO.phone}`} 
                    className="flex items-center gap-1 text-[#E0C8A8] hover:text-[#C9854A] transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C9854A]" /> {RESORT_INFO.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Landmarks List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E0C8A8]">
                Proximity to Major Landmarks:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#2A1208] border border-[#4A2010] flex items-center gap-3">
                  <Train className="w-4 h-4 text-[#C9854A] shrink-0" />
                  <div>
                    <span className="text-white font-semibold block">Moniya Railway Station</span>
                    <span className="text-[#C9A070] text-[11px]">10-15 minutes driving distance</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#2A1208] border border-[#4A2010] flex items-center gap-3">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-white font-semibold block">IITA Forest Reserve</span>
                    <span className="text-[#C9A070] text-[11px]">12 minutes (7.5 km)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#2A1208] border border-[#4A2010] flex items-center gap-3">
                  <Car className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-white font-semibold block">University of Ibadan (UI)</span>
                    <span className="text-[#C9A070] text-[11px]">18 minutes via Ojoo</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#2A1208] border border-[#4A2010] flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-white font-semibold block">Secure Private Parking</span>
                    <span className="text-[#C9A070] text-[11px]">Free valet & CCTV parking</span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Oxygen+Orbis+Hotel+Moniya+Ibadan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9854A] hover:text-[#D4AF37] transition underline underline-offset-4"
            >
              <span>Open in Google Maps for Navigation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right Column: Stylized Map Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#2A1208] border border-[#4A2010] rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden group">
              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#4A2010]">
                {/* Styled Map Graphic / Preview */}
                <div 
                  className="w-full h-full bg-cover bg-center filter saturate-75 brightness-90 group-hover:scale-105 transition-transform duration-700"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80')`,
                  }}
                >
                  <div className="absolute inset-0 bg-[#1A0C06]/50" />
                </div>

                {/* Map Pin Overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <div className="bg-[#2A1208]/95 border-2 border-[#C9854A] rounded-2xl p-4 shadow-2xl text-center max-w-xs backdrop-blur-md">
                    <div className="w-10 h-10 rounded-full bg-[#C9854A] text-black mx-auto flex items-center justify-center mb-2 shadow-md">
                      <MapPin className="w-5 h-5 fill-current" />
                    </div>
                    <h5 className="font-serif font-bold text-white text-sm">Oxygen Orbis Hotel & Resort</h5>
                    <p className="text-[11px] text-[#C9854A] mt-0.5">11 Aare Onibon Road, Moniya</p>
                    <p className="text-[10px] text-[#C9A070] mt-1">10-15 min drive from Moniya Train Station</p>
                  </div>
                </div>

                {/* Direct Directions Overlay Button */}
                <div className="absolute bottom-4 right-4 z-10">
                  <a
                    href="https://maps.google.com/?q=Oxygen+Orbis+Hotel+Moniya+Ibadan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

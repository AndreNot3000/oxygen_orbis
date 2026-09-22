import React, { useState } from 'react';
import { BedDouble, Users, Maximize2, Sparkles, Check, ArrowRight, Eye, Star, X } from 'lucide-react';
import { ROOMS_DATA } from '../data/resortData';

export default function RoomsSection({ currency, onBookRoom }) {
  const [filter, setFilter] = useState('all');
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const filteredRooms = ROOMS_DATA.filter((room) => {
    if (filter === 'all') return true;
    if (filter === 'rooms') return room.category === 'rooms';
    if (filter === 'cabins') return room.category === 'cabins';
    if (filter === 'diplomatic') return room.category === 'diplomatic' || room.category === 'suites';
    return true;
  });

  const formatPrice = (room) => {
    if (currency === 'USD') {
      return `$${room.priceUSD.toLocaleString()}`;
    }
    return `₦${room.priceNGN.toLocaleString()}`;
  };

  const formatNormalPrice = (room) => {
    if (currency === 'USD') {
      return `$${room.normalPriceUSD?.toLocaleString() || room.priceUSD.toLocaleString()}`;
    }
    return `₦${room.normalPriceNGN?.toLocaleString() || room.priceNGN.toLocaleString()}`;
  };

  const openDetails = (room) => {
    setSelectedRoomModal(room);
    setActivePhotoIdx(0);
  };

  return (
    <section id="rooms" className="py-24 bg-[#1A0C06] relative">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9854A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208] border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Stay In Pure Comfort</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Bespoke Rooms & Luxury Suites
          </h2>
          <p className="text-[#C9A070] text-sm sm:text-base font-light">
            Every room at Oxygen Orbis is thoughtfully crafted with plush bedding, uninterrupted 24/7 power, high-speed fiber Wi-Fi, and personalized hospitality.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-[#C9854A] text-black shadow-md shadow-[#C9854A]/20'
                  : 'bg-[#2A1208] text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
              }`}
            >
              All Accommodations (12)
            </button>
            <button
              onClick={() => setFilter('rooms')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === 'rooms'
                  ? 'bg-[#C9854A] text-black shadow-md shadow-[#C9854A]/20'
                  : 'bg-[#2A1208] text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
              }`}
            >
              Rooms & Plus
            </button>
            <button
              onClick={() => setFilter('cabins')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === 'cabins'
                  ? 'bg-[#C9854A] text-black shadow-md shadow-[#C9854A]/20'
                  : 'bg-[#2A1208] text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
              }`}
            >
              Chalet Cabins
            </button>
            <button
              onClick={() => setFilter('diplomatic')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === 'diplomatic'
                  ? 'bg-[#C9854A] text-black shadow-md shadow-[#C9854A]/20'
                  : 'bg-[#2A1208] text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
              }`}
            >
              Diplomatic & Suites
            </button>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-[#2A1208] border border-[#4A2010] rounded-3xl overflow-hidden shadow-xl hover:border-[#C9854A]/50 transition-all duration-300 flex flex-col group"
            >
              {/* Image Container with Badges */}
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1208] via-transparent to-black/30" />

                {/* Badge */}
                {room.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A0C06]/85 text-[#C9854A] border border-[#C9854A]/40 backdrop-blur-md">
                    {room.badge}
                  </span>
                )}

                {/* Rating */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{room.rating}</span>
                  <span className="text-[#C9A070] font-normal">({room.reviewsCount})</span>
                </div>

                {/* View Badge */}
                <div className="absolute bottom-3 left-4 text-xs text-[#E0C8A8] bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {room.view}
                </div>
              </div>

              {/* Room Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-serif text-2xl font-bold text-white group-hover:text-[#C9854A] transition">
                      {room.name}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#E0C8A8] line-clamp-2 mb-4 font-light leading-relaxed">
                    {room.description}
                  </p>

                  {/* Room Specs */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#4A2010] text-xs text-[#E0C8A8] mb-4">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-[#C9854A]" />
                      <span className="truncate">{room.bed}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#C9854A]" />
                      <span>Max {room.maxGuests} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-4 h-4 text-[#C9854A]" />
                      <span>{room.size}</span>
                    </div>
                  </div>

                  {/* Key Amenities Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {room.features.slice(0, 3).map((feat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] text-[#E0C8A8] bg-[#321610] px-2.5 py-1 rounded-full"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        {feat}
                      </span>
                    ))}
                    {room.features.length > 3 && (
                      <span className="text-[11px] text-[#C9854A] self-center px-1">
                        +{room.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Action CTA */}
                <div className="pt-4 border-t border-[#4A2010] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9854A] px-2 py-0.5 rounded bg-[#C9854A]/10 border border-[#C9854A]/20">
                        Promo Rate
                      </span>
                      {room.normalPriceNGN && room.normalPriceNGN > room.priceNGN && (
                        <span className="text-xs text-[#C9A070]/60 line-through">
                          {formatNormalPrice(room)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
                        {formatPrice(room)}
                      </span>
                      <span className="text-xs text-[#C9A070]">/ night</span>
                    </div>
                    <span className="text-[10.5px] text-emerald-400 flex items-center gap-1 font-medium mt-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Breakfast &amp; VAT Included
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDetails(room)}
                      className="px-3 py-2.5 rounded-xl border border-[#4A2010] hover:border-[#C9854A]/60 text-[#E0C8A8] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      title="View all photos and amenities"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Details</span>
                    </button>

                    <button
                      onClick={() => onBookRoom(room.id)}
                      className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-[#C9854A]/10"
                    >
                      <span>Reserve</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Details Modal */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#2A1208] border border-[#C9854A]/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRoomModal(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:text-[#C9854A] transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gallery Section */}
            <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-t-3xl">
              <img
                src={selectedRoomModal.gallery[activePhotoIdx] || selectedRoomModal.image}
                alt={selectedRoomModal.name}
                className="w-full h-full object-cover transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1208] via-transparent to-black/30" />

              {/* Thumbnail Selector */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
                {selectedRoomModal.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition ${
                      activePhotoIdx === idx ? 'border-[#C9854A] scale-105' : 'border-white/40 opacity-70'
                    }`}
                  >
                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C9854A]">
                    {selectedRoomModal.badge}
                  </span>
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-300">
                    <Star className="w-4 h-4 fill-amber-300" />
                    {selectedRoomModal.rating} ({selectedRoomModal.reviewsCount} guest reviews)
                  </div>
                </div>
                <h3 className="font-serif text-3xl font-bold text-white mb-2">
                  {selectedRoomModal.name}
                </h3>
                <p className="text-[#E0C8A8] text-sm leading-relaxed font-light">
                  {selectedRoomModal.description}
                </p>
              </div>

              {/* Room Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#321610] rounded-2xl text-xs text-[#E0C8A8]">
                <div>
                  <span className="text-[#C9A070] block text-[10px] uppercase">Bed Type</span>
                  <span className="font-semibold text-white">{selectedRoomModal.bed}</span>
                </div>
                <div>
                  <span className="text-[#C9A070] block text-[10px] uppercase">Capacity</span>
                  <span className="font-semibold text-white">Up to {selectedRoomModal.maxGuests} Guests</span>
                </div>
                <div>
                  <span className="text-[#C9A070] block text-[10px] uppercase">Room Size</span>
                  <span className="font-semibold text-white">{selectedRoomModal.size}</span>
                </div>
                <div>
                  <span className="text-[#C9A070] block text-[10px] uppercase">Balcony / View</span>
                  <span className="font-semibold text-white">{selectedRoomModal.view}</span>
                </div>
              </div>

              {/* Complete Amenities Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9854A] mb-3">
                  Included In-Room Amenities & Privileges
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
                  {selectedRoomModal.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="p-4 rounded-xl bg-[#1A0C06] border border-[#4A2010] text-xs text-[#C9A070] space-y-1">
                <p className="font-medium text-[#E0C8A8]">Official Resort Policies &amp; Inclusions:</p>
                <p>• Official Check-in: 2:00 PM | Check-out: 12:00 Noon (Late check-out attracts additional charges).</p>
                <p>• All rates inclusive of Complimentary Breakfast, VAT &amp; Service Charge (10%).</p>
                <p>• Guest limit: Not more than 2 persons are permitted to lodge per room.</p>
                <p>• Strictly non-smoking inside all rooms, chalets, and suites.</p>
                <p>• 24/7 Guaranteed power with seamless industrial generators.</p>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[#4A2010] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#C9854A] font-bold">Promo Rate</span>
                    {selectedRoomModal.normalPriceNGN && selectedRoomModal.normalPriceNGN > selectedRoomModal.priceNGN && (
                      <span className="text-xs text-[#C9A070]/60 line-through">
                        {formatNormalPrice(selectedRoomModal)}
                      </span>
                    )}
                  </div>
                  <div className="font-serif text-3xl font-bold text-white">
                    {formatPrice(selectedRoomModal)}
                    <span className="text-xs font-sans text-[#C9A070] font-normal"> / night</span>
                  </div>
                  <span className="text-[10.5px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" /> Complimentary Breakfast Included
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedRoomModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#4A2010] text-[#E0C8A8] text-xs font-medium hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const roomId = selectedRoomModal.id;
                      setSelectedRoomModal(null);
                      onBookRoom(roomId);
                    }}
                    className="gold-gradient-btn px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <span>Book This Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  BedDouble,
  Users,
  Maximize2,
  Sparkles,
  Check,
  ArrowRight,
  Eye,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
} from 'lucide-react';
import { ROOMS_DATA } from '../data/resortData';

export default function RoomsSection({ currency, onBookRoom }) {
  const [filter, setFilter] = useState('all');
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [cardDimensions, setCardDimensions] = useState({ width: 245, radius: 560 });

  // References for 3D cylinder manipulation without re-rendering every pointer frame
  const containerRef = useRef(null);
  const cylinderRef = useRef(null);
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animFrameRef = useRef(null);

  // Filtered rooms based on active category
  const filteredRooms = useMemo(() => {
    return ROOMS_DATA.filter((room) => {
      if (filter === 'all') return true;
      if (filter === 'rooms') return room.category === 'rooms';
      if (filter === 'cabins') return room.category === 'cabins';
      if (filter === 'diplomatic') return room.category === 'diplomatic' || room.category === 'suites';
      return true;
    });
  }, [filter]);

  // Cylinder items: Ensure at least 8-12 cards on the cylinder for a continuous 3D arc
  const displayItems = useMemo(() => {
    if (filteredRooms.length === 0) return [];
    if (filteredRooms.length >= 8) {
      return filteredRooms.map((room, idx) => ({ ...room, _uniqueKey: `${room.id}-${idx}` }));
    }
    const repeatCount = Math.ceil(8 / filteredRooms.length);
    const repeated = [];
    for (let r = 0; r < repeatCount; r++) {
      for (let i = 0; i < filteredRooms.length; i++) {
        const item = filteredRooms[i];
        repeated.push({
          ...item,
          _uniqueKey: `${item.id}-rep${r}-${i}`,
        });
      }
    }
    return repeated;
  }, [filteredRooms]);

  const numCards = displayItems.length;
  const angleStep = numCards > 0 ? 360 / numCards : 30;

  // Responsive card size and cylinder radius calculation
  useEffect(() => {
    const updateDimensions = () => {
      const vw = window.innerWidth;
      if (vw < 640) {
        // Mobile
        const width = 160;
        const radius = Math.max(280, Math.round((width / 2) / Math.sin(Math.PI / Math.max(numCards, 8)) * 0.95));
        setCardDimensions({ width, radius: Math.min(radius, 360) });
      } else if (vw < 1024) {
        // Tablet
        const width = 210;
        const radius = Math.max(380, Math.round((width / 2) / Math.sin(Math.PI / Math.max(numCards, 8))));
        setCardDimensions({ width, radius: Math.min(radius, 500) });
      } else {
        // Desktop
        const width = 245;
        const radius = Math.max(480, Math.round((width / 2) / Math.sin(Math.PI / Math.max(numCards, 8)) * 1.05));
        setCardDimensions({ width, radius: Math.min(radius, 660) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [numCards]);

  // Apply rotation directly to DOM element for 60fps performance
  const applyRotation = useCallback((angle) => {
    rotationRef.current = angle;
    if (cylinderRef.current) {
      cylinderRef.current.style.transform = `rotateY(${angle}deg)`;
    }
  }, []);

  // Smooth rotation animation step
  const rotateTo = useCallback((targetAngle) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startAngle = rotationRef.current;
    const diff = targetAngle - startAngle;
    const startTime = performance.now();
    const duration = 450;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = startAngle + diff * easeOutCubic(progress);
      applyRotation(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [applyRotation]);

  // Navigate left / right by one slot
  const handleNext = useCallback(() => {
    rotateTo(rotationRef.current - angleStep);
  }, [angleStep, rotateTo]);

  const handlePrev = useCallback(() => {
    rotateTo(rotationRef.current + angleStep);
  }, [angleStep, rotateTo]);

  // Keyboard navigation (Left / Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedRoomModal) {
        if (e.key === 'Escape') setSelectedRoomModal(null);
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoomModal, handleNext, handlePrev]);

  // Lock body scroll when room details modal is open
  useEffect(() => {
    if (selectedRoomModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRoomModal]);

  // Reset rotation when filter changes
  useEffect(() => {
    applyRotation(0);
  }, [filter, applyRotation]);

  // Drag Interaction (Pointer Events with Velocity Momentum)
  const handlePointerDown = (e) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    hasMovedRef.current = false;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const currentX = e.clientX;
    const deltaX = currentX - lastXRef.current;
    const dt = Math.max(1, now - lastTimeRef.current);

    if (Math.abs(currentX - startXRef.current) > 6) {
      hasMovedRef.current = true;
    }

    // Drag multiplier (0.16 deg/px)
    const newAngle = rotationRef.current + deltaX * 0.16;
    applyRotation(newAngle);

    velocityRef.current = (deltaX / dt) * 16.6; // normalized velocity
    lastXRef.current = currentX;
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (hasMovedRef.current) {
      // Momentum decay physics
      let currentVelocity = velocityRef.current * 0.45;
      const friction = 0.93;

      const momentumStep = () => {
        if (Math.abs(currentVelocity) > 0.05) {
          applyRotation(rotationRef.current + currentVelocity);
          currentVelocity *= friction;
          animFrameRef.current = requestAnimationFrame(momentumStep);
        }
      };
      animFrameRef.current = requestAnimationFrame(momentumStep);
    }
  };

  const handleCardClick = (room) => {
    // If the pointer dragged, suppress click
    if (hasMovedRef.current) return;
    setSelectedRoomModal(room);
    setActivePhotoIdx(0);
  };

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

  return (
    <section
      id="rooms"
      className="relative min-h-[95vh] lg:min-h-screen w-full flex flex-col justify-between overflow-hidden select-none py-12 lg:py-16"
      style={{
        background: `
          radial-gradient(circle at 50% 18%, rgba(201, 133, 74, 0.18), transparent 48%),
          radial-gradient(circle at 12% 85%, rgba(184, 110, 46, 0.12), transparent 40%),
          linear-gradient(180deg, #1A0C06 0%, #120601 55%, #0C0400 100%)
        `,
      }}
    >
      {/* Subtle edge fade curtains for seamless 3D horizon fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-36 lg:w-48 bg-gradient-to-r from-[#120601] via-[#120601]/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-36 lg:w-48 bg-gradient-to-l from-[#120601] via-[#120601]/80 to-transparent z-20 pointer-events-none" />

      {/* Header Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208]/90 border border-[#C9854A]/30 text-xs text-[#C9854A] mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Stay In Pure Comfort</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight">
            Bespoke Rooms & Luxury Suites
          </h2>
          <p className="text-[#C9A070] text-xs sm:text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed">
            Every room at Oxygen Orbis is thoughtfully crafted with plush bedding, uninterrupted 24/7 power, high-speed fiber Wi-Fi, and personalized hospitality.
          </p>
        </div>

        {/* Filter Pills (Interactive) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pointer-events-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            All Accommodations (12)
          </button>
          <button
            onClick={() => setFilter('rooms')}
            className={`px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'rooms'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Rooms & Plus
          </button>
          <button
            onClick={() => setFilter('cabins')}
            className={`px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'cabins'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Chalet Cabins
          </button>
          <button
            onClick={() => setFilter('diplomatic')}
            className={`px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'diplomatic'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Diplomatic & Suites
          </button>
        </div>
      </div>

      {/* 3D Cylinder Orbit Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] my-auto cursor-grab active:cursor-grabbing flex items-center justify-center overflow-visible"
        style={{
          perspective: '950px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-y',
        }}
      >
        {/* Revolving Cylinder */}
        <div
          ref={cylinderRef}
          className="relative w-full h-full flex items-center justify-center will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateY(0deg)',
          }}
        >
          {displayItems.map((room, idx) => {
            const cardAngle = idx * angleStep;
            return (
              <div
                key={room._uniqueKey}
                onClick={() => handleCardClick(room)}
                className="group absolute rounded-2xl overflow-hidden shadow-2xl cursor-pointer border border-[#C9854A]/25 hover:border-[#C9854A] bg-[#2A1208] transition-all duration-300"
                style={{
                  width: `${cardDimensions.width}px`,
                  height: `${cardDimensions.width}px`,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotateY(${cardAngle}deg) translateZ(${cardDimensions.radius}px)`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* 1:1 Aspect Ratio Room Image */}
                <img
                  src={room.image}
                  alt={room.name}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                />

                {/* Ambient vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

                {/* Top Badge: Promo / Value */}
                {room.badge && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#1A0C06]/90 text-[#C9854A] border border-[#C9854A]/40 backdrop-blur-md pointer-events-none">
                    {room.badge.split('•')[0].trim()}
                  </span>
                )}

                {/* Top Rating */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10 pointer-events-none">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>{room.rating}</span>
                </div>

                {/* Bottom Room Meta */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-3.5 text-left pointer-events-none">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-white group-hover:text-[#C9854A] transition-colors truncate">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#E0C8A8] mt-0.5 truncate">
                    <span>{room.bed.split('(')[0].trim()}</span>
                    <span>•</span>
                    <span>Max {room.maxGuests} Guests</span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-white/10">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-sm sm:text-lg font-bold text-white">
                          {formatPrice(room)}
                        </span>
                        <span className="text-[10px] text-[#C9A070]">/night</span>
                      </div>
                      <div className="text-[9px] text-emerald-400 font-medium">
                        ✓ Breakfast &amp; VAT
                      </div>
                    </div>

                    <div className="px-2 py-1 rounded-lg bg-[#C9854A]/20 group-hover:bg-[#C9854A] text-[#C9854A] group-hover:text-black transition-colors text-[10px] font-bold flex items-center gap-0.5">
                      <span>View</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls & Interaction Guidance */}
      <div className="relative z-30 max-w-4xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Interaction Hint */}
        <div className="flex items-center gap-2 text-xs text-[#C9A070]/80">
          <MoveHorizontal className="w-4 h-4 text-[#C9854A] animate-pulse" />
          <span>Drag horizontally to rotate • Click card to view details</span>
        </div>

        {/* Carousel Navigation Chevrons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            aria-label="Previous room"
            className="w-10 h-10 rounded-full bg-[#2A1208]/90 border border-[#4A2010] hover:border-[#C9854A] text-[#E0C8A8] hover:text-white flex items-center justify-center transition-colors shadow-lg shadow-black/40 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-[11px] font-semibold text-[#E0C8A8] px-3 py-1 rounded-full bg-[#2A1208]/60 border border-[#4A2010]/80">
            {filteredRooms.length} Accommodations
          </div>
          <button
            onClick={handleNext}
            aria-label="Next room"
            className="w-10 h-10 rounded-full bg-[#2A1208]/90 border border-[#4A2010] hover:border-[#C9854A] text-[#E0C8A8] hover:text-white flex items-center justify-center transition-colors shadow-lg shadow-black/40 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Room Details Modal */}
      {selectedRoomModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRoomModal(null);
          }}
        >
          <div className="bg-[#2A1208] border border-[#C9854A]/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedRoomModal(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 text-white hover:text-[#C9854A] transition border border-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gallery Section */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-3xl">
              <img
                src={selectedRoomModal.gallery[activePhotoIdx] || selectedRoomModal.image}
                alt={selectedRoomModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1208] via-transparent to-black/30" />

              {/* Badge */}
              {selectedRoomModal.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A0C06]/90 text-[#C9854A] border border-[#C9854A]/40 backdrop-blur-md">
                  {selectedRoomModal.badge}
                </span>
              )}

              {/* View Description */}
              <div className="absolute bottom-3 left-4 text-xs text-[#E0C8A8] bg-black/60 px-3 py-1 rounded-md backdrop-blur-sm">
                {selectedRoomModal.view}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {selectedRoomModal.gallery && selectedRoomModal.gallery.length > 1 && (
              <div className="flex gap-2 p-3 bg-[#1A0C06] border-b border-[#4A2010] overflow-x-auto">
                {selectedRoomModal.gallery.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                      activePhotoIdx === i ? 'border-[#C9854A]' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Room Content */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                    {selectedRoomModal.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{selectedRoomModal.rating}</span>
                    </div>
                    <span className="text-[#C9A070] text-xs">
                      ({selectedRoomModal.reviewsCount} verified guest reviews)
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9854A] px-2 py-0.5 rounded bg-[#C9854A]/10 border border-[#C9854A]/20">
                      Promo Rate
                    </span>
                    {selectedRoomModal.normalPriceNGN && selectedRoomModal.normalPriceNGN > selectedRoomModal.priceNGN && (
                      <span className="text-xs text-[#C9A070]/60 line-through">
                        {formatNormalPrice(selectedRoomModal)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline sm:justify-end gap-1">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {formatPrice(selectedRoomModal)}
                    </span>
                    <span className="text-xs text-[#C9A070]">/ night</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#E0C8A8] font-light leading-relaxed mb-6">
                {selectedRoomModal.description}
              </p>

              {/* Room Specs */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#1A0C06] border border-[#4A2010] text-xs text-[#E0C8A8] mb-6">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#C9854A]" />
                  <span>{selectedRoomModal.bed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C9854A]" />
                  <span>Max {selectedRoomModal.maxGuests} Guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-[#C9854A]" />
                  <span>{selectedRoomModal.size}</span>
                </div>
              </div>

              {/* Official Inclusions Note */}
              <div className="p-3 mb-6 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Official Rate Inclusion:</strong> Complimentary Daily Breakfast, VAT &amp; Service Charge (10%) included in this rate.
                </span>
              </div>

              {/* All Amenities */}
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9854A] mb-3">
                  Room Features &amp; Inclusions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedRoomModal.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-[#E0C8A8] bg-[#321610] p-2.5 rounded-xl border border-[#4A2010]"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-4 border-t border-[#4A2010] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#C9A070] flex items-center gap-1.5">
                  <span>Official Policy: Check-in 2:00 PM • Check-out 12:00 Noon • Non-Smoking</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedRoomModal(null)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-[#4A2010] hover:border-[#C9854A]/60 text-[#E0C8A8] hover:text-white text-xs font-semibold transition"
                  >
                    Back to Gallery
                  </button>

                  <button
                    onClick={() => {
                      const id = selectedRoomModal.id;
                      setSelectedRoomModal(null);
                      onBookRoom(id);
                    }}
                    className="flex-1 sm:flex-none gold-gradient-btn px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#C9854A]/20"
                  >
                    <span>Reserve Room</span>
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

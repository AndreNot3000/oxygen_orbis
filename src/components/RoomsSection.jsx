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

// Default initial rotation (45°) centers Executive Suite and Senior Cabin side-by-side
// flanked by Junior Cabin on the left and Standard Room on the right, matching the reference image exactly
const DEFAULT_ROTATION = 45;

export default function RoomsSection({ currency, onBookRoom }) {
  const [filter, setFilter] = useState('all');
  const [selectedRoomModal, setSelectedRoomModal] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [cardDimensions, setCardDimensions] = useState({
    width: 290,
    height: 300,
    radius: 560,
    offsetZ: -160,
  });

  // References for high-performance 3D cylinder manipulation
  const cylinderRef = useRef(null);
  const rotationRef = useRef(DEFAULT_ROTATION);
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
      return filteredRooms.map((room, idx) => ({ ...room, _uniqueKey: `${room.id}-${idx}`, _origIdx: idx }));
    }
    const repeatCount = Math.ceil(8 / filteredRooms.length);
    const repeated = [];
    for (let r = 0; r < repeatCount; r++) {
      for (let i = 0; i < filteredRooms.length; i++) {
        const item = filteredRooms[i];
        repeated.push({
          ...item,
          _uniqueKey: `${item.id}-rep${r}-${i}`,
          _origIdx: i,
        });
      }
    }
    return repeated;
  }, [filteredRooms]);

  const numCards = displayItems.length;
  const angleStep = numCards > 0 ? 360 / numCards : 30;

  // Responsive card size and cylinder radius calculation with clean perspective depth
  useEffect(() => {
    const updateDimensions = () => {
      const vw = window.innerWidth;
      if (vw < 640) {
        // Mobile (compact, 2 center cards visible)
        setCardDimensions({
          width: 200,
          height: 220,
          radius: 380,
          offsetZ: -120,
        });
      } else if (vw < 1024) {
        // Tablet
        setCardDimensions({
          width: 250,
          height: 265,
          radius: 480,
          offsetZ: -140,
        });
      } else {
        // Desktop: Large, bold cards matching reference image
        setCardDimensions({
          width: 290,
          height: 300,
          radius: 560,
          offsetZ: -160,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [numCards]);

  // Direct GPU rotation update for 60-120fps smoothness
  const applyRotation = useCallback((angle) => {
    rotationRef.current = angle;
    if (cylinderRef.current) {
      cylinderRef.current.style.transform = `translateZ(${cardDimensions.offsetZ}px) rotateY(${angle}deg)`;
    }
  }, [cardDimensions.offsetZ]);

  // Smooth rotation animation step
  const rotateTo = useCallback((targetAngle) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const startAngle = rotationRef.current;
    const diff = targetAngle - startAngle;
    const startTime = performance.now();
    const duration = 400;

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

  // Reset or set default rotation on filter change or initial mount
  useEffect(() => {
    if (filter === 'all') {
      applyRotation(DEFAULT_ROTATION);
    } else {
      applyRotation(angleStep / 2);
    }
  }, [filter, angleStep, applyRotation]);

  // BULLETPROOF MOUSE & TOUCH SLIDING / DRAGGING INTERACTION
  const handlePointerDown = (e) => {
    // Only respond to main mouse button (left-click) or touch
    if (e.button !== undefined && e.button !== 0) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    hasMovedRef.current = false;

    // Attach listeners directly to window to track drag even if cursor leaves bounds
    const handleGlobalPointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      const currentX = moveEvt.clientX;
      const deltaX = currentX - lastXRef.current;
      const dt = Math.max(1, performance.now() - lastTimeRef.current);

      if (Math.abs(currentX - startXRef.current) > 4) {
        hasMovedRef.current = true;
      }

      // Smooth drag sensitivity: 0.20 deg per pixel
      const newAngle = rotationRef.current + deltaX * 0.20;
      applyRotation(newAngle);

      velocityRef.current = (deltaX / dt) * 16.6;
      lastXRef.current = currentX;
      lastTimeRef.current = performance.now();
    };

    const handleGlobalPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);

      if (hasMovedRef.current) {
        // Natural momentum release with smooth friction decay
        let v = velocityRef.current * 0.5;
        const friction = 0.94;

        const momentumStep = () => {
          if (Math.abs(v) > 0.04) {
            applyRotation(rotationRef.current + v);
            v *= friction;
            animFrameRef.current = requestAnimationFrame(momentumStep);
          }
        };
        animFrameRef.current = requestAnimationFrame(momentumStep);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  };

  // Wheel horizontal sliding support (trackpad & mouse wheel)
  const handleWheel = (e) => {
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (isHorizontal) {
      applyRotation(rotationRef.current - e.deltaX * 0.15);
    } else if (e.shiftKey) {
      e.preventDefault();
      applyRotation(rotationRef.current - e.deltaY * 0.15);
    }
  };

  const handleCardClick = (room, e) => {
    // Suppress card opening if the user dragged or slid
    if (hasMovedRef.current) {
      e?.preventDefault?.();
      return;
    }
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
      onWheel={handleWheel}
      className="relative min-h-[95vh] lg:min-h-screen w-full flex flex-col justify-between overflow-hidden select-none py-8 lg:py-12"
      style={{
        background: `
          radial-gradient(circle at 50% 18%, rgba(201, 133, 74, 0.18), transparent 48%),
          radial-gradient(circle at 12% 85%, rgba(184, 110, 46, 0.12), transparent 40%),
          linear-gradient(180deg, #1A0C06 0%, #120601 55%, #0C0400 100%)
        `,
      }}
    >
      {/* Subtle edge fade curtains for seamless 3D horizon fade */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 lg:w-44 bg-gradient-to-r from-[#120601] via-[#120601]/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 lg:w-44 bg-gradient-to-l from-[#120601] via-[#120601]/80 to-transparent z-20 pointer-events-none" />

      {/* Header Content */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 text-center shrink-0">
        <div className="pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1208]/90 border border-[#C9854A]/30 text-xs text-[#C9854A] mb-2.5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Stay In Pure Comfort</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2.5 tracking-tight">
            Bespoke Rooms & Luxury Suites
          </h2>
          <p className="text-[#C9A070] text-xs sm:text-sm font-light max-w-2xl mx-auto leading-relaxed">
            Every room at Oxygen Orbis is thoughtfully crafted with plush bedding, uninterrupted 24/7 power, high-speed fiber Wi-Fi, and personalized hospitality.
          </p>
        </div>

        {/* Filter Pills (Interactive) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pointer-events-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            All Accommodations (12)
          </button>
          <button
            onClick={() => setFilter('rooms')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'rooms'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Rooms & Plus
          </button>
          <button
            onClick={() => setFilter('cabins')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'cabins'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Chalet Cabins
          </button>
          <button
            onClick={() => setFilter('diplomatic')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === 'diplomatic'
                ? 'bg-[#C9854A] text-black shadow-lg shadow-[#C9854A]/30 scale-105'
                : 'bg-[#2A1208]/80 text-[#E0C8A8] border border-[#4A2010] hover:border-[#C9854A]/40'
            }`}
          >
            Diplomatic & Suites
          </button>
        </div>
      </div>

      {/* 3D Cylinder Orbit Stage (Slideable via Mouse / Touch Drag) */}
      <div
        onPointerDown={handlePointerDown}
        onDragStart={(e) => e.preventDefault()}
        className="relative w-full h-[380px] sm:h-[430px] lg:h-[470px] my-2 sm:my-4 cursor-grab active:cursor-grabbing flex items-center justify-center overflow-visible"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Revolving Cylinder */}
        <div
          ref={cylinderRef}
          className="relative w-full h-full flex items-center justify-center will-change-transform pointer-events-none"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(${cardDimensions.offsetZ}px) rotateY(${DEFAULT_ROTATION}deg)`,
          }}
        >
          {displayItems.map((room, idx) => {
            const cardAngle = idx * angleStep;
            return (
              <div
                key={room._uniqueKey}
                onClick={(e) => handleCardClick(room, e)}
                onDragStart={(e) => e.preventDefault()}
                className="group absolute rounded-3xl overflow-hidden shadow-2xl cursor-pointer border border-[#C9854A]/40 hover:border-[#C9854A] bg-[#2A1208] pointer-events-auto transition-transform duration-300"
                style={{
                  width: `${cardDimensions.width}px`,
                  height: `${cardDimensions.height}px`,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotateY(${cardAngle}deg) translateZ(${cardDimensions.radius}px)`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Room Image */}
                <img
                  src={room.image}
                  alt={room.name}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                />

                {/* Dark Vignette Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

                {/* Top Badge: Promo / Value */}
                {room.badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-black/65 text-white border border-white/10 backdrop-blur-md pointer-events-none shadow-sm">
                    {room.badge.split('•')[0].trim()}
                  </span>
                )}

                {/* Top Rating */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-xs font-bold text-amber-300 border border-white/10 pointer-events-none shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{room.rating}</span>
                </div>

                {/* Bottom Room Meta Matching Reference Image Exactly */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 text-left pointer-events-none">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#E0A86A] group-hover:text-white transition-colors truncate">
                    {room.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#E0C8A8] mt-0.5 truncate">
                    <span>{room.bed.split('(')[0].trim()}</span>
                    <span>•</span>
                    <span>Max {room.maxGuests} Guests</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-base sm:text-xl font-bold text-white">
                          {formatPrice(room)}
                        </span>
                        <span className="text-xs text-[#C9A070]">/night</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-emerald-400 font-medium">
                        ✓ Breakfast &amp; VAT
                      </div>
                    </div>

                    {/* Warm Caramel View Button */}
                    <div className="px-3.5 py-1 rounded-full bg-[#C9854A] group-hover:bg-[#E0A86A] text-black transition-all duration-200 text-xs font-bold flex items-center gap-1 shadow-md shadow-black/40">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls & Interaction Guidance */}
      <div className="relative z-30 max-w-4xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 shrink-0">
        {/* Interaction Hint */}
        <div className="flex items-center gap-2 text-xs text-[#C9A070]/80">
          <MoveHorizontal className="w-4 h-4 text-[#C9854A] animate-pulse" />
          <span>Slide with mouse / swipe horizontally • Click card to expand</span>
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
          <div className="text-[11px] font-semibold text-[#E0C8A8] px-3.5 py-1 rounded-full bg-[#2A1208]/60 border border-[#4A2010]/80">
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

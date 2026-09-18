import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// =========================================================================
// 🎥 HERO SECTION MEDIA CONFIGURATION
// -------------------------------------------------------------------------
// Edit your custom assets here:
const HERO_CONFIG = {
  // Center expanding video (served straight from public/)
  videoSrc: "/my-resort-video.mp4",

  // Preview poster displayed while the video buffers
  posterSrc: "/my-resort-bg.png",

  // Full-screen background image behind the video
  bgImage: "/my-resort-bg.png",

  // Overlapping titles (which split outward on scroll)
  titleLine1: "Oxygen Orbis",
  titleLine2: "Resort",
};

export default function Hero({ 
  currency, 
  onOpenBooking, 
  onOpenCalendar, 
  onProgressChange,
  videoSrc = HERO_CONFIG.videoSrc,
  posterSrc = HERO_CONFIG.posterSrc,
  bgImage = HERO_CONFIG.bgImage,
  titleLine1 = HERO_CONFIG.titleLine1,
  titleLine2 = HERO_CONFIG.titleLine2,
}) {
  // Scroll progress from 0 (compact centered portrait) to 1 (full-screen cinematic landscape)
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    onProgressChange?.(progress);
  }, [progress, onProgressChange]);

  // Viewport dimensions for responsive calculations
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const progressRef = useRef(0);
  progressRef.current = progress;

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop wheel and mobile touch scroll-expansion interception
  useEffect(() => {
    const handleWheel = (e) => {
      const current = progressRef.current;
      // While collapsing or expanding before reaching 1
      if (current < 1) {
        e.preventDefault();
        const delta = e.deltaY * 0.0009;
        const next = Math.min(1, Math.max(0, current + delta));
        setProgress(next);
      } else if (current >= 1 && window.scrollY <= 2 && e.deltaY < 0) {
        // At the top of the page scrolling upward: begin reversing expansion
        e.preventDefault();
        const delta = e.deltaY * 0.0009;
        const next = Math.min(1, Math.max(0, current + delta));
        setProgress(next);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      const current = progressRef.current;

      if (current < 1) {
        if (e.cancelable) e.preventDefault();
        const factor = deltaY > 0 ? 0.005 : 0.008;
        const next = Math.min(1, Math.max(0, current + deltaY * factor));
        setProgress(next);
        touchStartY = currentY;
      } else if (current >= 1 && window.scrollY <= 5 && deltaY < -20) {
        if (e.cancelable) e.preventDefault();
        const next = Math.min(1, Math.max(0, current + deltaY * 0.008));
        setProgress(next);
        touchStartY = currentY;
      }
    };

    const handleTouchEnd = () => {
      touchStartY = 0;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Lock body overflow while progress < 1; unlock once progress === 1
  useEffect(() => {
    if (progress < 1) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [progress]);

  const isMobile = viewport.width < 768;

  // Responsive base sizing: gracefully adapt on mobile viewports
  const baseWidth = isMobile ? Math.min(280, viewport.width * 0.74) : 300;
  const baseHeight = isMobile ? Math.min(380, viewport.height * 0.52) : 400;

  let calculatedWidth = baseWidth;
  let calculatedHeight = baseHeight;

  if (isMobile) {
    calculatedWidth = baseWidth + (viewport.width * 0.95 - baseWidth) * progress;
    calculatedHeight = baseHeight + (viewport.height * 0.85 - baseHeight) * progress;
  } else {
    calculatedWidth = 300 + 1250 * progress;
    calculatedHeight = 400 + 400 * progress;
  }

  const finalWidth = Math.min(calculatedWidth, viewport.width * 0.95);
  const finalHeight = Math.min(calculatedHeight, viewport.height * 0.85);

  // Safe dynamic vertical position for scroll indicator:
  // Clamped on mobile so it is always comfortably visible and never collides with bottom buttons
  const displayedMediaHeight = finalHeight;
  const naturalIndicatorTop = viewport.height / 2 + displayedMediaHeight / 2 + 28;
  const indicatorTop = isMobile 
    ? Math.min(naturalIndicatorTop, viewport.height - 84)
    : naturalIndicatorTop;

  // Title translation calculations (Desktop: 150vw, Mobile: 180vw)
  const titleTravelVw = isMobile ? 180 : 150;
  const line1TranslateX = -titleTravelVw * progress;
  const line2TranslateX = titleTravelVw * progress;

  // Overlay opacity: Start near 0.42, reduce down to 0.16
  const mediaOverlayOpacity = Math.max(0.16, 0.42 - 0.26 * progress);

  // Smooth continuous transition ratio for revealed content (from 0.60 to 1.0)
  const revealRatio = Math.max(0, Math.min(1, (progress - 0.60) / 0.40));
  const sectionTranslateY = (1 - revealRatio) * 90;

  return (
    <div 
      className="relative w-full overflow-x-hidden select-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* ================================================== */}
      {/* 1. FULL-SCREEN HERO VIEWPORT                       */}
      {/* ================================================== */}
      <div className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden bg-black">
        
        {/* Full-Screen Background Image with Scroll Fade & Scale */}
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
          style={{
            opacity: Math.max(0, 1 - progress),
            transform: `scale(${1 + 0.05 * progress})`,
            transition: 'opacity 0.1s linear, transform 0.1s linear',
          }}
        >
          <img
            src={bgImage}
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
          {/* Black overlay with approximately 20% opacity */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Centered Media Frame (Portrait -> Cinematic Landscape on Scroll) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden z-10 will-change-[width,height,transform]"
          style={{
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
            maxWidth: '95vw',
            maxHeight: '85vh',
            boxShadow: `0 30px 100px rgba(0, 0, 0, 0.5), 0 0 ${progress * 50}px rgba(201, 133, 74, ${progress * 0.25})`,
          }}
        >
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            poster={posterSrc}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Black overlay over video to keep title readable */}
          <div 
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-100 ease-linear"
            style={{ opacity: mediaOverlayOpacity }}
          />
        </div>

        {/* Two-Line Title with Ethereal Cinematic Optical Dissolve */}
        <div 
          className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-20 pointer-events-none px-4 flex flex-col items-center justify-center gap-2 will-change-transform"
          style={{ 
            mixBlendMode: 'difference',
            filter: `blur(${progress * 8}px)`,
            opacity: Math.max(0, 1 - progress * 1.35),
            transition: 'filter 0.08s linear, opacity 0.08s linear',
          }}
        >
          {/* First Line */}
          <div
            className="text-blue-100 font-bold text-center leading-[0.9] tracking-[-0.06em] will-change-transform whitespace-nowrap"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 6rem)',
              transform: `translateX(${line1TranslateX}vw)`,
            }}
          >
            {titleLine1}
          </div>

          {/* Second Line */}
          <div
            className="text-blue-100 font-bold text-center leading-[0.9] tracking-[-0.06em] will-change-transform whitespace-nowrap"
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 6rem)',
              transform: `translateX(${line2TranslateX}vw)`,
            }}
          >
            {titleLine2}
          </div>
        </div>

        {/* Responsive Scroll / Swipe Indicator (Mobile & Desktop) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-center gap-2.5 text-white transition-all duration-300 ease-out"
          style={{
            top: `${indicatorTop}px`,
            opacity: progress > 0.14 ? 0 : 1 - progress / 0.14,
            transform: `translateX(-50%) translateY(${progress > 0.14 ? 14 : (progress / 0.14) * 14}px)`,
          }}
        >
          {/* Shimmering Animated Label */}
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] bg-gradient-to-r from-white via-[#E0A86A] to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {isMobile ? 'SWIPE TO EXPLORE' : 'SCROLL TO EXPLORE'}
          </span>

          {/* Cool Animated Gesture / Mouse Capsule */}
          {isMobile ? (
            /* Mobile Touch Gesture Capsule */
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="w-6 h-10 rounded-full border border-[#C9854A]/70 bg-black/40 backdrop-blur-md p-1 flex justify-center shadow-[0_0_16px_rgba(201,133,74,0.3)]"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-gradient-to-b from-[#E0A86A] to-[#C9854A] shadow-[0_0_8px_#E0A86A]"
                  animate={{ y: [0, 16, 0], opacity: [0.5, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              {/* Cascading Downward Micro Chevron */}
              <motion.div
                animate={{ y: [0, 3, 0], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="text-[#C9854A] text-[9px] font-bold"
              >
                ▼
              </motion.div>
            </div>
          ) : (
            /* Desktop Precision Mouse Pill */
            <div className="w-[28px] h-[44px] border border-white/50 bg-black/30 backdrop-blur-sm rounded-full p-[6px] flex justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <motion.div
                className="w-[6px] h-[6px] rounded-full bg-gradient-to-b from-white to-[#E0A86A] shadow-[0_0_8px_white]"
                animate={{
                  y: [0, 20, 0],
                  opacity: [0.35, 1, 0.35],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. REVEALED CONTENT SECTION WITH PARALLAX TRANSITION */}
      {/* ================================================== */}
      <div 
        className="w-full bg-[#1A0C06] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] px-6 sm:px-16 pt-10 pb-16 lg:pt-20 lg:pb-28 relative z-30 overflow-hidden"
        style={{
          opacity: revealRatio,
          transform: `translateY(${sectionTranslateY}px)`,
          pointerEvents: progress >= 0.75 ? 'auto' : 'none',
        }}
      >
        {/* Top Luminous Gold Horizon Line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#C9854A] to-transparent shadow-[0_0_25px_#C9854A] mb-8 sm:mb-12" />

        <div className="max-w-[960px] mx-auto">
          {/* Top Label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9854A]" />
            <p className="text-[11.5px] font-bold uppercase tracking-[0.3em] text-[#C9854A]">
              OXYGEN ORBIS RESORT
            </p>
          </div>

          {/* Main Heading */}
          <h2 className="text-[32px] sm:text-[56px] font-semibold tracking-[-0.04em] text-white leading-[1.15] mb-8 max-w-[780px]">
            Ibadan&apos;s most luxurious staycation destination.
          </h2>

          {/* Responsive Two-Column Text Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[17px] leading-[32px] text-[#C9A070] mb-14">
            <p className="font-light">
              Nestled just 6 minutes from the Moniya Lagos–Ibadan railway terminal, Oxygen Orbis Resort is your private sanctuary in Southwest Nigeria — featuring 40 curated suites across four luxury tiers, an Olympic swimming pool, and private balconies framing panoramic landscape views.
            </p>
            <p className="font-light">
              From serene poolside mornings to electric nights at the Mac Foster Lounge, every stay is an experience designed to exceed expectation. 24/7 uninterrupted power, high-speed fiber Wi-Fi, and a dedicated concierge team ensure your comfort from arrival to departure.
            </p>
          </div>

          {/* Responsive Three-Column Resort Stats Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
            <div className="bg-white/[0.03] border border-[#C9854A]/20 hover:border-[#C9854A]/60 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_rgba(201,133,74,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9854A]/70 mb-2 font-medium">LOCATION</p>
              <p className="text-[18px] font-semibold text-white">6 min · Moniya Terminal</p>
            </div>
            <div className="bg-white/[0.03] border border-[#C9854A]/20 hover:border-[#C9854A]/60 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_rgba(201,133,74,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9854A]/70 mb-2 font-medium">SUITES</p>
              <p className="text-[18px] font-semibold text-white">40 Curated Accommodations</p>
            </div>
            <div className="bg-white/[0.03] border border-[#C9854A]/20 hover:border-[#C9854A]/60 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_rgba(201,133,74,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9854A]/70 mb-2 font-medium">NIGHTLIFE</p>
              <p className="text-[18px] font-semibold text-white">Mac Foster Rooftop Lounge</p>
            </div>
          </div>

          {/* ================================================== */}
          {/* 3. SHOWSTOPPING SANCTUARY GATEWAY TRANSITION CARD   */}
          {/* ================================================== */}
          <div className="rounded-3xl bg-gradient-to-br from-[#2A1208] via-[#361810] to-[#2A1208] text-white p-7 sm:p-12 lg:p-14 border border-[#C9854A]/40 shadow-[0_25px_70px_rgba(0,0,0,0.6)] relative overflow-hidden group">
            {/* Ambient animated gold glow orb */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#C9854A]/20 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C9854A]/30 transition-all duration-700" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.28em] text-[#C9854A] uppercase mb-3.5 px-3 py-1 rounded-full bg-[#C9854A]/10 border border-[#C9854A]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9854A] animate-pulse" />
                  The Sanctuary Awaits • Moniya, Ibadan
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-white leading-tight mb-3">
                  Step into 40 Curated Suites &amp; Rooftop Lounge
                </h3>
                <p className="text-sm text-[#E0C8A8] font-light leading-relaxed">
                  Just 6 minutes from the Moniya Lagos-Ibadan train terminal. 24/7 power, Olympic swimming pool, private balconies, and vibrant Mac Foster nightlife.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenBooking && onOpenBooking()}
                  className="px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-[#1A0C06] bg-gradient-to-r from-[#D4AF37] via-[#C9854A] to-[#B06A2E] hover:from-[#E0A86A] hover:to-[#C9854A] shadow-[0_8px_25px_rgba(201,133,74,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 text-center cursor-pointer"
                >
                  Reserve A Suite
                </button>
                <a
                  href="#rooms"
                  className="px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-white border border-white/20 hover:border-[#C9854A] hover:text-[#C9854A] bg-white/[0.03] hover:bg-white/[0.06] transition-all text-center flex items-center justify-center gap-2 group/btn"
                >
                  <span>Explore Suites</span>
                  <span className="group-hover/btn:translate-y-0.5 transition-transform">↓</span>
                </a>
              </div>
            </div>
          </div>

          {/* Seamless dark melt into Rooms section */}
          <div className="w-full h-16 sm:h-24 -mb-16 sm:-mb-24 bg-gradient-to-b from-transparent to-[#1A0C06] pointer-events-none mt-14" />
        </div>
      </div>
    </div>
  );
}

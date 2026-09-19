import React from 'react';

// =========================================================================
// 🏨 OXYGEN ORBIS RESORT — 3D FLOATING TESTIMONIAL MARQUEE
// -------------------------------------------------------------------------
// Theme: Chocolate & Caramel Luxury (#0C0502 to #1A0C06, #C9854A, #D4AF37)
// Features: True 3D perspective stage, alternating vertical infinite marquees,
// radial edge mask, 0 outer box/panel, hover-pause, full responsive scaling.
// =========================================================================

const TESTIMONIAL_COLUMNS = [
  // Column 1 (Moves Upward - 35s)
  [
    {
      name: "Adewale Bankole",
      handle: "@adewale.b",
      origin: "Lagos (via Moniya Train)",
      room: "Executive Suite",
      message: "The 4 PM train from Ebute Metta got us here in time for sunset. The rooftop breeze and quiet made us forget Lagos traffic entirely.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Beverly Nwachukwu",
      handle: "@beverly_nw",
      origin: "Victoria Island, Lagos",
      room: "Presidential Suite",
      message: "Hosted my bridal shower in the Presidential Suite. 24/7 constant power, gorgeous pool cabanas, and attentive five-star hospitality.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Engr. Kunle Makinde",
      handle: "@kunle_m",
      origin: "Ibadan Resident",
      room: "Garden Pavilion Retreat",
      message: "Our annual executive strategy retreat at the garden pavilion was seamless. Crisp acoustics, stellar dining, and serene nature.",
      country: "🇳🇬 Ibadan, Nigeria",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    },
  ],

  // Column 2 (Moves Downward - 30s)
  [
    {
      name: "Dr. Kemi Adeleke",
      handle: "@dr_kemi",
      origin: "Ibadan & Lekki",
      room: "Presidential Penthouse",
      message: "Celebrated my 40th birthday at Mac Foster Lounge. Powerful AC, authentic goat meat pepper soup, and lavish hospitality all weekend.",
      country: "🇳🇬 Ibadan, Nigeria",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Tobi & Simi Adeyemi",
      handle: "@tobi_simi",
      origin: "Ikoyi, Lagos",
      room: "Executive Balcony Suite",
      message: "The chauffeur pickup from Moniya train station took just 6 minutes. The suite was spotless with calming views of the IITA forest.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Lanre Alabi",
      handle: "@lanre_a",
      origin: "Lagos, Nigeria",
      room: "Mac Foster VIP Booth",
      message: "Hands down the hottest nightlife venue in Oyo state. Elite sound system, top DJs, and stepping straight upstairs into a suite.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
    },
  ],

  // Column 3 (Moves Upward - 38s)
  [
    {
      name: "Folarin Oladipo",
      handle: "@folarin_dev",
      origin: "Remote Tech Lead",
      room: "Deluxe King Room",
      message: "Needed 4 days of uninterrupted deep work with fast fiber Wi-Fi and 24/7 power. The staff was super discreet and never disturbed calls.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Chiamaka Eze",
      handle: "@chiamaka_uk",
      origin: "London, UK",
      room: "Executive Suite",
      message: "Returned home to Nigeria for holiday staycation. Oxygen Orbis matches the luxury and safety standards of top boutique hotels in Europe.",
      country: "🇬🇧 London, UK",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Zainab Belgore",
      handle: "@zainab_b",
      origin: "Abuja, Nigeria",
      room: "Deluxe King & Vitality Spa",
      message: "The outdoor pool and vitality spa were pure bliss. Crystal clear water, poolside cocktails, and complete peace away from city noise.",
      country: "🇳🇬 Abuja, Nigeria",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    },
  ],

  // Column 4 (Moves Downward - 33s)
  [
    {
      name: "Chief Segun Awolowo",
      handle: "@segun_a",
      origin: "Victoria Island",
      room: "Presidential Penthouse",
      message: "Discreet perimeter security, seamless industrial generator power, and grilled tilapia at the restaurant that was freshly made to order.",
      country: "🇳🇬 Lagos, Nigeria",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "David Adebayo",
      handle: "@david_ca",
      origin: "Toronto, Canada",
      room: "Executive Balcony Suite",
      message: "Visited family in Ibadan and stayed a full week here. The 6-minute chauffeur connection to Moniya rail terminal made transit effortless.",
      country: "🇨🇦 Toronto, Canada",
      avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80",
    },
    {
      name: "Tolani Shonibare",
      handle: "@tolani_sh",
      origin: "Ibadan Lifestyle",
      room: "Sky Rooftop Lounge",
      message: "The 360-degree sunset horizons over Moniya from the Sky Lounge are breathtaking. Elegant mixology, great music, and gorgeous decor.",
      country: "🇳🇬 Ibadan, Nigeria",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    },
  ],
];

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="tm-section scroll-mt-24" aria-label="Guest Testimonials and Reviews">
      <style>{`
        /* ============================================================
           FLOATING 3D TESTIMONIAL MARQUEE — CHOCOLATE & CARAMEL LUXURY
           ============================================================ */

        .tm-section {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          box-sizing: border-box;
          padding: 70px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F5E6D0;
          background:
            radial-gradient(
              circle at 14% 12%,
              rgba(201, 133, 74, 0.16),
              transparent 31%
            ),
            radial-gradient(
              circle at 93% 93%,
              rgba(160, 96, 48, 0.14),
              transparent 31%
            ),
            radial-gradient(
              circle at 54% 46%,
              rgba(224, 168, 106, 0.05),
              transparent 43%
            ),
            #0A0402;
        }

        .tm-section *,
        .tm-section *::before,
        .tm-section *::after {
          box-sizing: border-box;
        }

        /* Subtle 54px by 54px grid with outward radial mask */
        .tm-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.13;
          background-image:
            linear-gradient(rgba(255, 235, 215, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 235, 215, 0.05) 1px, transparent 1px);
          background-size: 54px 54px;
          -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
          mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
        }

        /* Atmospheric Blurred Ambient Glow Elements */
        .tm-glow-1 {
          position: absolute;
          width: 480px;
          height: 480px;
          top: -300px;
          left: -120px;
          border-radius: 50%;
          background: rgba(201, 133, 74, 0.20);
          filter: blur(130px);
          pointer-events: none;
        }

        .tm-glow-2 {
          position: absolute;
          width: 480px;
          height: 480px;
          right: -200px;
          bottom: -310px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.17);
          filter: blur(130px);
          pointer-events: none;
        }

        /* Main Desktop Container (> 1000px) */
        .tm-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Left Content Column */
        .tm-left {
          width: min(460px, 42%);
          flex-shrink: 0;
          margin-right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          z-index: 20;
        }

        /* Small Pill Label */
        .tm-pill {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 22px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1px solid rgba(201, 133, 74, 0.25);
          background: rgba(42, 18, 8, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.4);
          color: #E0A86A;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .tm-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #C9854A;
          box-shadow: 0 0 15px rgba(201, 133, 74, 0.95);
          animation: tm-pulse 2.2s ease-in-out infinite alternate;
        }

        @keyframes tm-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        /* Large Two-Tone Heading */
        .tm-heading {
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(46px, 5.8vw, 82px);
          font-weight: 680;
          line-height: 0.94;
          letter-spacing: -0.065em;
          max-width: 520px;
          margin: 0;
        }

        .tm-heading-primary {
          color: #ffffff;
          display: block;
        }

        .tm-heading-secondary {
          color: rgba(224, 200, 168, 0.42);
          display: block;
          margin-top: 4px;
        }

        /* Supporting Description */
        .tm-description {
          max-width: 420px;
          margin-top: 26px;
          margin-bottom: 0;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(245, 230, 215, 0.68);
          font-weight: 400;
        }

        /* ────────────────────────────────────────────────────────────
           RIGHT ANIMATION AREA — COMPLETELY FREE-FLOATING IN OPEN SPACE
           (NO outer border, NO background panel, NO box shadow, NO glass)
           ──────────────────────────────────────────────────────────── */
        .tm-animation-area {
          position: relative;
          width: min(790px, 59%);
          height: min(700px, 80vh);
          overflow: hidden;
          /* Radial Edge Fading on Cards */
          -webkit-mask-image: radial-gradient(
            ellipse 86% 82% at 52% 50%,
            black 48%,
            rgba(0, 0, 0, 0.94) 62%,
            rgba(0, 0, 0, 0.56) 77%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 86% 82% at 52% 50%,
            black 48%,
            rgba(0, 0, 0, 0.94) 62%,
            rgba(0, 0, 0, 0.56) 77%,
            transparent 100%
          );
          perspective: 850px;
          -webkit-perspective: 850px;
        }

        /* 3D Card Stage */
        .tm-stage {
          position: absolute;
          top: -23%;
          left: -12%;
          width: 130%;
          height: 150%;
          display: flex;
          gap: 16px;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform: rotateX(11deg) rotateY(-13deg) rotateZ(10deg) translate3d(4%, 2%, -65px);
        }

        /* Hover on overall card animation area pauses every column */
        .tm-animation-area:hover .tm-track {
          animation-play-state: paused !important;
        }

        /* Vertical Columns */
        .tm-column {
          flex: 1;
          min-width: 0;
          height: 100%;
          overflow: hidden;
        }

        .tm-track {
          display: flex;
          flex-direction: column;
          gap: 14px;
          will-change: transform;
        }

        /* Column Animations & Timings */
        .tm-track-col-0 {
          animation: tm-marquee-up 35s linear infinite;
        }

        .tm-track-col-1 {
          animation: tm-marquee-down 30s -6s linear infinite;
        }

        .tm-track-col-2 {
          animation: tm-marquee-up 38s -12s linear infinite;
        }

        .tm-track-col-3 {
          animation: tm-marquee-down 33s -18s linear infinite;
        }

        @keyframes tm-marquee-up {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(calc(-50% - 7px));
          }
        }

        @keyframes tm-marquee-down {
          0% {
            transform: translateY(calc(-50% - 7px));
          }
          100% {
            transform: translateY(0);
          }
        }

        /* ────────────────────────────────────────────────────────────
           TESTIMONIAL CARD DESIGN — CHOCOLATE LUXURY GLASS
           ──────────────────────────────────────────────────────────── */
        .tm-card {
          position: relative;
          min-height: 154px;
          padding: 17px;
          border-radius: 17px;
          flex-shrink: 0;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border: 1px solid rgba(201, 133, 74, 0.20);
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.05),
              rgba(201, 133, 74, 0.025)
            ),
            rgba(26, 12, 6, 0.92);
          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transform: translateZ(0);
          transition:
            transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 300ms ease,
            background 300ms ease,
            box-shadow 300ms ease;
          cursor: default;
        }

        /* Soft internal warm caramel highlight glow */
        .tm-card::before {
          content: "";
          position: absolute;
          top: -40px;
          left: 20%;
          width: 70%;
          height: 70px;
          border-radius: 999px;
          background: rgba(201, 133, 74, 0.16);
          filter: blur(35px);
          pointer-events: none;
        }

        /* Card 3D Lift on Hover */
        .tm-card:hover {
          z-index: 50;
          transform: translateZ(30px) scale(1.025);
          border-color: rgba(201, 133, 74, 0.55);
          background:
            linear-gradient(
              145deg,
              rgba(201, 133, 74, 0.16),
              rgba(255, 255, 255, 0.04)
            ),
            rgba(36, 16, 8, 0.97);
          box-shadow:
            0 24px 55px rgba(0, 0, 0, 0.6),
            0 0 25px rgba(201, 133, 74, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        /* Card Profile Header */
        .tm-card-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .tm-avatar {
          width: 39px;
          height: 39px;
          border-radius: 50%;
          object-fit: cover;
          background: #1A0C06;
          border: 1px solid rgba(201, 133, 74, 0.35);
          box-shadow:
            0 7px 20px rgba(0, 0, 0, 0.38),
            0 0 0 3px rgba(201, 133, 74, 0.08);
          flex-shrink: 0;
        }

        .tm-user-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .tm-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tm-name {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          font-weight: 650;
          color: rgba(255, 255, 255, 0.94);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Gold/Caramel Verified Checkmark Badge */
        .tm-badge {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #C9854A;
          color: #ffffff;
          display: grid;
          place-items: center;
          font-size: 9px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(201, 133, 74, 0.6);
        }

        .tm-handle {
          font-size: 11px;
          color: rgba(224, 200, 168, 0.55);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Testimonial Message */
        .tm-message {
          position: relative;
          z-index: 2;
          min-height: 42px;
          margin: 14px 0 15px;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 12px;
          line-height: 1.55;
          color: rgba(245, 230, 215, 0.80);
          font-weight: 400;
        }

        /* Card Footer */
        .tm-card-footer {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 10px;
          color: rgba(224, 200, 168, 0.55);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .tm-country {
          display: flex;
          align-items: center;
          gap: 5px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tm-stars {
          color: #D4AF37;
          font-size: 8px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        /* ────────────────────────────────────────────────────────────
           RESPONSIVE BREAKPOINTS (<= 1000px, <= 700px, <= 470px)
           ──────────────────────────────────────────────────────────── */

        @media (max-width: 1000px) {
          .tm-section {
            padding: 70px 18px 30px;
          }
          .tm-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .tm-left {
            width: 100%;
            margin-right: 0;
            margin-bottom: 40px;
            align-items: center;
          }
          .tm-heading {
            font-size: clamp(46px, 9vw, 74px);
            max-width: 600px;
          }
          .tm-description {
            margin-left: auto;
            margin-right: auto;
          }
          .tm-animation-area {
            width: min(780px, 100%);
            height: 620px;
          }
        }

        @media (max-width: 700px) {
          .tm-section {
            padding-left: 12px;
            padding-right: 12px;
          }
          .tm-left {
            margin-bottom: 30px;
          }
          .tm-heading {
            font-size: clamp(42px, 12vw, 62px);
          }
          .tm-description {
            font-size: 14px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .tm-animation-area {
            height: 570px;
          }
          /* Hide 4th Column on medium screens */
          .tm-col-3 {
            display: none;
          }
          .tm-stage {
            top: -20%;
            left: -22%;
            width: 145%;
            gap: 12px;
            transform: rotateX(9deg) rotateY(-11deg) rotateZ(8deg) translate3d(3%, 2%, -45px);
          }
          .tm-card {
            min-height: 145px;
            padding: 14px;
          }
        }

        @media (max-width: 470px) {
          .tm-animation-area {
            height: 540px;
          }
          .tm-stage {
            left: -31%;
            width: 165%;
          }
          /* Show only 2 Columns on small phones */
          .tm-col-2 {
            display: none;
          }
          .tm-card {
            min-height: 150px;
          }
        }

        /* Accessibility: Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .tm-dot,
          .tm-track {
            animation: none !important;
          }
          .tm-card {
            transition: none !important;
          }
        }
      `}</style>

      {/* Subtle outward-fading 54px by 54px grid */}
      <div className="tm-grid" aria-hidden="true" />

      {/* Atmospheric Blurred Glow Elements */}
      <div className="tm-glow-1" aria-hidden="true" />
      <div className="tm-glow-2" aria-hidden="true" />

      <div className="tm-container">
        {/* Left Side: Pill, Large Two-Tone Heading, Description */}
        <div className="tm-left">
          <div className="tm-pill">
            <span className="tm-dot" aria-hidden="true" />
            <span>AUTHENTIC GUEST PRAISE</span>
          </div>

          <h2 className="tm-heading">
            <span className="tm-heading-primary">Loved by guests.</span>
            <span className="tm-heading-secondary">Cherished forever.</span>
          </h2>

          <p className="tm-description">
            Real impressions from Lagos staycationers, traveling executives, couples, and weekend celebrants who found their private sanctuary at Oxygen Orbis.
          </p>
        </div>

        {/* Right Side: Floating 3D Testimonial Marquee (Zero outer box/panel) */}
        <div className="tm-animation-area" aria-label="Guest reviews carousel">
          <div className="tm-stage">
            {TESTIMONIAL_COLUMNS.map((colCards, colIdx) => {
              // Duplicate the card list to create a seamless infinite loop
              const loopedCards = [...colCards, ...colCards];

              return (
                <div key={colIdx} className={`tm-column tm-col-${colIdx}`}>
                  <div className={`tm-track tm-track-col-${colIdx}`}>
                    {loopedCards.map((card, cardIdx) => (
                      <article key={`${card.name}-${cardIdx}`} className="tm-card">
                        <div className="tm-card-header">
                          <img
                            src={card.avatar}
                            alt={`${card.name} avatar`}
                            className="tm-avatar"
                            loading="lazy"
                          />
                          <div className="tm-user-info">
                            <div className="tm-name-row">
                              <span className="tm-name">{card.name}</span>
                              <span className="tm-badge" title="Verified Guest" aria-label="Verified">
                                ✓
                              </span>
                            </div>
                            <span className="tm-handle">{card.room} • {card.origin}</span>
                          </div>
                        </div>

                        <p className="tm-message">
                          "{card.message}"
                        </p>

                        <div className="tm-card-footer">
                          <span className="tm-country">{card.country}</span>
                          <span className="tm-stars" aria-label="5 out of 5 stars">
                            ★★★★★
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

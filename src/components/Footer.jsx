import React from 'react';
import { RESORT_INFO } from '../data/resortData';

const BRAND_NAME = "OXYGEN ORBIS";
const BRAND_LINE_1 = "OXYGEN";
const BRAND_LINE_2 = "ORBIS";

const SOCIALS = [
  { name: "Instagram", href: RESORT_INFO.instagramUrl || "https://instagram.com/oxygenorbis", external: true },
  { name: "WhatsApp", href: "https://wa.me/2349033987126?text=Hello%20Oxygen%20Orbis%20Concierge,%20I%20would%20like%20to%20inquire%20about%20a%20stay.", external: true },
  { name: "Direct Call", href: `tel:${RESORT_INFO.phone}`, external: true },
  { name: "Moniya Guide", href: "#location", external: false },
];

const FOOTER_GROUPS = [
  {
    title: "ACCOMMODATIONS",
    links: [
      { label: "Deluxe King Room", href: "#rooms" },
      { label: "Executive Suite", href: "#rooms" },
      { label: "Presidential Suite", href: "#rooms" },
      { label: "Reserve A Suite", action: "booking" },
      { label: "24/7 Power Policy", href: "#faqs" },
    ],
  },
  {
    title: "EXPERIENCES",
    links: [
      { label: "Mac Foster Nightclub", href: "#experiences" },
      { label: "Sky Rooftop Lounge", href: "#experiences" },
      { label: "Swimming Pool & Cabanas", href: "#experiences" },
      { label: "Vitality Spa & Fitness", href: "#experiences" },
      { label: "Bespoke Enhancements", href: "#enhancements" },
    ],
  },
  {
    title: "LAGOS ESCAPE",
    links: [
      { label: "Moniya Railway Station", href: "#lagos-escape" },
      { label: "VIP Station Chauffeur", href: "#lagos-escape" },
      { label: "2-Hour Scenic Train", href: "#lagos-escape" },
      { label: "IITA Forest Proximity", href: "#location" },
      { label: "Interactive Location Map", href: "#location" },
    ],
  },
  {
    title: "MANAGEMENT & PMS",
    links: [
      { label: "Front Desk Staff PMS", action: "pms" },
      { label: "Owner's Pitch View", action: "pitch" },
      { label: "Digital Stay Pass & QR", action: "booking" },
      { label: "Direct Privilege Guarantee", href: "#faqs" },
      { label: "Cashless Transfer Verification", href: "#faqs" },
    ],
  },
];

export default function Footer({ onOpenPitch, onOpenBooking, onOpenPms }) {
  const handleLinkClick = (link, e) => {
    if (link.action) {
      e.preventDefault();
      if (link.action === 'booking' && onOpenBooking) onOpenBooking();
      if (link.action === 'pitch' && onOpenPitch) onOpenPitch();
      if (link.action === 'pms' && onOpenPms) onOpenPms();
    }
  };

  return (
    <footer className="kex-footer">
      <style>{`
        /* ============================================================
           KEXSIO GLASSY FOOTER — EXACT NØVRA BOTTOM-ALIGNED RECREATION
           ============================================================ */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@700;800;900&display=swap');

        .kex-footer {
          position: relative;
          width: 100%;
          height: 100svh;
          max-height: 100svh;
          overflow: hidden;
          color: #F5E6D0;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
          isolation: isolate;
          box-sizing: border-box;
          background:
            radial-gradient(
              ellipse 54% 82% at 50% 8%,
              rgba(201, 133, 74, 0.22) 0%,
              rgba(160, 96, 48, 0.15) 28%,
              rgba(90, 42, 20, 0.08) 49%,
              rgba(40, 18, 8, 0.025) 68%,
              transparent 82%
            ),
            radial-gradient(
              ellipse 50% 84% at 50% 74%,
              rgba(185, 95, 35, 0.22) 0%,
              rgba(105, 45, 18, 0.13) 43%,
              transparent 76%
            ),
            linear-gradient(
              108deg,
              #0C0502 0%,
              #150803 25%,
              #230E05 46%,
              #2B1207 53%,
              #190A04 72%,
              #0C0502 100%
            );
        }

        .kex-footer *,
        .kex-footer *::before,
        .kex-footer *::after {
          box-sizing: border-box;
        }

        /* Ambient Glass Light */
        .kex-footer::before {
          content: "";
          position: absolute;
          top: -54%;
          left: 50%;
          z-index: 0;
          width: 70%;
          height: 132%;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(224, 168, 106, 0.17) 0%,
            rgba(201, 133, 74, 0.11) 27%,
            rgba(125, 60, 25, 0.055) 53%,
            transparent 74%
          );
          filter: blur(42px);
          transform: translateX(-50%) translateZ(0);
          will-change: transform, opacity;
          animation: kex-ambient-breathe 9s ease-in-out infinite alternate;
        }

        @keyframes kex-ambient-breathe {
          0% {
            opacity: 0.7;
            transform: translateX(-50%) scale(0.95) translateZ(0);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1.06) translateZ(0);
          }
        }

        /* Moving Glass Reflection */
        .kex-footer::after {
          content: "";
          position: absolute;
          top: -65%;
          left: -55%;
          z-index: 0;
          width: 72%;
          height: 215%;
          border-radius: 50%;
          pointer-events: none;
          background: linear-gradient(
            102deg,
            transparent 29%,
            rgba(255, 235, 210, 0.015) 41%,
            rgba(255, 235, 210, 0.07) 50%,
            rgba(255, 235, 210, 0.015) 59%,
            transparent 71%
          );
          transform: rotate(8deg) translateZ(0);
          animation: kex-reflection 15s ease-in-out infinite;
        }

        @keyframes kex-reflection {
          0%, 22% {
            left: -60%;
            opacity: 0;
          }
          42% {
            opacity: 0.48;
          }
          68%, 100% {
            left: 90%;
            opacity: 0;
          }
        }

        /* Inner Upper Content Wrapper — Flex Layout to guarantee 100% viewport fit */
        .kex-footer-inner {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: clamp(26px, 3.2vw, 44px) clamp(30px, 3.5vw, 54px) 0;
          box-sizing: border-box;
        }

        .kex-upper {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Top Social Navigation */
        .kex-socials {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: clamp(32px, 3.8vw, 64px);
        }

        .kex-social {
          min-width: 0;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: rgba(250, 240, 230, 0.93);
          font-size: clamp(15px, 1.18vw, 19px);
          font-weight: 400;
          line-height: 1;
          letter-spacing: -0.035em;
          text-decoration: none;
          opacity: 0;
          transform: translateY(15px);
          animation: kex-rise 850ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .kex-social-0 { animation-delay: 80ms; }
        .kex-social-1 { animation-delay: 150ms; }
        .kex-social-2 { animation-delay: 220ms; }
        .kex-social-3 { animation-delay: 290ms; }

        .kex-social-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 300ms ease, transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .kex-social:hover .kex-social-name {
          color: #E0A86A;
          transform: translateX(4px);
        }

        /* Animated Replacement Arrow */
        .kex-arrow {
          position: relative;
          width: 28px;
          height: 20px;
          flex: 0 0 28px;
          overflow: hidden;
        }

        .kex-arrow::before,
        .kex-arrow::after {
          content: "→";
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 26px;
          font-weight: 300;
          line-height: 1;
          transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1), color 300ms ease;
        }

        .kex-arrow::before {
          color: rgba(255, 255, 255, 0.92);
          transform: translateX(0);
        }

        .kex-arrow::after {
          color: #C9854A;
          transform: translateX(-145%);
        }

        .kex-social:hover .kex-arrow::before {
          transform: translateX(145%);
        }

        .kex-social:hover .kex-arrow::after {
          transform: translateX(0);
        }

        /* Footer Navigation Columns — Compact & Refined to Preserve Lower Glass Space */
        .kex-columns {
          position: relative;
          z-index: 4;
          width: 100%;
          margin-top: clamp(22px, 2.8vw, 42px);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: clamp(32px, 3.8vw, 64px);
        }

        .kex-column {
          opacity: 0;
          transform: translateY(20px);
          animation: kex-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .kex-column-0 { animation-delay: 300ms; }
        .kex-column-1 { animation-delay: 390ms; }
        .kex-column-2 { animation-delay: 480ms; }
        .kex-column-3 { animation-delay: 570ms; }

        .kex-column-title {
          margin: 0 0 clamp(10px, 1.1vw, 16px);
          color: rgba(224, 168, 106, 0.6);
          font-family: "Courier New", Courier, monospace;
          font-size: clamp(10.5px, 0.8vw, 12.5px);
          font-weight: 500;
          line-height: 1;
          letter-spacing: 0.12em;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .kex-link-list {
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: clamp(7px, 0.85vw, 11px);
          list-style: none;
        }

        .kex-footer-link {
          position: relative;
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          color: rgba(245, 230, 215, 0.88);
          font-size: clamp(12.5px, 0.95vw, 15px);
          font-weight: 400;
          line-height: 1.25;
          letter-spacing: -0.03em;
          white-space: nowrap;
          text-decoration: none;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: color 280ms ease, transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Hover Dot Animation */
        .kex-footer-link::before {
          content: "";
          position: absolute;
          left: -13px;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #C9854A;
          box-shadow:
            0 0 7px rgba(201, 133, 74, 0.8),
            0 0 16px rgba(180, 100, 40, 0.5);
          opacity: 0;
          transform: translateY(-50%) scale(0);
          transition: opacity 280ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .kex-footer-link:hover {
          color: #ffffff;
          transform: translateX(13px);
        }

        .kex-footer-link:hover::before {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        /* Oversized Brand Area — Pinned Flush to the Absolute Bottom Edge */
        .kex-brand-zone {
          position: relative;
          width: 100%;
          margin-top: auto;
          margin-bottom: 0;
          padding-bottom: 5px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: visible;
          pointer-events: none;
        }

        .kex-brand-glow {
          position: absolute;
          left: 50%;
          bottom: -15%;
          width: 68%;
          height: 95%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            rgba(201, 133, 74, 0.23) 0%,
            rgba(150, 75, 25, 0.12) 40%,
            transparent 72%
          );
          filter: blur(52px);
          transform: translateX(-50%);
          animation: kex-brand-breathe 7s ease-in-out infinite alternate;
        }

        @keyframes kex-brand-breathe {
          0% {
            opacity: 0.5;
            transform: translateX(-50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1.08);
          }
        }

        .kex-brand-stack {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
          pointer-events: none;
        }

        .kex-brand {
          position: relative;
          margin: 0;
          padding: 0 1vw;
          font-family: 'Inter', Arial, sans-serif;
          font-size: clamp(70px, 12vw, 180px);
          font-weight: 900;
          line-height: 0.78;
          letter-spacing: -0.065em;
          white-space: nowrap;
          user-select: none;
          color: transparent;
          background: linear-gradient(
            100deg,
            rgba(160, 100, 50, 0.22) 0%,
            rgba(250, 225, 190, 0.78) 23%,
            rgba(201, 133, 74, 0.48) 43%,
            rgba(255, 245, 225, 0.88) 56%,
            rgba(180, 110, 55, 0.38) 76%,
            rgba(160, 100, 50, 0.20) 100%
          );
          background-size: 220% 100%;
          background-position: 0% center;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-stroke: 1px rgba(250, 225, 190, 0.15);
          filter: drop-shadow(0 25px 55px rgba(35, 12, 4, 0.5));
          opacity: 0;
          transform: translateY(105%) scaleY(1.07);
        }

        .kex-brand-1 {
          letter-spacing: -0.065em;
          animation:
            kex-brand-enter 1.25s 560ms cubic-bezier(0.16, 1, 0.3, 1) forwards,
            kex-brand-shine 9s 2s ease-in-out infinite;
        }

        .kex-brand-2 {
          letter-spacing: -0.025em;
          animation:
            kex-brand-enter 1.25s 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards,
            kex-brand-shine 9s 2.4s ease-in-out infinite;
        }

        .kex-brand::before {
          content: attr(data-brand);
          position: absolute;
          inset: 0;
          z-index: -1;
          color: rgba(201, 133, 74, 0.20);
          -webkit-text-stroke: 0;
          filter: blur(22px);
          transform: translateY(14px) scale(1.015);
        }

        .kex-brand::after {
          content: attr(data-brand);
          position: absolute;
          inset: 0;
          color: transparent;
          -webkit-text-stroke: 1px rgba(250, 225, 190, 0.09);
          transform: translateY(-2px);
        }

        @keyframes kex-brand-enter {
          0% {
            opacity: 0;
            transform: translateY(105%) scaleY(1.07);
            filter: blur(8px) drop-shadow(0 25px 55px rgba(35, 12, 4, 0.5));
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1.07);
            filter: blur(0) drop-shadow(0 25px 55px rgba(35, 12, 4, 0.5));
          }
        }

        @keyframes kex-brand-shine {
          0%, 20% {
            background-position: 0% center;
          }
          65%, 100% {
            background-position: 100% center;
          }
        }

        @keyframes kex-rise {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Short Desktop Height (e.g. 1366x768, 1440x900 or browser window with tabs) */
        @media (max-height: 760px) and (min-width: 701px) {
          .kex-footer-inner {
            padding-top: 20px;
          }
          .kex-columns {
            margin-top: 18px;
          }
          .kex-column-title {
            margin-bottom: 8px;
          }
          .kex-link-list {
            gap: 6px;
          }
          .kex-footer-link {
            font-size: 12.5px;
          }
          .kex-brand-zone {
            padding-bottom: 4px;
          }
          .kex-brand {
            font-size: clamp(52px, 8.8vw, 120px);
            line-height: 0.78;
          }
        }

        /* Tablet Layout */
        @media (max-width: 900px) {
          .kex-footer-inner {
            padding: 24px clamp(20px, 3.5vw, 36px) 0;
          }
          .kex-socials,
          .kex-columns {
            column-gap: 24px;
          }
          .kex-columns {
            margin-top: 24px;
          }
          .kex-social {
            font-size: clamp(13px, 1.7vw, 16px);
          }
          .kex-footer-link {
            font-size: clamp(12px, 1.5vw, 15px);
          }
          .kex-brand-zone {
            padding-bottom: 4px;
          }
          .kex-brand {
            font-size: clamp(58px, 13vw, 135px);
            line-height: 0.78;
          }
        }

        /* Mobile Layout */
        @media (max-width: 700px) {
          .kex-footer {
            height: auto;
            min-height: 620px;
            max-height: none;
          }
          .kex-footer-inner {
            padding: 24px 20px 16px;
            display: block;
            height: auto;
          }
          .kex-socials {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 20px;
            row-gap: 12px;
          }
          .kex-social {
            height: 28px;
            font-size: clamp(12px, 3.6vw, 14.5px);
          }
          .kex-arrow {
            width: 22px;
            height: 17px;
            flex-basis: 22px;
          }
          .kex-arrow::before,
          .kex-arrow::after {
            font-size: 21px;
          }
          .kex-columns {
            margin-top: 24px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 20px;
            row-gap: 22px;
          }
          .kex-column-title {
            margin-bottom: 8px;
            font-size: 9.5px;
          }
          .kex-link-list {
            gap: 7px;
          }
          .kex-footer-link {
            font-size: clamp(11px, 3.3vw, 13px);
          }
          .kex-brand-zone {
            margin-top: 24px;
            margin-bottom: 0;
            padding-bottom: 5px;
            height: auto;
          }
          .kex-brand {
            font-size: clamp(54px, 16.5vw, 108px);
            letter-spacing: -0.06em;
            line-height: 0.78;
          }
          .kex-brand-2 {
            letter-spacing: -0.02em;
          }
        }

        /* Small Mobile Layout */
        @media (max-width: 390px) {
          .kex-footer-inner {
            padding-left: 16px;
            padding-right: 16px;
          }
          .kex-socials,
          .kex-columns {
            column-gap: 16px;
          }
          .kex-footer-link {
            font-size: 11px;
          }
          .kex-brand {
            font-size: clamp(44px, 16vw, 76px);
            line-height: 0.78;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .kex-footer::before,
          .kex-footer::after,
          .kex-social,
          .kex-column,
          .kex-brand,
          .kex-brand-glow {
            animation-duration: 1ms !important;
            animation-delay: 0ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="kex-footer-inner">
        <div className="kex-upper">
          {/* Top Social Navigation */}
          <nav className="kex-socials" aria-label="Social media links">
            {SOCIALS.map((social, idx) => (
              <a
                key={social.name}
                href={social.href}
                className={`kex-social kex-social-${idx}`}
                target={social.external ? "_blank" : undefined}
                rel={social.external ? "noopener noreferrer" : undefined}
              >
                <span className="kex-social-name">{social.name}</span>
                <span className="kex-arrow" aria-hidden="true" />
              </a>
            ))}
          </nav>

          {/* Footer Navigation Columns — Compact so they leave generous space for OXYGEN */}
          <div className="kex-columns">
            {FOOTER_GROUPS.map((group, cIdx) => (
              <section key={group.title} className={`kex-column kex-column-${cIdx}`}>
                <h2 className="kex-column-title">{group.title}</h2>
                <ul className="kex-link-list">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.action ? (
                        <button
                          type="button"
                          onClick={(e) => handleLinkClick(link, e)}
                          className="kex-footer-link"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="kex-footer-link"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* Oversized Brand Area — Pinned Flush to the Bottom Edge Exactly Like NØVRA */}
        <div className="kex-brand-zone" aria-label={BRAND_NAME}>
          <div className="kex-brand-glow" />
          <div className="kex-brand-stack">
            <p className="kex-brand kex-brand-1" data-brand={BRAND_LINE_1} aria-hidden="true">
              {BRAND_LINE_1}
            </p>
            <p className="kex-brand kex-brand-2" data-brand={BRAND_LINE_2} aria-hidden="true">
              {BRAND_LINE_2}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

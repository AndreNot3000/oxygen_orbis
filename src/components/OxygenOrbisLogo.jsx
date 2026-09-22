import React from 'react';

/**
 * 🏨 OXYGEN ORBIS OFFICIAL EMBLEM & LOGO
 * 
 * Features the signature interlocking dual-orb insignia:
 * - Left celestial orb (Oxygen) in warm caramel
 * - Right planetary orbit ring & core orb (Orbis) in rich chocolate/burgundy
 * - Authentic brand typography "OXYGEN ORBIS"
 */
export default function OxygenOrbisLogo({
  className = "w-10 h-10",
  variant = "mark", // 'mark' (insignia only) | 'full' (mark + text) | 'img' (raster /logo.png)
  theme = "luxury", // 'luxury' (caramel & gold) | 'original' (caramel & burgundy) | 'white' | 'gold'
  showText = false,
  textClassName = "",
  subtext = null,
  onClick = null,
}) {
  // Theme color definitions
  const colors = {
    luxury: {
      leftOrb: "#C9854A",
      rightRing: "#E0A86A",
      rightCore: "#C9854A",
      text: "#FFFFFF",
      subtext: "#C9854A",
    },
    original: {
      leftOrb: "#A86834",
      rightRing: "#5A121C",
      rightCore: "#5A121C",
      text: "#3D1208",
      subtext: "#A86834",
    },
    gold: {
      leftOrb: "#E0A86A",
      rightRing: "#D4AF37",
      rightCore: "#E0A86A",
      text: "#F5EEDF",
      subtext: "#D4AF37",
    },
    white: {
      leftOrb: "#FFFFFF",
      rightRing: "#FFFFFF",
      rightCore: "#FFFFFF",
      text: "#FFFFFF",
      subtext: "rgba(255,255,255,0.7)",
    },
  }[theme] || {
    leftOrb: "#C9854A",
    rightRing: "#E0A86A",
    rightCore: "#C9854A",
    text: "#FFFFFF",
    subtext: "#C9854A",
  };

  // If raster PNG requested directly
  if (variant === "img") {
    return (
      <div className={`inline-flex items-center gap-3 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <img 
          src="/logo.png" 
          alt="Oxygen Orbis Logo" 
          className={`${className} object-contain`} 
        />
        {(showText || subtext) && (
          <div className="flex flex-col">
            <span className={`font-serif tracking-[0.24em] font-normal leading-tight ${textClassName || 'text-white text-[16px]'}`}>
              OXYGEN ORBIS
            </span>
            {subtext && (
              <span className="text-[8.5px] tracking-[0.36em] text-[#C9854A]/85 uppercase font-light mt-0.5">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pure SVG Emblem Mark (sharp, scalable at any resolution, luxury glow support)
  const EmblemSvg = (
    <svg 
      viewBox="0 0 150 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 drop-shadow-[0_2px_12px_rgba(201,133,74,0.25)]`}
    >
      <defs>
        {/* Mask to carve out right circle from left orb */}
        <mask id={`cutRightOrb-${theme}`}>
          <rect width="150" height="110" fill="white" />
          <circle cx="102" cy="55" r="30.5" fill="black" />
        </mask>
      </defs>

      {/* Left solid orb with concave right edge */}
      <circle 
        cx="48" 
        cy="55" 
        r="30.5" 
        fill={colors.leftOrb} 
        mask={`url(#cutRightOrb-${theme})`} 
      />

      {/* Right outer orbit ring with left opening */}
      <circle 
        cx="102" 
        cy="55" 
        r="26.5" 
        fill="none" 
        stroke={colors.rightRing} 
        strokeWidth="8" 
        strokeDasharray="142 50" 
        strokeDashoffset="-25" 
        strokeLinecap="round"
      />

      {/* Right core planetary orb */}
      <circle 
        cx="102" 
        cy="55" 
        r="14" 
        fill={colors.rightCore} 
      />
    </svg>
  );

  if (!showText && variant !== "full") {
    return EmblemSvg;
  }

  return (
    <div className={`inline-flex items-center gap-3.5 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {EmblemSvg}
      <div className="flex flex-col">
        <span className={`font-serif tracking-[0.24em] font-normal leading-tight ${textClassName || 'text-white text-[16px]'}`}>
          OXYGEN ORBIS
        </span>
        {subtext && (
          <span className="text-[8.5px] tracking-[0.36em] text-[#C9854A]/85 uppercase font-light mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

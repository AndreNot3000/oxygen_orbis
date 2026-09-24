import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Sparkles, X, Music, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../context/AudioContext';

export default function AmbientSoundPlayer() {
  const { 
    isPlaying, 
    isMuted, 
    volume, 
    setVolume, 
    togglePlay, 
    toggleMute, 
    trackInfo, 
    nextTrack,
    autoplayBlocked
  } = useAudio();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Soft welcoming prompt for mobile (Android/iOS) and desktop if autoplay was blocked or delayed
  useEffect(() => {
    if (isPlaying) {
      setShowPrompt(false);
      return;
    }

    const delay = autoplayBlocked ? 800 : 2500;
    const timer = setTimeout(() => {
      try {
        const dismissed = sessionStorage.getItem('oxygen_audio_prompt_dismissed');
        if (!dismissed && !isPlaying) {
          setShowPrompt(true);
        }
      } catch (_) {}
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, autoplayBlocked]);

  const handleDismissPrompt = (e) => {
    e.stopPropagation();
    setShowPrompt(false);
    try {
      sessionStorage.setItem('oxygen_audio_prompt_dismissed', 'true');
    } catch (_) {}
  };

  const handlePlayAndDismiss = () => {
    setShowPrompt(false);
    try {
      sessionStorage.setItem('oxygen_audio_prompt_dismissed', 'true');
    } catch (_) {}
    togglePlay();
  };

  return (
    <aside 
      aria-label="Resort Soundscape"
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start pointer-events-auto select-none font-sans"
    >
      {/* Welcoming Resort Audio Prompt (Mobile & Desktop Responsive) */}
      <AnimatePresence>
        {showPrompt && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 25 }}
            onClick={handlePlayAndDismiss}
            className="mb-2.5 max-w-[calc(100vw-32px)] sm:max-w-[310px] bg-[#1A0C06]/95 backdrop-blur-2xl border border-[#C9854A]/50 rounded-2xl p-3 shadow-[0_12px_36px_rgba(0,0,0,0.8)] text-slate-200 relative overflow-hidden cursor-pointer"
          >
            {/* Ambient Warm Light Orb */}
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#C9854A]/20 rounded-full blur-xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismissPrompt}
              aria-label="Dismiss sound prompt"
              className="absolute top-2 right-2 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-2.5 pr-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9854A] to-[#8C4A20] p-1.5 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Music className="w-4 h-4 text-[#1A0C06]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider block font-serif">
                    Resort Ambience
                  </span>
                  <span className="text-[9px] bg-[#C9854A]/20 text-[#E0A86A] px-1.5 py-0.2 rounded border border-[#C9854A]/30 font-medium">
                    YORUBA
                  </span>
                </div>
                <p className="text-[11px] text-[#E0C8A8] mt-1 leading-snug">
                  Tap anywhere on screen to experience traditional Yoruba talking drum melodies.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#1A0C06] bg-gradient-to-r from-[#C9854A] to-[#E0A86A] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm hover:scale-102 transition-transform">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Tap To Listen</span>
                  </span>
                  <span className="text-[9.5px] text-zinc-400 italic">or tap anywhere</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Glassmorphic Pill */}
      <div 
        className="flex items-center gap-2 sm:gap-2.5 bg-[#1A0C06]/92 backdrop-blur-2xl border border-[#C9854A]/30 hover:border-[#C9854A]/70 rounded-full py-1.5 px-2.5 sm:px-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] transition-all duration-300"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        {/* Play/Pause Gold Button */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause ambient resort music' : 'Play ambient resort music'}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#C9854A] to-[#E0A86A] text-[#1A0C06] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Dynamic Animated Equalizer Bars */}
        <div 
          className="flex items-end gap-[2.5px] h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0 px-0.5 cursor-pointer"
          onClick={togglePlay}
          title={isPlaying ? 'Playing' : 'Paused'}
        >
          <span 
            className={`w-[2px] sm:w-[2.5px] rounded-full bg-[#E0A86A] transition-all duration-300 ${
              isPlaying ? 'animate-soundwave-1' : 'h-1'
            }`} 
          />
          <span 
            className={`w-[2px] sm:w-[2.5px] rounded-full bg-[#C9854A] transition-all duration-300 ${
              isPlaying ? 'animate-soundwave-2' : 'h-1.5'
            }`} 
          />
          <span 
            className={`w-[2px] sm:w-[2.5px] rounded-full bg-[#E0A86A] transition-all duration-300 ${
              isPlaying ? 'animate-soundwave-3' : 'h-1'
            }`} 
          />
          <span 
            className={`w-[2px] sm:w-[2.5px] rounded-full bg-[#C9854A] transition-all duration-300 ${
              isPlaying ? 'animate-soundwave-4' : 'h-2'
            }`} 
          />
        </div>

        {/* Track Title & Mood */}
        <div 
          className="flex flex-col pr-1 cursor-pointer"
          onClick={togglePlay}
        >
          <span className="text-[10px] sm:text-[11px] font-bold text-white font-serif tracking-wide block leading-tight">
            {trackInfo.title}
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#C9A070] leading-tight block truncate max-w-[120px] sm:max-w-[160px]">
            {isPlaying ? trackInfo.subtitle : 'Click to Play Ambient'}
          </span>
        </div>

        {/* Next Track Switcher */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextTrack();
          }}
          aria-label="Next soundscape track"
          title="Switch Track (Yoruba Highlife / Sunset Lounge)"
          className="p-1 rounded-full text-[#C9A070] hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Volume / Mute Controls */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#C9854A]/25">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1 rounded-full text-[#C9A070] hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Expandable Volume Slider */}
          <div 
            className={`transition-all duration-300 overflow-hidden flex items-center ${
              showVolumeSlider ? 'w-14 sm:w-16 opacity-100 ml-1' : 'w-0 opacity-0'
            }`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-14 sm:w-16 h-1 bg-[#321610] rounded-lg appearance-none cursor-pointer accent-[#C9854A]"
              aria-label="Volume slider"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

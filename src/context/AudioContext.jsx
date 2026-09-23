import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TRACK_INFO } from '../services/audioService.js';

export { TRACK_INFO };

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem('oxygen_audio_volume');
      return saved !== null ? parseFloat(saved) : 0.45;
    } catch (_) {
      return 0.45;
    }
  });

  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  // Initialize single audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.src = TRACK_INFO.src;
    audio.loop = true;
    audio.preload = 'none'; // Zero bandwidth used until user initiates playback
    audio.volume = volume;
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      // If local asset fails, gracefully fallback to remote archive URL
      if (audio.src !== TRACK_INFO.fallbackSrc && !audio.src.includes(TRACK_INFO.fallbackSrc)) {
        audio.src = TRACK_INFO.fallbackSrc;
        if (isPlaying) {
          audio.play().catch(() => setIsPlaying(false));
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume when user changes slider
  const setVolume = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    try {
      localStorage.setItem('oxygen_audio_volume', clamped.toString());
    } catch (_) {}

    if (audioRef.current && !fadeIntervalRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  // Smooth fade-in and play
  const playWithFade = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const targetVol = isMuted ? 0 : volume;
    audio.volume = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          // 800ms fade-in ramp
          const steps = 16;
          const stepTime = 800 / steps;
          const volIncrement = targetVol / steps;
          let currentStep = 0;

          fadeIntervalRef.current = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
              audio.volume = targetVol;
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            } else {
              audio.volume = Math.min(targetVol, currentStep * volIncrement);
            }
          }, stepTime);
        })
        .catch((err) => {
          console.warn('Audio play request interrupted or prevented by browser:', err);
          setIsPlaying(false);
        });
    }
  };

  // Smooth fade-out and pause
  const pauseWithFade = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVol = audio.volume;
    const steps = 10;
    const stepTime = 400 / steps;
    const volDecrement = startVol / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.pause();
        audio.volume = isMuted ? 0 : volume;
        setIsPlaying(false);
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audio.volume = Math.max(0, startVol - currentStep * volDecrement);
      }
    }, stepTime);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseWithFade();
    } else {
      playWithFade();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        setVolume,
        togglePlay,
        toggleMute,
        trackInfo: TRACK_INFO,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

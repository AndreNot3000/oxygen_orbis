import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TRACKS_PLAYLIST, TRACK_INFO } from '../services/audioService.js';

export { TRACKS_PLAYLIST, TRACK_INFO };

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack = TRACKS_PLAYLIST[currentTrackIndex] || TRACKS_PLAYLIST[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('oxygen_audio_muted') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem('oxygen_audio_volume');
      return saved !== null ? parseFloat(saved) : 0.45;
    } catch (_) {
      return 0.45;
    }
  });

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Helper to start audio safely
  const startAudio = () => {
    const audio = audioRef.current;
    if (!audio) return Promise.reject(new Error('Audio element not initialized'));
    audio.muted = false;
    audio.volume = isMuted ? 0 : volume;
    return audio.play();
  };

  // Initialize single audio instance and persistent activation listeners
  useEffect(() => {
    const audio = new Audio();
    audio.src = currentTrack.src;
    audio.loop = true;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleEnded = () => {
      nextTrack();
    };

    const handleError = () => {
      if (audio.src !== currentTrack.fallbackSrc && !audio.src.includes(currentTrack.fallbackSrc)) {
        audio.src = currentTrack.fallbackSrc;
        if (isPlaying) {
          audio.play().catch(() => setIsPlaying(false));
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // PERSISTENT TOUCH & GESTURE ACTIVATION (Crucial for Android Chrome & mobile browsers):
    // Chrome on Android strictly blocks unmuted autoplay on load with NotAllowedError.
    // It requires a direct transient user activation (touchend, pointerup, click, keydown).
    const GESTURE_EVENTS = ['click', 'touchend', 'pointerup', 'keydown'];

    const handleUserGesture = () => {
      if (hasStartedRef.current) return;
      startAudio()
        .then(() => {
          hasStartedRef.current = true;
          setIsPlaying(true);
          setAutoplayBlocked(false);
          detachListeners();
        })
        .catch((err) => {
          // If aborted (e.g. during a scroll drag), DO NOT remove listeners!
          // The next tap or click anywhere on the page will seamlessly retry and succeed.
          console.debug('Audio unlock waiting for tap gesture:', err);
        });
    };

    const attachListeners = () => {
      GESTURE_EVENTS.forEach((evt) => {
        window.addEventListener(evt, handleUserGesture, { capture: true, passive: true });
      });
    };

    const detachListeners = () => {
      GESTURE_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleUserGesture, { capture: true });
      });
    };

    // 1. Attempt immediate unmuted autoplay on load
    // (Succeeds on iOS Safari with navigation gesture, WebViews, and high-MEI desktop browsers)
    startAudio()
      .then(() => {
        hasStartedRef.current = true;
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        // Autoplay blocked by browser policy (e.g. Android Chrome)
        console.debug('Initial autoplay restricted by browser policy; awaiting guest tap:', err);
        setIsPlaying(false);
        setAutoplayBlocked(true);
        // Attach persistent capture listeners so the very first tap anywhere on the screen starts sound!
        attachListeners();
      });

    return () => {
      detachListeners();
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync audio source when track changes
  const switchTrack = (index) => {
    const nextIdx = (index + TRACKS_PLAYLIST.length) % TRACKS_PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    const track = TRACKS_PLAYLIST[nextIdx];

    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.src = track.src;
      audioRef.current.currentTime = 0;
      if (wasPlaying) {
        playWithFade();
      }
    }
  };

  const nextTrack = () => switchTrack(currentTrackIndex + 1);
  const prevTrack = () => switchTrack(currentTrackIndex - 1);

  const rampVolumeUp = (targetVol) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const steps = 16;
    const stepTime = 800 / steps;
    const volIncrement = targetVol / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps || !audioRef.current) {
        if (audioRef.current) audioRef.current.volume = targetVol;
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audioRef.current.volume = Math.min(targetVol, currentStep * volIncrement);
      }
    }, stepTime);
  };

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
          rampVolumeUp(targetVol);
        })
        .catch((err) => {
          console.warn('Audio play request prevented by browser:', err);
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
      if (currentStep >= steps || !audioRef.current) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.volume = isMuted ? 0 : volume;
        }
        setIsPlaying(false);
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      } else {
        audioRef.current.volume = Math.max(0, startVol - currentStep * volDecrement);
      }
    }, stepTime);
  };

  const togglePlay = () => {
    hasStartedRef.current = true;
    setAutoplayBlocked(false);
    if (isPlaying) {
      pauseWithFade();
    } else {
      playWithFade();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem('oxygen_audio_muted', nextMuted.toString());
    } catch (_) {}

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
        startAudio,
        autoplayBlocked,
        trackInfo: currentTrack,
        playlist: TRACKS_PLAYLIST,
        currentTrackIndex,
        nextTrack,
        prevTrack,
        switchTrack,
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

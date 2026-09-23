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

  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const hasInteractedRef = useRef(false);

  // Initialize single audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.src = currentTrack.src;
    audio.loop = true;
    audio.preload = 'auto'; // Preload so it can start immediately when requested
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleEnded = () => {
      // Loop to next track or repeat
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

    // AUTOMATIC PLAYBACK TRIGGER:
    // 1. Attempt immediate unmuted autoplay on open
    const tryAutoplay = () => {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
        const p = audioRef.current.play();
        if (p !== undefined) {
          p.then(() => {
            hasInteractedRef.current = true;
            setIsPlaying(true);
            removeListeners();
          }).catch(() => {
            // If unmuted autoplay blocked by browser policy without prior interaction:
            // Start audio muted immediately so it is already rolling, then unmute on first gesture!
            if (audioRef.current && !isMuted) {
              audioRef.current.muted = true;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(() => {});
            }
          });
        }
      }
    };

    const handleFirstGesture = () => {
      if (hasInteractedRef.current) return;
      hasInteractedRef.current = true;
      if (audioRef.current) {
        audioRef.current.muted = false;
        playWithFade();
      }
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('mousemove', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    // Try immediate autoplay first
    tryAutoplay();

    // In case browser policy restricts audio until gesture, trigger on first touch, mousemove, or scroll!
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('scroll', handleFirstGesture, { passive: true });
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('mousemove', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });

    return () => {
      removeListeners();
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
    hasInteractedRef.current = true;
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

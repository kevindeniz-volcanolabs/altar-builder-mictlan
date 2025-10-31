import { useEffect, useCallback, useRef } from 'react';
import { getAudioEngine, isAudioSupported } from '../utils/audio-engine';
import type { AudioTrack } from '../utils/audio-engine';
import { useAltarStore } from '../store/useAltarStore';

/**
 * Hook for managing audio in the application
 */
export function useAudio() {
  const audioEngine = useRef(getAudioEngine()).current;
  const settings = useAltarStore(state => state.settings);
  const initialized = useRef(false);

  // Initialize audio engine
  useEffect(() => {
    if (!settings.audioEnabled || initialized.current || !isAudioSupported()) {
      return;
    }

    const init = async () => {
      try {
        await audioEngine.init();
        initialized.current = true;

        // Set volumes from settings
        audioEngine.setMasterVolume(settings.volume);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    init();
  }, [settings.audioEnabled, settings.volume, audioEngine]);

  // Play audio track
  const play = useCallback(async (track: AudioTrack) => {
    if (!settings.audioEnabled || !isAudioSupported()) {
      return;
    }

    try {
      if (!audioEngine.isInitialized()) {
        await audioEngine.init();
        initialized.current = true;
      }

      await audioEngine.play(track);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }, [settings.audioEnabled, audioEngine]);

  // Stop audio track
  const stop = useCallback((trackId: string, fadeOut?: number) => {
    if (!isAudioSupported()) return;
    audioEngine.stop(trackId, fadeOut);
  }, [audioEngine]);

  // Stop all audio
  const stopAll = useCallback((fadeOut?: number) => {
    if (!isAudioSupported()) return;
    audioEngine.stopAll(fadeOut);
  }, [audioEngine]);

  // Pause all audio
  const pause = useCallback(() => {
    if (!isAudioSupported()) return;
    audioEngine.pause();
  }, [audioEngine]);

  // Resume all audio
  const resume = useCallback(() => {
    if (!isAudioSupported()) return;
    audioEngine.resume();
  }, [audioEngine]);

  // Set master volume
  const setVolume = useCallback((volume: number) => {
    if (!isAudioSupported()) return;
    audioEngine.setMasterVolume(volume);
  }, [audioEngine]);

  return {
    play,
    stop,
    stopAll,
    pause,
    resume,
    setVolume,
    isSupported: isAudioSupported(),
    isInitialized: audioEngine.isInitialized(),
    isPaused: audioEngine.isPaused()
  };
}

/**
 * Hook for playing sound effects
 */
export function useSoundEffects() {
  const { play } = useAudio();
  const settings = useAltarStore(state => state.settings);

  const playSound = useCallback((track: Omit<AudioTrack, 'id'>, id?: string) => {
    if (!settings.audioEnabled) return;

    const soundTrack: AudioTrack = {
      ...track,
      id: id || `sfx-${Date.now()}-${Math.random()}`
    };

    play(soundTrack);
  }, [play, settings.audioEnabled]);

  return { playSound };
}

/**
 * Hook for playing background music
 */
export function useBackgroundMusic() {
  const { play, stop, pause, resume } = useAudio();
  const settings = useAltarStore(state => state.settings);
  const currentTrack = useRef<string | null>(null);

  const playMusic = useCallback(async (track: Omit<AudioTrack, 'id'>, id?: string) => {
    if (!settings.audioEnabled) return;

    const trackId = id || 'background-music';

    // Stop current track if different
    if (currentTrack.current && currentTrack.current !== trackId) {
      stop(currentTrack.current, 2000);
    }

    const musicTrack: AudioTrack = {
      ...track,
      id: trackId,
      loop: true
    };

    await play(musicTrack);
    currentTrack.current = trackId;
  }, [play, stop, settings.audioEnabled]);

  const stopMusic = useCallback((fadeOut = 2000) => {
    if (currentTrack.current) {
      stop(currentTrack.current, fadeOut);
      currentTrack.current = null;
    }
  }, [stop]);

  const pauseMusic = useCallback(() => {
    pause();
  }, [pause]);

  const resumeMusic = useCallback(() => {
    resume();
  }, [resume]);

  return {
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    currentTrack: currentTrack.current
  };
}

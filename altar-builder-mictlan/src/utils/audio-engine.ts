/**
 * Audio Engine for Altar Builder Mictlán
 *
 * Manages background music, sound effects, and audio mixing
 * using the Web Audio API for optimal performance.
 */

/**
 * Audio track types
 */
export type AudioTrackType = 'music' | 'sfx';

/**
 * Audio track definition
 */
export interface AudioTrack {
  id: string;
  type: AudioTrackType;
  url: string;
  volume: number;
  loop: boolean;
  fadeIn?: number; // Fade in duration in ms
  fadeOut?: number; // Fade out duration in ms
}

/**
 * Audio engine configuration
 */
export interface AudioEngineConfig {
  /**
   * Master volume (0-1)
   */
  masterVolume: number;

  /**
   * Music volume (0-1)
   */
  musicVolume: number;

  /**
   * Sound effects volume (0-1)
   */
  sfxVolume: number;

  /**
   * Auto-pause on tab blur
   */
  pauseOnBlur: boolean;

  /**
   * Maximum concurrent sound effects
   */
  maxConcurrentSfx: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AudioEngineConfig = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  pauseOnBlur: true,
  maxConcurrentSfx: 5
};

/**
 * Audio Engine Class
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private tracks: Map<string, AudioBufferSourceNode> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSfx: Set<string> = new Set();

  private config: AudioEngineConfig;
  private initialized = false;
  private paused = false;

  constructor(config: Partial<AudioEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the audio engine
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create gain nodes
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();

      // Connect gain nodes
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      // Set initial volumes
      this.masterGain.gain.value = this.config.masterVolume;
      this.musicGain.gain.value = this.config.musicVolume;
      this.sfxGain.gain.value = this.config.sfxVolume;

      // Setup tab visibility handling
      if (this.config.pauseOnBlur) {
        this.setupVisibilityHandling();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw new Error('Audio engine initialization failed');
    }
  }

  /**
   * Load audio file
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    if (!this.context) {
      throw new Error('Audio engine not initialized');
    }

    // Check if already loaded
    if (this.buffers.has(url)) {
      return this.buffers.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      this.buffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      throw new Error(`Failed to load audio: ${url}`);
    }
  }

  /**
   * Play audio track
   */
  async play(track: AudioTrack): Promise<void> {
    if (!this.context || !this.initialized) {
      await this.init();
    }

    if (!this.context || this.paused) return;

    try {
      // Load audio buffer
      const buffer = await this.loadAudio(track.url);

      // Stop existing track with same ID
      if (this.tracks.has(track.id)) {
        this.stop(track.id);
      }

      // Check SFX limit
      if (track.type === 'sfx' && this.activeSfx.size >= this.config.maxConcurrentSfx) {
        const oldestSfx = Array.from(this.activeSfx)[0];
        this.stop(oldestSfx);
      }

      // Create source node
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = track.loop;

      // Create gain node for individual track volume
      const gainNode = this.context.createGain();
      gainNode.gain.value = track.volume;

      // Connect nodes
      source.connect(gainNode);
      const destination = track.type === 'music' ? this.musicGain! : this.sfxGain!;
      gainNode.connect(destination);

      // Handle fade in
      if (track.fadeIn) {
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          track.volume,
          this.context.currentTime + track.fadeIn / 1000
        );
      }

      // Setup ended callback
      source.onended = () => {
        this.tracks.delete(track.id);
        this.activeSfx.delete(track.id);
      };

      // Start playback
      source.start(0);

      // Store track
      this.tracks.set(track.id, source);
      if (track.type === 'sfx') {
        this.activeSfx.add(track.id);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  /**
   * Stop audio track
   */
  stop(trackId: string, fadeOut?: number): void {
    const source = this.tracks.get(trackId);
    if (!source || !this.context) return;

    if (fadeOut) {
      // Fade out before stopping
      const gainNode = source as any; // Type assertion for gain access
      if (gainNode.gain) {
        gainNode.gain.linearRampToValueAtTime(
          0,
          this.context.currentTime + fadeOut / 1000
        );
      }
      setTimeout(() => {
        source.stop();
        this.tracks.delete(trackId);
        this.activeSfx.delete(trackId);
      }, fadeOut);
    } else {
      source.stop();
      this.tracks.delete(trackId);
      this.activeSfx.delete(trackId);
    }
  }

  /**
   * Stop all audio
   */
  stopAll(fadeOut?: number): void {
    Array.from(this.tracks.keys()).forEach(trackId => {
      this.stop(trackId, fadeOut);
    });
  }

  /**
   * Pause all audio
   */
  pause(): void {
    if (!this.context || this.paused) return;

    this.context.suspend();
    this.paused = true;
  }

  /**
   * Resume all audio
   */
  resume(): void {
    if (!this.context || !this.paused) return;

    this.context.resume();
    this.paused = false;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGain) return;
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = this.config.masterVolume;
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    if (!this.musicGain) return;
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicGain.gain.value = this.config.musicVolume;
  }

  /**
   * Set sound effects volume
   */
  setSfxVolume(volume: number): void {
    if (!this.sfxGain) return;
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfxGain.gain.value = this.config.sfxVolume;
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioEngineConfig {
    return { ...this.config };
  }

  /**
   * Check if audio is supported
   */
  isSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get active tracks count
   */
  getActiveTracksCount(): number {
    return this.tracks.size;
  }

  /**
   * Setup tab visibility handling
   */
  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAll();

    if (this.context && this.context.state !== 'closed') {
      this.context.close();
    }

    this.tracks.clear();
    this.buffers.clear();
    this.activeSfx.clear();
    this.initialized = false;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

/**
 * Get audio engine instance
 */
export function getAudioEngine(config?: Partial<AudioEngineConfig>): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine(config);
  }
  return audioEngineInstance;
}

/**
 * Check if audio is supported
 */
export function isAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

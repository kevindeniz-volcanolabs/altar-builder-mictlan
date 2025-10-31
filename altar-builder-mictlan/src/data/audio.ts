import type { AudioTrack } from '../utils/audio-engine';

/**
 * Sound effect definitions
 *
 * Note: Using data URLs or short audio snippets for demo purposes.
 * In production, replace with actual audio files.
 */

/**
 * Background music tracks
 */
export const MUSIC_TRACKS: Record<string, Omit<AudioTrack, 'id'>> = {
  ambient: {
    type: 'music',
    // In production, this would be a path to an audio file
    // For now, using a placeholder URL
    url: '/audio/ambient-music.mp3',
    volume: 0.5,
    loop: true,
    fadeIn: 2000,
    fadeOut: 2000
  }
};

/**
 * Sound effects for element placement
 */
export const SOUND_EFFECTS: Record<string, Omit<AudioTrack, 'id'>> = {
  // Element placement sounds
  placeElement: {
    type: 'sfx',
    url: '/audio/place.mp3',
    volume: 0.6,
    loop: false
  },

  // Element removal sound
  removeElement: {
    type: 'sfx',
    url: '/audio/remove.mp3',
    volume: 0.5,
    loop: false
  },

  // Achievement unlock sound
  achievementUnlock: {
    type: 'sfx',
    url: '/audio/achievement.mp3',
    volume: 0.8,
    loop: false
  },

  // Success sound (save, export, etc.)
  success: {
    type: 'sfx',
    url: '/audio/success.mp3',
    volume: 0.7,
    loop: false
  },

  // Error sound
  error: {
    type: 'sfx',
    url: '/audio/error.mp3',
    volume: 0.6,
    loop: false
  },

  // Button click sound
  click: {
    type: 'sfx',
    url: '/audio/click.mp3',
    volume: 0.4,
    loop: false
  }
};

/**
 * Get sound effect for element type
 */
export function getElementSound(elementType: string): Omit<AudioTrack, 'id'> | null {
  // Different sounds could be assigned based on element type
  // For now, using the same sound for all placements
  return SOUND_EFFECTS.placeElement;
}

/**
 * Audio asset paths (to be created in public/audio directory)
 */
export const AUDIO_ASSETS = {
  music: {
    ambient: '/audio/ambient-music.mp3'
  },
  sfx: {
    place: '/audio/place.mp3',
    remove: '/audio/remove.mp3',
    achievement: '/audio/achievement.mp3',
    success: '/audio/success.mp3',
    error: '/audio/error.mp3',
    click: '/audio/click.mp3'
  }
} as const;

/**
 * Check if audio file exists (for development)
 */
export async function checkAudioAsset(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available audio tracks
 */
export function getAvailableAudioTracks(): {
  music: string[];
  sfx: string[];
} {
  return {
    music: Object.keys(MUSIC_TRACKS),
    sfx: Object.keys(SOUND_EFFECTS)
  };
}

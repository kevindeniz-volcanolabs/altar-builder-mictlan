import { useEffect, useState, useCallback } from 'react';
import { useAltarStore } from '../store/useAltarStore';
import type { Achievement } from '../types';

/**
 * Hook for managing achievement unlock notifications
 */
export function useAchievementNotifications() {
  const [queuedAchievements, setQueuedAchievements] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const achievements = useAltarStore(state => state.achievements.unlocked);

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      a => a.unlocked && a.unlockedAt && !isAchievementShown(a.id)
    );

    if (newlyUnlocked.length > 0) {
      setQueuedAchievements(prev => [...prev, ...newlyUnlocked]);
      newlyUnlocked.forEach(a => markAchievementAsShown(a.id));
    }
  }, [achievements]);

  // Display achievements from queue
  useEffect(() => {
    if (currentAchievement === null && queuedAchievements.length > 0) {
      const [next, ...rest] = queuedAchievements;
      setCurrentAchievement(next);
      setQueuedAchievements(rest);
    }
  }, [currentAchievement, queuedAchievements]);

  const dismissCurrentAchievement = useCallback(() => {
    setCurrentAchievement(null);
  }, []);

  return {
    currentAchievement,
    dismissCurrentAchievement,
    hasQueuedAchievements: queuedAchievements.length > 0
  };
}

/**
 * Track which achievements have been shown to avoid duplicates
 */
const shownAchievements = new Set<string>();

function isAchievementShown(achievementId: string): boolean {
  return shownAchievements.has(achievementId);
}

function markAchievementAsShown(achievementId: string): void {
  shownAchievements.add(achievementId);
}

/**
 * Clear shown achievements (useful for testing)
 */
export function clearShownAchievements(): void {
  shownAchievements.clear();
}

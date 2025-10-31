import { useEffect, useCallback, useState } from 'react';
import { useAltarStore } from '../store/useAltarStore';
import {
  getAnimationEngine,
  getAnimationClasses,
  shouldReduceMotion,
  type AnimationConfig
} from '../utils/animation-engine';
import type { PlacedElement } from '../types';

/**
 * Hook for managing element animations
 */
export function useAnimations() {
  const animationsEnabled = useAltarStore(state => state.settings.animationsEnabled);
  const placedElements = useAltarStore(state => state.grid.placedElements);
  const [engine] = useState(() => getAnimationEngine());

  // Enable/disable animations based on settings
  useEffect(() => {
    const shouldDisable = !animationsEnabled || shouldReduceMotion();
    engine.setEnabled(!shouldDisable);
  }, [animationsEnabled, engine]);

  // Add animations for newly placed elements
  useEffect(() => {
    if (!animationsEnabled || shouldReduceMotion()) return;

    placedElements.forEach((element) => {
      // Check if element already has animation
      if (!engine.getAnimation(element.id)) {
        // Add default animation based on element type
        const config = getDefaultAnimationConfig(element.elementType);
        if (config) {
          engine.addAnimation(element.id, config);
        }
      }
    });

    // Clean up animations for removed elements
    const elementIds = new Set(placedElements.map(el => el.id));
    engine.getAllAnimations().forEach(animation => {
      if (!elementIds.has(animation.elementId)) {
        engine.removeAnimation(animation.elementId);
      }
    });
  }, [placedElements, animationsEnabled, engine]);

  const getElementAnimationClass = useCallback((elementId: string): string => {
    const element = placedElements.find(el => el.id === elementId);
    if (!element) return '';

    return getAnimationClasses({ type: element.elementType } as any);
  }, [placedElements]);

  const addAnimation = useCallback((elementId: string, config: AnimationConfig) => {
    return engine.addAnimation(elementId, config);
  }, [engine]);

  const removeAnimation = useCallback((elementId: string) => {
    engine.removeAnimation(elementId);
  }, [engine]);

  const pauseAnimation = useCallback((elementId: string) => {
    engine.pauseAnimation(elementId);
  }, [engine]);

  const resumeAnimation = useCallback((elementId: string) => {
    engine.resumeAnimation(elementId);
  }, [engine]);

  return {
    getElementAnimationClass,
    addAnimation,
    removeAnimation,
    pauseAnimation,
    resumeAnimation,
    fps: engine.getFPS(),
    animationCount: engine.getAnimationCount(),
    maxConcurrent: engine.getMaxConcurrent()
  };
}

/**
 * Get default animation configuration for element type
 */
function getDefaultAnimationConfig(elementType: string): AnimationConfig | null {
  switch (elementType) {
    case 'vela':
      return {
        type: 'flicker' as any,
        duration: 3000,
        loop: true,
        intensity: 0.8
      };
    case 'flor':
    case 'papel_picado':
      return {
        type: 'sway' as any,
        duration: 4000,
        loop: true,
        intensity: 0.5
      };
    case 'calavera':
      return {
        type: 'glow' as any,
        duration: 2000,
        loop: true,
        intensity: 0.6
      };
    default:
      return null;
  }
}

/**
 * Hook for animation performance monitoring
 */
export function useAnimationPerformance() {
  const [fps, setFps] = useState(60);
  const [animationCount, setAnimationCount] = useState(0);
  const engine = getAnimationEngine();

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(engine.getFPS());
      setAnimationCount(engine.getAnimationCount());
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  return {
    fps,
    animationCount,
    maxConcurrent: engine.getMaxConcurrent(),
    isPerformanceGood: fps >= 30
  };
}

/**
 * Hook for triggering entrance animations on element placement
 */
export function useElementPlacementAnimation() {
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set());

  const triggerPlacementAnimation = useCallback((elementId: string) => {
    setAnimatingElements(prev => new Set(prev).add(elementId));

    // Remove animation class after animation completes
    setTimeout(() => {
      setAnimatingElements(prev => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
    }, 600); // Match bounce-in animation duration
  }, []);

  const hasPlacementAnimation = useCallback((elementId: string) => {
    return animatingElements.has(elementId);
  }, [animatingElements]);

  return {
    triggerPlacementAnimation,
    hasPlacementAnimation
  };
}

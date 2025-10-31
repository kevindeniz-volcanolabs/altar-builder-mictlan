import type { AnimationType, OfrendarElement, PlacedElement } from '../types';

/**
 * Animation Engine for managing element animations
 */

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay?: number;
  intensity?: number;
  loop?: boolean;
}

export interface ActiveAnimation {
  elementId: string;
  config: AnimationConfig;
  startTime: number;
  isPaused: boolean;
}

export class AnimationEngine {
  private activeAnimations: Map<string, ActiveAnimation> = new Map();
  private maxConcurrentAnimations = 10;
  private performanceThreshold = 30; // FPS threshold
  private lastFrameTime = 0;
  private frameCount = 0;
  private currentFPS = 60;
  private isEnabled = true;

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrentAnimations = maxConcurrent;
    this.startPerformanceMonitoring();
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime >= lastTime + 1000) {
        this.currentFPS = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;

        // Auto-adjust animation count based on performance
        if (this.currentFPS < this.performanceThreshold) {
          this.maxConcurrentAnimations = Math.max(3, this.maxConcurrentAnimations - 1);
          console.warn(`Low FPS (${this.currentFPS}), reducing max animations to ${this.maxConcurrentAnimations}`);
        } else if (this.currentFPS > 55 && this.maxConcurrentAnimations < 10) {
          this.maxConcurrentAnimations = Math.min(10, this.maxConcurrentAnimations + 1);
        }
      }

      if (this.isEnabled) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Add animation for an element
   */
  addAnimation(elementId: string, config: AnimationConfig): boolean {
    if (!this.isEnabled) return false;

    // Check if we've reached max concurrent animations
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      // Remove oldest animation if at limit
      const oldestKey = Array.from(this.activeAnimations.keys())[0];
      this.removeAnimation(oldestKey);
    }

    const animation: ActiveAnimation = {
      elementId,
      config,
      startTime: performance.now(),
      isPaused: false
    };

    this.activeAnimations.set(elementId, animation);
    return true;
  }

  /**
   * Remove animation for an element
   */
  removeAnimation(elementId: string): void {
    this.activeAnimations.delete(elementId);
  }

  /**
   * Pause animation for an element
   */
  pauseAnimation(elementId: string): void {
    const animation = this.activeAnimations.get(elementId);
    if (animation) {
      animation.isPaused = true;
    }
  }

  /**
   * Resume animation for an element
   */
  resumeAnimation(elementId: string): void {
    const animation = this.activeAnimations.get(elementId);
    if (animation) {
      animation.isPaused = false;
    }
  }

  /**
   * Get active animation for element
   */
  getAnimation(elementId: string): ActiveAnimation | undefined {
    return this.activeAnimations.get(elementId);
  }

  /**
   * Get all active animations
   */
  getAllAnimations(): ActiveAnimation[] {
    return Array.from(this.activeAnimations.values());
  }

  /**
   * Clear all animations
   */
  clearAllAnimations(): void {
    this.activeAnimations.clear();
  }

  /**
   * Enable/disable animations
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearAllAnimations();
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.currentFPS;
  }

  /**
   * Get animation count
   */
  getAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Get max concurrent animations
   */
  getMaxConcurrent(): number {
    return this.maxConcurrentAnimations;
  }

  /**
   * Set max concurrent animations
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrentAnimations = Math.max(1, Math.min(20, max));
  }
}

/**
 * Get CSS animation classes for element type
 */
export function getAnimationClasses(element: OfrendarElement | PlacedElement): string {
  const elementType = 'elementType' in element ? element.elementType : element.type;
  const animations: string[] = [];

  // Map element types to their animations
  switch (elementType) {
    case 'vela':
      animations.push('animate-flicker');
      break;
    case 'flor':
    case 'papel_picado':
      animations.push('animate-sway');
      break;
    case 'calavera':
      animations.push('animate-glow');
      break;
    case 'incienso':
      animations.push('animate-smoke');
      break;
    default:
      break;
  }

  return animations.join(' ');
}

/**
 * Get animation delay based on position (staggered effect)
 */
export function getStaggeredDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}

/**
 * Check if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create singleton instance
 */
let animationEngineInstance: AnimationEngine | null = null;

export function getAnimationEngine(): AnimationEngine {
  if (!animationEngineInstance) {
    animationEngineInstance = new AnimationEngine();
  }
  return animationEngineInstance;
}

/**
 * Destroy animation engine instance
 */
export function destroyAnimationEngine(): void {
  if (animationEngineInstance) {
    animationEngineInstance.setEnabled(false);
    animationEngineInstance = null;
  }
}

/**
 * Lazy-loaded Components Index
 * 
 * This file exports lazy-loaded versions of Level 2 and Level 3 components
 * to enable code splitting and improve initial bundle size.
 */

import { createLazyComponent, analyzeBundleSize } from '../../utils/lazy-loader.tsx'

// Level 2 Components (Catrina Features)

/**
 * Achievements System - Level 2
 */
export const LazyAchievementsModal = createLazyComponent(
  () => {
    analyzeBundleSize('AchievementsModal', () => import('../achievements/AchievementsModal'))
    return import('../achievements/AchievementsModal')
  }
)

export const LazyAchievementToast = createLazyComponent(
  () => import('../achievements/AchievementToast')
)

/**
 * Export and Sharing - Level 2
 */
export const LazyExportModal = createLazyComponent(
  () => {
    analyzeBundleSize('ExportModal', () => import('../export/ExportModal'))
    return import('../export/ExportModal')
  }
)

/**
 * Gallery and Storage - Level 2
 */
export const LazyGalleryModal = createLazyComponent(
  () => {
    analyzeBundleSize('GalleryModal', () => import('../gallery/GalleryModal'))
    return import('../gallery/GalleryModal')
  }
)

export const LazySaveAltarDialog = createLazyComponent(
  () => import('../gallery/SaveAltarDialog')
)

export const LazyStorageManager = createLazyComponent(
  () => import('../gallery/StorageManager')
)

/**
 * Settings - Level 2
 */
export const LazySettingsModal = createLazyComponent(
  () => {
    analyzeBundleSize('SettingsModal', () => import('../settings/SettingsModal'))
    return import('../settings/SettingsModal')
  }
)

// Level 3 Components (Mictlán Features)

/**
 * Collaboration System - Level 3
 */
export const LazyCollaborationModal = createLazyComponent(
  () => {
    analyzeBundleSize('CollaborationModal', () => import('../collaboration/CollaborationModal'))
    return import('../collaboration/CollaborationModal')
  }
)

export const LazyCollaborationStatus = createLazyComponent(
  () => import('../collaboration/CollaborationStatus')
)

export const LazyCollaborativeCursor = createLazyComponent(
  () => import('../collaboration/CollaborativeCursor')
)

/**
 * Mariposas (Steering Behaviors) - Level 3
 */
export const LazyMariposasCanvas = createLazyComponent(
  () => {
    analyzeBundleSize('MariposasCanvas', () => import('../mariposas/MariposasCanvas'))
    return import('../mariposas/MariposasCanvas')
  }
)

/**
 * Accessibility Features - Level 2/3
 */
export const LazyKeyboardHelpModal = createLazyComponent(
  () => import('../accessibility/KeyboardHelpModal')
)

// Engine Lazy Loaders

/**
 * Animation Engine - Level 2
 */
export const lazyLoadAnimationEngine = () => {
  analyzeBundleSize('AnimationEngine', () => import('../../utils/animation-engine'))
  return import('../../utils/animation-engine')
}

/**
 * Audio Engine - Level 2
 */
export const lazyLoadAudioEngine = () => {
  analyzeBundleSize('AudioEngine', () => import('../../utils/audio-engine'))
  return import('../../utils/audio-engine')
}

/**
 * Collaboration Engine - Level 3
 */
export const lazyLoadCollaborationEngine = () => {
  analyzeBundleSize('CollaborationEngine', () => import('../../engines/collaboration'))
  return import('../../engines/collaboration')
}

/**
 * MCP Engine - Level 3
 */
export const lazyLoadMCPEngine = () => {
  analyzeBundleSize('MCPEngine', () => import('../../engines/mcp-engine'))
  return import('../../engines/mcp-engine')
}

/**
 * Steering Behaviors - Level 3
 */
export const lazyLoadSteeringBehaviors = () => {
  analyzeBundleSize('SteeringBehaviors', () => import('../../utils/steering-behaviors'))
  return import('../../utils/steering-behaviors')
}

// Utility Functions

/**
 * Preload Level 2 components
 */
export async function preloadLevel2Components(): Promise<void> {
  const components = [
    LazyAchievementsModal,
    LazyExportModal,
    LazyGalleryModal,
    LazySettingsModal
  ]

  await Promise.all(
    components.map(component => 
      import('../../utils/lazy-loader.tsx').then(({ preloadComponent }) => 
        preloadComponent(component)
      )
    )
  )

  console.log('[LazyLoader] Level 2 components preloaded')
}

/**
 * Preload Level 3 components
 */
export async function preloadLevel3Components(): Promise<void> {
  const components = [
    LazyCollaborationModal,
    LazyMariposasCanvas
  ]

  await Promise.all(
    components.map(component => 
      import('../../utils/lazy-loader.tsx').then(({ preloadComponent }) => 
        preloadComponent(component)
      )
    )
  )

  console.log('[LazyLoader] Level 3 components preloaded')
}

/**
 * Check if Level 2 features should be loaded
 */
export function shouldLoadLevel2(): boolean {
  // Check if user has interacted with Level 1 features
  const hasUsedBasicFeatures = localStorage.getItem('altar_basic_usage') === 'true'
  
  // Or if they've been using the app for more than 5 minutes
  const firstVisit = localStorage.getItem('altar_first_visit')
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  
  return hasUsedBasicFeatures || (firstVisit && parseInt(firstVisit) < fiveMinutesAgo)
}

/**
 * Check if Level 3 features should be loaded
 */
export function shouldLoadLevel3(): boolean {
  // Check if user has used Level 2 features
  const hasUsedLevel2 = localStorage.getItem('altar_level2_usage') === 'true'
  
  // Or if collaboration is explicitly requested
  const collaborationRequested = window.location.search.includes('collaborate=true')
  
  return hasUsedLevel2 || collaborationRequested
}

/**
 * Progressive feature loading based on user interaction
 */
export function initializeProgressiveLoading(): void {
  // Track basic feature usage
  const trackBasicUsage = () => {
    localStorage.setItem('altar_basic_usage', 'true')
    document.removeEventListener('altar:element-placed', trackBasicUsage)
  }
  
  // Track Level 2 feature usage
  const trackLevel2Usage = () => {
    localStorage.setItem('altar_level2_usage', 'true')
    document.removeEventListener('altar:achievement-unlocked', trackLevel2Usage)
  }

  document.addEventListener('altar:element-placed', trackBasicUsage)
  document.addEventListener('altar:achievement-unlocked', trackLevel2Usage)

  // Set first visit timestamp
  if (!localStorage.getItem('altar_first_visit')) {
    localStorage.setItem('altar_first_visit', Date.now().toString())
  }

  // Preload Level 2 after user interaction
  setTimeout(() => {
    if (shouldLoadLevel2()) {
      preloadLevel2Components()
    }
  }, 30000) // 30 seconds after load

  // Preload Level 3 after Level 2 usage
  setTimeout(() => {
    if (shouldLoadLevel3()) {
      preloadLevel3Components()
    }
  }, 60000) // 1 minute after load
}
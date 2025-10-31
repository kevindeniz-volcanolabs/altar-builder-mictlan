/**
 * Constants for Altar Builder Mictlán
 */

// Grid Configuration
export const GRID_CONFIG = {
  MOBILE: { rows: 8, cols: 6 },
  TABLET: { rows: 10, cols: 9 },
  DESKTOP: { rows: 12, cols: 9 },
  CELL_SIZE: 80, // pixels
  GAP: 4, // pixels
} as const

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// Animation Configuration
export const ANIMATION_CONFIG = {
  MAX_CONCURRENT: 10,
  DEBOUNCE_DELAY: 500, // ms
  TRANSITION_DURATION: 200, // ms
  TOAST_DURATION: 3000, // ms
} as const

// Storage Keys
export const STORAGE_KEYS = {
  ALTAR_STATE: 'altar-builder-state',
  USER_SETTINGS: 'altar-builder-settings',
  ACHIEVEMENTS: 'altar-builder-achievements',
  SAVED_ALTARS: 'altar-builder-altars',
} as const

// IndexedDB Configuration
export const INDEXEDDB_CONFIG = {
  DB_NAME: 'AltarBuilderDB',
  DB_VERSION: 1,
  STORES: {
    ALTARS: 'altars',
    ACHIEVEMENTS: 'achievements',
    SETTINGS: 'settings',
    ANALYTICS: 'analytics',
  },
  MAX_STORAGE_MB: 45,
} as const

// Element Limits
export const ELEMENT_LIMITS = {
  VELA: 4,
  RETRATO_PRINCIPAL: 1,
  FOTO: 10,
  FLOR: 15,
  TOTAL_ELEMENTS: 50,
} as const

// Cultural Rules
export const CULTURAL_RULES = {
  REQUIRED_ELEMENTS: ['vela', 'foto', 'ofrenda'],
  VELA_ROWS: [0, 11], // Top and bottom rows only
  RETRATO_POSITION: { row: 0, col: 4 }, // Center of top row
  SYMMETRY_BONUS: 1.2,
  TRADITIONAL_LAYOUT_BONUS: 1.5,
} as const

// Performance Thresholds
export const PERFORMANCE = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  MEMORY_LIMIT_MB: 100,
  BUNDLE_SIZE_LIMIT_KB: 500,
} as const

// Audio Configuration
export const AUDIO_CONFIG = {
  DEFAULT_VOLUME: 0.7,
  FADE_DURATION: 1000, // ms
  MAX_SIMULTANEOUS_SOUNDS: 5,
} as const

// Achievement IDs
export const ACHIEVEMENTS = {
  PRIMER_ALTAR: 'primer-altar',
  COLECCIONISTA: 'coleccionista',
  GUARDIAN_TRADICIONES: 'guardian-tradiciones',
  MAESTRO_SIMETRIA: 'maestro-simetria',
  COLABORADOR: 'colaborador',
} as const

// Error Codes
export const ERROR_CODES = {
  DRAG_INVALID_POSITION: 'DRAG_001',
  DRAG_QUOTA_EXCEEDED: 'DRAG_002',
  STORAGE_QUOTA_FULL: 'STORAGE_001',
  STORAGE_CORRUPTED: 'STORAGE_002',
  NETWORK_OFFLINE: 'NETWORK_001',
  PERFORMANCE_LOW_FPS: 'PERF_001',
  PERFORMANCE_HIGH_MEMORY: 'PERF_002',
} as const

// Default Settings
export const DEFAULT_SETTINGS = {
  animationsEnabled: true,
  audioEnabled: true,
  volume: 0.7,
  theme: 'auto' as const,
  language: 'es' as const,
  reducedMotion: false,
} as const

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  COLLABORATION_SERVER: process.env.VITE_COLLABORATION_SERVER || 'ws://localhost:3001',
  ANALYTICS_ENDPOINT: process.env.VITE_ANALYTICS_ENDPOINT || '',
} as const

// Feature Flags
export const FEATURES = {
  LEVEL_1_ENABLED: true,
  LEVEL_2_ENABLED: true,
  LEVEL_3_ENABLED: true,
  ANALYTICS_ENABLED: false,
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} as const

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  SAVE: 'ctrl+s',
  NEW_ALTAR: 'ctrl+n',
  CLEAR_ALTAR: 'ctrl+shift+c',
  TOGGLE_GRID: 'g',
  TOGGLE_ANIMATIONS: 'a',
  TOGGLE_AUDIO: 'm',
} as const

// ARIA Labels (for accessibility)
export const ARIA_LABELS = {
  GRID_CELL: 'Celda de altar',
  ELEMENT_CARD: 'Elemento de ofrenda',
  DRAG_PREVIEW: 'Vista previa de arrastre',
  CATEGORY_TAB: 'Categoría de elementos',
  ACHIEVEMENT_TOAST: 'Logro desbloqueado',
  LOADING_SPINNER: 'Cargando',
} as const

// Color Palette (matching Tailwind config)
export const COLORS = {
  ALTAR: {
    ORANGE: '#FF6B35',
    PURPLE: '#8B5CF6',
    GOLD: '#F59E0B',
    RED: '#EF4444',
    PINK: '#EC4899',
    YELLOW: '#FDE047',
    GREEN: '#10B981',
    BLUE: '#3B82F6',
  },
  MARIGOLD: {
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
} as const
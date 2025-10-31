// Core Types for Altar Builder Mictlán

export enum ElementType {
  VELA = 'vela',
  FLOR = 'flor',
  FOTO = 'foto',
  RETRATO_PRINCIPAL = 'retrato_principal',
  PAN_DE_MUERTO = 'pan_de_muerto',
  PAPEL_PICADO = 'papel_picado',
  CALAVERA = 'calavera',
  INCIENSO = 'incienso',
  AGUA = 'agua',
  SAL = 'sal',
  COMIDA = 'comida',
  BEBIDA = 'bebida',
  JUGUETE = 'juguete',
  LIBRO = 'libro',
  CRUZ = 'cruz',
  PERSONALES = 'personales'
}

export enum ElementCategory {
  ESENCIALES = 'esenciales',
  DECORATIVOS = 'decorativos',
  OFRENDAS = 'ofrendas',
  PERSONALES = 'personales'
}

export enum AnimationType {
  FLICKER = 'flicker',
  SWAY = 'sway',
  FLUTTER = 'flutter',
  GLOW = 'glow',
  BOUNCE = 'bounce'
}

export enum PerformanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface GridDimensions {
  rows: number;
  cols: number;
}

export interface PlacementRule {
  type: 'maxQuantity' | 'rowRestriction' | 'columnRestriction' | 'proximity' | 'stacking';
  value: number | string | GridPosition[];
  message: string;
}

export interface AnimationDefinition {
  type: AnimationType;
  duration: number;
  easing: string;
  loop: boolean;
}

export interface AnimationConfig extends AnimationDefinition {
  performance: PerformanceLevel;
}

export interface OfrendarElement {
  id: string;
  name: string;
  type: ElementType;
  category: ElementCategory;
  icon: string;
  maxQuantity: number;
  placementRules: PlacementRule[];
  animations?: AnimationDefinition[];
  soundEffect?: string;
  description: string;
}

export interface PlacedElement {
  id: string;
  elementType: ElementType;
  position: GridPosition;
  layer?: number;
  animations?: AnimationConfig[];
  placedAt: Date;
}

export interface DragPreview {
  element: OfrendarElement;
  position: { x: number; y: number };
  isValid: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: GridPosition[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward?: AchievementReward;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface AchievementCondition {
  type: 'elementCount' | 'altarCount' | 'composition' | 'time' | 'collaboration';
  target: number | string;
  current: number;
}

export interface AchievementReward {
  type: 'element' | 'theme' | 'animation';
  value: string;
}

export interface SavedAltar {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string; // Base64 encoded image
  elements: PlacedElement[];
  metadata: {
    score: number;
    completionLevel: number;
    culturalAuthenticity: number;
    collaborators?: string[];
  };
  version: string;
}

export interface UserSettings {
  animationsEnabled: boolean;
  audioEnabled: boolean;
  volume: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  reducedMotion: boolean;
}

// Component Props Interfaces
export interface GridWorkspaceProps {
  dimensions: GridDimensions;
  elements: PlacedElement[];
  onElementPlace: (element: OfrendarElement, position: GridPosition) => void;
  onElementRemove: (elementId: string) => void;
  isCollaborative?: boolean;
}

export interface ElementPanelProps {
  elements: OfrendarElement[];
  categories: ElementCategory[];
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  onElementDrag: (element: OfrendarElement) => void;
}

// Engine Interfaces
export interface DragDropEngine {
  startDrag(element: OfrendarElement, sourcePosition?: GridPosition): void;
  updateDrag(position: { x: number; y: number }): void;
  endDrag(targetPosition?: GridPosition): boolean;
  validateDrop(element: OfrendarElement, position: GridPosition): ValidationResult;
}

export interface AnimationEngine {
  registerAnimation(elementId: string, animation: AnimationConfig): void;
  startAnimation(elementId: string, animationType: AnimationType): void;
  stopAnimation(elementId: string): void;
  pauseAllAnimations(): void;
  resumeAllAnimations(): void;
  getActiveAnimationCount(): number;
}

// State Management Types
export interface AltarBuilderState {
  // Grid and Elements
  grid: {
    dimensions: GridDimensions;
    placedElements: Map<string, PlacedElement>;
  };
  
  // Available Elements
  elements: {
    available: OfrendarElement[];
    categories: ElementCategory[];
    selectedCategory?: string;
  };
  
  // UI State
  ui: {
    isDragging: boolean;
    dragPreview?: DragPreview;
    selectedElement?: string;
    showAchievements: boolean;
    isOffline: boolean;
    loading: boolean;
  };
  
  // Settings
  settings: UserSettings;
  
  // Achievements
  achievements: {
    unlocked: Achievement[];
    progress: Map<string, number>;
  };
  
  // Actions
  actions: {
    // Grid Actions
    placeElement: (element: OfrendarElement, position: GridPosition) => void;
    removeElement: (elementId: string) => void;
    clearAltar: () => void;
    
    // Element Actions
    selectCategory: (category: string) => void;
    
    // UI Actions
    setDragPreview: (preview?: DragPreview) => void;
    setLoading: (loading: boolean) => void;
    
    // Settings Actions
    updateSettings: (settings: Partial<UserSettings>) => void;
    
    // Achievement Actions
    unlockAchievement: (achievementId: string) => void;
    updateProgress: (type: string, value: number) => void;
  };
}

// Error Types
export interface AppError {
  type: 'drag' | 'persistence' | 'performance' | 'network';
  message: string;
  code?: string;
  details?: unknown;
}

export interface ErrorHandler {
  handleError: (error: AppError) => void;
  retry: (maxAttempts: number) => Promise<void>;
  fallback: (alternativeAction: () => void) => void;
}

// Collaboration Types (Level 3)
export interface CollaborationPeer {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  isConnected: boolean;
  lastSeen: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  gridPosition?: GridPosition;
  elementId?: string;
}

export interface CollaborationState {
  roomId?: string;
  isHost: boolean;
  peers: Map<string, CollaborationPeer>;
  cursors: Map<string, CursorPosition>;
  isConnected: boolean;
  connectionType: 'webrtc' | 'websocket' | 'offline';
}

export interface CollaborationAction {
  type: 'element_place' | 'element_remove' | 'cursor_move' | 'peer_join' | 'peer_leave';
  peerId: string;
  timestamp: number;
  data: any;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  maxRetries: number;
  connectionTimeout: number;
}

export interface CollaborationEngine {
  createRoom(): Promise<string>;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(): void;
  sendAction(action: CollaborationAction): void;
  onAction(callback: (action: CollaborationAction) => void): void;
  onPeerConnect(callback: (peer: CollaborationPeer) => void): void;
  onPeerDisconnect(callback: (peerId: string) => void): void;
}

// Re-export MCP types
export * from './mcp';
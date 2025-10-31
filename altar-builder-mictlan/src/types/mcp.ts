// Kiro MCP (Model Context Protocol) Types for Altar Builder Mictlán

import type {
  OfrendarElement,
  PlacedElement,
  GridPosition,
  UserSettings,
  Achievement,
  SavedAltar,
  GridDimensions
} from './index';

// MCP Action Types
export type MCPActionType = 
  // Altar Actions
  | 'placeElement'
  | 'removeElement'
  | 'clearAltar'
  | 'validateComposition'
  | 'restoreAltar'
  // User Actions
  | 'updateSettings'
  | 'unlockAchievement'
  | 'saveProgress'
  | 'resetSession'
  // Collaboration Actions
  | 'joinRoom'
  | 'leaveRoom'
  | 'syncState'
  | 'broadcastCursor'
  // Steering Actions
  | 'spawnMariposa'
  | 'updateBehavior'
  | 'optimizePerformance';

// MCP State Interfaces
export interface AltarState {
  dimensions: GridDimensions;
  placedElements: PlacedElement[];
  lastModified: Date;
  version: number;
}

export interface UserState {
  settings: UserSettings;
  achievements: Achievement[];
  progress: Map<string, number>;
  sessionData: {
    startTime: Date;
    altarCount: number;
    uniqueElementsUsed: Set<string>;
  };
}

export interface CollaborationState {
  roomId?: string;
  peers: CollaborationPeer[];
  cursors: Map<string, CursorPosition>;
  isHost: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface SteeringState {
  mariposas: Mariposa[];
  behaviorSettings: {
    wanderStrength: number;
    fleeDistance: number;
    separationDistance: number;
    maxSpeed: number;
  };
  performanceMetrics: {
    fps: number;
    activeCount: number;
    maxCount: number;
  };
}

// MCP Action Payloads
export interface MCPAction<T = any> {
  type: MCPActionType;
  payload: T;
  timestamp: Date;
  id: string;
  source: 'local' | 'remote';
}

export interface PlaceElementPayload {
  element: OfrendarElement;
  position: GridPosition;
  userId?: string;
}

export interface RemoveElementPayload {
  elementId: string;
  userId?: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<UserSettings>;
  userId?: string;
}

export interface UnlockAchievementPayload {
  achievementId: string;
  timestamp: Date;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  userName?: string;
}

export interface SyncStatePayload {
  altarState: AltarState;
  userState: Partial<UserState>;
  timestamp: Date;
}

export interface BroadcastCursorPayload {
  userId: string;
  position: { x: number; y: number };
  action?: 'drag' | 'hover' | 'click';
}

// MCP Module Interfaces
export interface MCPModule<TState = any, TActions = any> {
  name: string;
  state: TState;
  actions: TActions;
  reducer: (state: TState, action: MCPAction) => TState;
  middleware?: MCPMiddleware[];
}

export interface AltarMCPModule extends MCPModule<AltarState, AltarActions> {
  name: 'altar';
}

export interface UserMCPModule extends MCPModule<UserState, UserActions> {
  name: 'user';
}

export interface CollaborationMCPModule extends MCPModule<CollaborationState, CollaborationActions> {
  name: 'collaboration';
}

export interface SteeringMCPModule extends MCPModule<SteeringState, SteeringActions> {
  name: 'steering';
}

// MCP Action Interfaces
export interface AltarActions {
  placeElement: (payload: PlaceElementPayload) => MCPAction<PlaceElementPayload>;
  removeElement: (payload: RemoveElementPayload) => MCPAction<RemoveElementPayload>;
  clearAltar: () => MCPAction<{}>;
  validateComposition: (elements: PlacedElement[]) => MCPAction<{ elements: PlacedElement[] }>;
  restoreAltar: (elements: PlacedElement[]) => MCPAction<{ elements: PlacedElement[] }>;
}

export interface UserActions {
  updateSettings: (payload: UpdateSettingsPayload) => MCPAction<UpdateSettingsPayload>;
  unlockAchievement: (payload: UnlockAchievementPayload) => MCPAction<UnlockAchievementPayload>;
  saveProgress: (progress: Map<string, number>) => MCPAction<{ progress: Map<string, number> }>;
  resetSession: () => MCPAction<{}>;
}

export interface CollaborationActions {
  joinRoom: (payload: JoinRoomPayload) => MCPAction<JoinRoomPayload>;
  leaveRoom: (roomId: string) => MCPAction<{ roomId: string }>;
  syncState: (payload: SyncStatePayload) => MCPAction<SyncStatePayload>;
  broadcastCursor: (payload: BroadcastCursorPayload) => MCPAction<BroadcastCursorPayload>;
}

export interface SteeringActions {
  spawnMariposa: (count: number) => MCPAction<{ count: number }>;
  updateBehavior: (settings: Partial<SteeringState['behaviorSettings']>) => MCPAction<{ settings: Partial<SteeringState['behaviorSettings']> }>;
  optimizePerformance: (metrics: SteeringState['performanceMetrics']) => MCPAction<{ metrics: SteeringState['performanceMetrics'] }>;
}

// MCP Core Interfaces
export interface MCPEngine {
  modules: Map<string, MCPModule>;
  dispatch: <T>(action: MCPAction<T>) => Promise<void>;
  subscribe: (moduleNames: string[], callback: (state: any) => void) => () => void;
  getState: <T>(moduleName: string) => T;
  registerModule: <T extends MCPModule>(module: T) => void;
  unregisterModule: (moduleName: string) => void;
}

export interface MCPMiddleware {
  name: string;
  execute: <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => Promise<void>;
}

// MCP Bridge Interface for Zustand Integration
export interface MCPZustandBridge {
  syncToMCP: (storeState: any) => void;
  syncFromMCP: (mcpState: any) => void;
  subscribe: () => () => void;
  isConnected: boolean;
}

// Collaboration Types
export interface CollaborationPeer {
  id: string;
  name?: string;
  isHost: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastSeen: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  action?: 'drag' | 'hover' | 'click';
  timestamp: Date;
}

// Steering Behavior Types
export interface Mariposa {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  behavior: 'wander' | 'flee' | 'avoidance' | 'separation';
  target?: { x: number; y: number };
  lastUpdate: Date;
}

// MCP Error Types
export interface MCPError {
  type: 'action_failed' | 'state_sync_error' | 'connection_error' | 'validation_error';
  message: string;
  action?: MCPAction;
  timestamp: Date;
  recoverable: boolean;
}

// MCP Configuration
export interface MCPConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  stateValidation: boolean;
  rollbackOnError: boolean;
  maxRetries: number;
  retryDelay: number;
}

// MCP Performance Metrics
export interface MCPPerformanceMetrics {
  actionCount: number;
  averageActionTime: number;
  stateSize: number;
  memoryUsage: number;
  lastUpdate: Date;
}

// Enhanced Debug and Error Handling Types
export interface MCPDebugInfo {
  actionId: string;
  actionType: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: MCPError;
  stateSnapshot?: any;
  memoryUsage?: number;
  stackTrace?: string;
}

export interface MCPStateTransition {
  actionId: string;
  moduleName: string;
  previousState: any;
  newState: any;
  timestamp: Date;
  stateDiff?: any;
}

export interface MCPPerformanceAlert {
  type: 'slow_action' | 'high_memory' | 'state_bloat' | 'frequent_errors';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  actionType?: string;
  moduleName?: string;
}
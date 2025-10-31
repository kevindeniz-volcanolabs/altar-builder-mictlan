// MCP-Zustand Bridge for Altar Builder Mictlán
// This bridge synchronizes state between Kiro MCP and Zustand store

import { useAltarStore } from '../store/useAltarStore';
import { mcpEngine } from './mcp-engine';
import type {
  MCPZustandBridge,
  AltarState,
  UserState,
  CollaborationState,
  SteeringState,
  MCPAction
} from '../types/mcp';
import type { PlacedElement, UserSettings, Achievement } from '../types';

class MCPZustandBridgeImpl implements MCPZustandBridge {
  private unsubscribeFunctions: (() => void)[] = [];
  private isInitialized = false;
  private isSyncing = false;

  get isConnected(): boolean {
    return this.isInitialized;
  }

  // Initialize the bridge and set up bidirectional sync
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[MCP Bridge] Already initialized');
      return;
    }

    try {
      // Subscribe to MCP state changes
      const mcpUnsubscribe = mcpEngine.subscribe(
        ['altar', 'user', 'collaboration', 'steering'],
        this.handleMCPStateChange.bind(this)
      );
      this.unsubscribeFunctions.push(mcpUnsubscribe);

      // Subscribe to Zustand store changes
      const zustandUnsubscribe = useAltarStore.subscribe(
        this.handleZustandStateChange.bind(this)
      );
      this.unsubscribeFunctions.push(zustandUnsubscribe);

      // Initial sync from Zustand to MCP
      this.syncToMCP(useAltarStore.getState());

      this.isInitialized = true;
      console.log('[MCP Bridge] Initialized successfully');

    } catch (error) {
      console.error('[MCP Bridge] Initialization failed:', error);
      throw error;
    }
  }

  // Sync Zustand state to MCP
  syncToMCP(storeState: any): void {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      // Sync altar state
      const altarState: AltarState = {
        dimensions: storeState.grid.dimensions,
        placedElements: storeState.grid.placedElements,
        lastModified: new Date(),
        version: 1
      };

      // Sync user state
      const userState: UserState = {
        settings: storeState.settings,
        achievements: storeState.achievements.unlocked,
        progress: storeState.achievements.progress,
        sessionData: {
          startTime: storeState.session.startTime,
          altarCount: storeState.session.altarCount,
          uniqueElementsUsed: storeState.session.uniqueElementsUsed
        }
      };

      // Update MCP modules directly (bypass actions for initial sync)
      const altarModule = mcpEngine.modules.get('altar');
      const userModule = mcpEngine.modules.get('user');

      if (altarModule) {
        altarModule.state = altarState;
      }

      if (userModule) {
        userModule.state = userState;
      }

    } catch (error) {
      console.error('[MCP Bridge] Error syncing to MCP:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync MCP state to Zustand
  syncFromMCP(mcpState: any): void {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      const store = useAltarStore.getState();

      // Sync altar state
      if (mcpState.altar) {
        const altarState = mcpState.altar as AltarState;
        
        // Update grid dimensions if changed
        if (JSON.stringify(store.grid.dimensions) !== JSON.stringify(altarState.dimensions)) {
          store.updateGridDimensions(altarState.dimensions);
        }

        // Update placed elements if changed
        if (JSON.stringify(store.grid.placedElements) !== JSON.stringify(altarState.placedElements)) {
          store.restoreAltar(altarState.placedElements);
        }
      }

      // Sync user state
      if (mcpState.user) {
        const userState = mcpState.user as UserState;
        
        // Update settings if changed
        if (JSON.stringify(store.settings) !== JSON.stringify(userState.settings)) {
          store.updateSettings(userState.settings);
        }

        // Update achievements if changed
        const currentAchievements = store.achievements.unlocked;
        const newAchievements = userState.achievements;
        
        newAchievements.forEach(achievement => {
          const current = currentAchievements.find(a => a.id === achievement.id);
          if (!current?.unlocked && achievement.unlocked) {
            store.unlockAchievement(achievement.id);
          }
        });
      }

    } catch (error) {
      console.error('[MCP Bridge] Error syncing from MCP:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Subscribe to bridge events
  subscribe(): () => void {
    if (!this.isInitialized) {
      this.initialize();
    }

    return () => {
      this.disconnect();
    };
  }

  // Disconnect the bridge
  disconnect(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    console.log('[MCP Bridge] Disconnected');
  }

  // Handle MCP state changes
  private handleMCPStateChange(moduleState: any): void {
    if (this.isSyncing) return;

    console.log('[MCP Bridge] MCP state changed:', moduleState);
    this.syncFromMCP({ [moduleState.moduleName]: moduleState });
  }

  // Handle Zustand state changes
  private handleZustandStateChange(state: any): void {
    if (this.isSyncing) return;

    console.log('[MCP Bridge] Zustand state changed');
    this.syncToMCP(state);
  }

  // Dispatch MCP action from Zustand
  async dispatchMCPAction(action: MCPAction): Promise<void> {
    try {
      await mcpEngine.dispatch(action);
    } catch (error) {
      console.error('[MCP Bridge] Error dispatching MCP action:', error);
      throw error;
    }
  }

  // Get MCP state for a specific module
  getMCPState<T>(moduleName: string): T {
    return mcpEngine.getState<T>(moduleName);
  }

  // Enhanced Zustand actions that work with MCP
  createMCPEnhancedActions() {
    const store = useAltarStore.getState();

    return {
      // Enhanced place element action
      placeElement: async (element: any, position: any) => {
        try {
          // First try local placement
          const success = store.placeElement(element, position);
          
          if (success) {
            // Dispatch to MCP for collaboration sync
            await this.dispatchMCPAction({
              type: 'placeElement',
              payload: { element, position },
              timestamp: new Date(),
              id: `place-${Date.now()}`,
              source: 'local'
            });
          }
          
          return success;
        } catch (error) {
          console.error('[MCP Bridge] Enhanced placeElement failed:', error);
          return false;
        }
      },

      // Enhanced remove element action
      removeElement: async (elementId: string) => {
        try {
          // First remove locally
          store.removeElement(elementId);
          
          // Dispatch to MCP for collaboration sync
          await this.dispatchMCPAction({
            type: 'removeElement',
            payload: { elementId },
            timestamp: new Date(),
            id: `remove-${Date.now()}`,
            source: 'local'
          });
        } catch (error) {
          console.error('[MCP Bridge] Enhanced removeElement failed:', error);
        }
      },

      // Enhanced settings update
      updateSettings: async (settings: Partial<UserSettings>) => {
        try {
          // First update locally
          store.updateSettings(settings);
          
          // Dispatch to MCP
          await this.dispatchMCPAction({
            type: 'updateSettings',
            payload: { settings },
            timestamp: new Date(),
            id: `settings-${Date.now()}`,
            source: 'local'
          });
        } catch (error) {
          console.error('[MCP Bridge] Enhanced updateSettings failed:', error);
        }
      },

      // Enhanced achievement unlock
      unlockAchievement: async (achievementId: string) => {
        try {
          // First unlock locally
          store.unlockAchievement(achievementId);
          
          // Dispatch to MCP
          await this.dispatchMCPAction({
            type: 'unlockAchievement',
            payload: { achievementId, timestamp: new Date() },
            timestamp: new Date(),
            id: `achievement-${Date.now()}`,
            source: 'local'
          });
        } catch (error) {
          console.error('[MCP Bridge] Enhanced unlockAchievement failed:', error);
        }
      }
    };
  }
}

// Create and export the bridge instance
export const mcpZustandBridge = new MCPZustandBridgeImpl();

// Hook for using MCP-enhanced actions in React components
export const useMCPActions = () => {
  return mcpZustandBridge.createMCPEnhancedActions();
};

// Hook for MCP connection status
export const useMCPConnection = () => {
  return {
    isConnected: mcpZustandBridge.isConnected,
    connect: () => mcpZustandBridge.initialize(),
    disconnect: () => mcpZustandBridge.disconnect()
  };
};
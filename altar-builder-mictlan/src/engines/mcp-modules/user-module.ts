// User MCP Module for Altar Builder Mictlán

import type {
  UserMCPModule,
  UserState,
  UserActions,
  MCPAction,
  UpdateSettingsPayload,
  UnlockAchievementPayload
} from '../../types/mcp';
import type { UserSettings, Achievement } from '../../types';
import { ACHIEVEMENTS } from '../../data/achievements';

// Initial user state
const initialUserState: UserState = {
  settings: {
    animationsEnabled: true,
    audioEnabled: false,
    volume: 0.7,
    theme: 'auto',
    language: 'es',
    reducedMotion: false
  },
  achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
  progress: new Map(),
  sessionData: {
    startTime: new Date(),
    altarCount: 0,
    uniqueElementsUsed: new Set()
  }
};

// User actions implementation
const userActions: UserActions = {
  updateSettings: (payload: UpdateSettingsPayload): MCPAction<UpdateSettingsPayload> => ({
    type: 'updateSettings',
    payload,
    timestamp: new Date(),
    id: `settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: payload.userId ? 'remote' : 'local'
  }),

  unlockAchievement: (payload: UnlockAchievementPayload): MCPAction<UnlockAchievementPayload> => ({
    type: 'unlockAchievement',
    payload,
    timestamp: new Date(),
    id: `achievement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  saveProgress: (progress: Map<string, number>): MCPAction<{ progress: Map<string, number> }> => ({
    type: 'saveProgress',
    payload: { progress },
    timestamp: new Date(),
    id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  resetSession: (): MCPAction<{}> => ({
    type: 'resetSession',
    payload: {},
    timestamp: new Date(),
    id: `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  })
};

// User state reducer
const userReducer = (state: UserState, action: MCPAction): UserState => {
  switch (action.type) {
    case 'updateSettings': {
      const { settings } = action.payload as UpdateSettingsPayload;
      
      return {
        ...state,
        settings: {
          ...state.settings,
          ...settings
        }
      };
    }

    case 'unlockAchievement': {
      const { achievementId, timestamp } = action.payload as UnlockAchievementPayload;
      
      const updatedAchievements = state.achievements.map(achievement => 
        achievement.id === achievementId && !achievement.unlocked
          ? { ...achievement, unlocked: true, unlockedAt: timestamp }
          : achievement
      );

      // Check if achievement was actually unlocked (not already unlocked)
      const wasUnlocked = state.achievements.find(a => a.id === achievementId)?.unlocked;
      if (!wasUnlocked) {
        console.log(`[User Module] Achievement unlocked: ${achievementId}`);
      }

      return {
        ...state,
        achievements: updatedAchievements
      };
    }

    case 'saveProgress': {
      const { progress } = action.payload as { progress: Map<string, number> };
      
      return {
        ...state,
        progress: new Map(progress)
      };
    }

    case 'resetSession': {
      return {
        ...state,
        sessionData: {
          startTime: new Date(),
          altarCount: 0,
          uniqueElementsUsed: new Set()
        }
      };
    }

    default:
      console.warn('[User Module] Unknown action type:', action.type);
      return state;
  }
};

// Create and export the user module
export const userModule: UserMCPModule = {
  name: 'user',
  state: initialUserState,
  actions: userActions,
  reducer: userReducer,
  middleware: []
};

// Helper functions for user operations
export const userHelpers = {
  // Get unlocked achievements
  getUnlockedAchievements: (state: UserState): Achievement[] => {
    return state.achievements.filter(a => a.unlocked);
  },

  // Get achievement progress percentage
  getAchievementProgress: (state: UserState): number => {
    const total = state.achievements.length;
    const unlocked = state.achievements.filter(a => a.unlocked).length;
    return total > 0 ? (unlocked / total) * 100 : 0;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: (state: UserState): boolean => {
    return state.settings.reducedMotion || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get effective theme (resolve 'auto' to actual theme)
  getEffectiveTheme: (state: UserState): 'light' | 'dark' => {
    if (state.settings.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.settings.theme as 'light' | 'dark';
  },

  // Check if achievement should be unlocked based on conditions
  checkAchievementConditions: (state: UserState, altarState: any): string[] => {
    const toUnlock: string[] = [];

    state.achievements.forEach(achievement => {
      if (achievement.unlocked) return;

      switch (achievement.condition.type) {
        case 'elementCount':
          if (state.sessionData.uniqueElementsUsed.size >= achievement.condition.target) {
            toUnlock.push(achievement.id);
          }
          break;

        case 'altarCount':
          if (state.sessionData.altarCount >= achievement.condition.target) {
            toUnlock.push(achievement.id);
          }
          break;

        case 'composition':
          // Check specific composition requirements
          if (altarState && userHelpers.checkCompositionRequirement(achievement.id, altarState)) {
            toUnlock.push(achievement.id);
          }
          break;

        case 'time':
          const sessionDuration = Date.now() - state.sessionData.startTime.getTime();
          if (sessionDuration >= achievement.condition.target) {
            toUnlock.push(achievement.id);
          }
          break;
      }
    });

    return toUnlock;
  },

  // Check specific composition requirements for achievements
  checkCompositionRequirement: (achievementId: string, altarState: any): boolean => {
    const { placedElements } = altarState;

    switch (achievementId) {
      case 'primer-altar':
        return placedElements.length >= 5;

      case 'iluminador':
        return placedElements.filter((el: any) => el.elementType === 'vela').length === 4;

      case 'generoso':
        const offerings = placedElements.filter((el: any) => 
          ['pan_de_muerto', 'comida', 'bebida'].includes(el.elementType)
        );
        return offerings.length >= 10;

      case 'explorador':
        const categories = new Set(
          placedElements.map((el: any) => {
            // Map element types to categories
            const categoryMap: Record<string, string> = {
              'vela': 'esenciales',
              'agua': 'esenciales',
              'sal': 'esenciales',
              'flor': 'decorativos',
              'papel_picado': 'decorativos',
              'calavera': 'decorativos',
              'pan_de_muerto': 'ofrendas',
              'comida': 'ofrendas',
              'bebida': 'ofrendas',
              'foto': 'personales',
              'retrato_principal': 'personales',
              'juguete': 'personales'
            };
            return categoryMap[el.elementType] || 'personales';
          })
        );
        return categories.size === 4;

      default:
        return false;
    }
  },

  // Update session data
  updateSessionData: (state: UserState, updates: Partial<UserState['sessionData']>): UserState => {
    return {
      ...state,
      sessionData: {
        ...state.sessionData,
        ...updates
      }
    };
  },

  // Add unique element to session tracking
  addUniqueElement: (state: UserState, elementType: string): UserState => {
    const newSet = new Set(state.sessionData.uniqueElementsUsed);
    newSet.add(elementType);
    
    return userHelpers.updateSessionData(state, {
      uniqueElementsUsed: newSet
    });
  },

  // Increment altar count
  incrementAltarCount: (state: UserState): UserState => {
    return userHelpers.updateSessionData(state, {
      altarCount: state.sessionData.altarCount + 1
    });
  }
};
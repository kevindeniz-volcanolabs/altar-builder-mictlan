import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  OfrendarElement,
  PlacedElement,
  GridPosition,
  GridDimensions,
  UserSettings,
  Achievement,
  DragPreview,
  ElementCategory
} from '../types';
import { OFRENDA_ELEMENTS, getAllCategories } from '../data/elements';
import { ACHIEVEMENTS } from '../data/achievements';
import { getResponsiveGridDimensions } from '../utils/grid-utils';
import { validateElementPlacement } from '../utils/element-validation';

interface AltarBuilderStore {
  // Grid State
  grid: {
    dimensions: GridDimensions;
    placedElements: PlacedElement[];
  };

  // Available Elements
  elements: {
    available: OfrendarElement[];
    categories: ElementCategory[];
    selectedCategory?: ElementCategory;
  };

  // UI State
  ui: {
    isDragging: boolean;
    dragPreview?: DragPreview;
    selectedElementId?: string;
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

  // Session tracking
  session: {
    startTime: Date;
    altarCount: number;
    uniqueElementsUsed: Set<string>;
  };

  // Grid Actions
  placeElement: (element: OfrendarElement, position: GridPosition) => boolean;
  removeElement: (elementId: string) => void;
  clearAltar: () => void;
  updateGridDimensions: (dimensions: GridDimensions) => void;
  restoreAltar: (elements: PlacedElement[]) => void;

  // Element Actions
  selectCategory: (category: ElementCategory | undefined) => void;
  getAvailableElements: () => OfrendarElement[];
  getElementUsageCount: (elementType: string) => number;

  // UI Actions
  setDragPreview: (preview?: DragPreview) => void;
  setDragging: (isDragging: boolean) => void;
  setLoading: (loading: boolean) => void;
  toggleAchievements: () => void;
  setOfflineStatus: (isOffline: boolean) => void;

  // Settings Actions
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Achievement Actions
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: () => void;

  // Session Actions
  incrementAltarCount: () => void;
  resetSession: () => void;
}

const initialSettings: UserSettings = {
  animationsEnabled: true,
  audioEnabled: false,
  volume: 0.7,
  theme: 'auto',
  language: 'es',
  reducedMotion: false
};

export const useAltarStore = create<AltarBuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        grid: {
          dimensions: getResponsiveGridDimensions(window.innerWidth),
          placedElements: []
        },

        elements: {
          available: OFRENDA_ELEMENTS,
          categories: getAllCategories(),
          selectedCategory: undefined
        },

        ui: {
          isDragging: false,
          dragPreview: undefined,
          selectedElementId: undefined,
          showAchievements: false,
          isOffline: false,
          loading: false
        },

        settings: initialSettings,

        achievements: {
          unlocked: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
          progress: new Map()
        },

        session: {
          startTime: new Date(),
          altarCount: 0,
          uniqueElementsUsed: new Set()
        },

        // Grid Actions
        placeElement: (element, position) => {
          const { grid, session } = get();

          // Validate placement
          const validation = validateElementPlacement(
            element,
            position,
            grid.placedElements,
            grid.dimensions
          );

          if (!validation.isValid) {
            console.warn('Invalid placement:', validation.reason);
            return false;
          }

          // Create placed element
          const placedElement: PlacedElement = {
            id: `${element.id}-${Date.now()}`,
            elementType: element.type,
            position,
            placedAt: new Date()
          };

          set(state => ({
            grid: {
              ...state.grid,
              placedElements: [...state.grid.placedElements, placedElement]
            },
            session: {
              ...state.session,
              uniqueElementsUsed: new Set([...session.uniqueElementsUsed, element.type])
            }
          }));

          // Check for achievements
          setTimeout(() => get().checkAchievements(), 100);

          return true;
        },

        removeElement: (elementId) => {
          set(state => ({
            grid: {
              ...state.grid,
              placedElements: state.grid.placedElements.filter(el => el.id !== elementId)
            }
          }));
        },

        clearAltar: () => {
          set(state => ({
            grid: {
              ...state.grid,
              placedElements: []
            }
          }));
        },

        updateGridDimensions: (dimensions) => {
          set(state => ({
            grid: {
              ...state.grid,
              dimensions
            }
          }));
        },

        restoreAltar: (elements) => {
          set(state => ({
            grid: {
              ...state.grid,
              placedElements: elements
            }
          }));
        },

        // Element Actions
        selectCategory: (category) => {
          set(state => ({
            elements: {
              ...state.elements,
              selectedCategory: category
            }
          }));
        },

        getAvailableElements: () => {
          const { elements, grid } = get();
          const { selectedCategory } = elements;

          // Filter by category if selected
          let available = selectedCategory
            ? OFRENDA_ELEMENTS.filter(el => el.category === selectedCategory)
            : OFRENDA_ELEMENTS;

          // Filter out elements that have reached max quantity
          available = available.filter(element => {
            const usageCount = grid.placedElements.filter(
              el => el.elementType === element.type
            ).length;
            return usageCount < element.maxQuantity;
          });

          return available;
        },

        getElementUsageCount: (elementType) => {
          const { grid } = get();
          return grid.placedElements.filter(el => el.elementType === elementType).length;
        },

        // UI Actions
        setDragPreview: (preview) => {
          set(state => ({
            ui: {
              ...state.ui,
              dragPreview: preview,
              isDragging: !!preview
            }
          }));
        },

        setDragging: (isDragging) => {
          set(state => ({
            ui: {
              ...state.ui,
              isDragging
            }
          }));
        },

        setLoading: (loading) => {
          set(state => ({
            ui: {
              ...state.ui,
              loading
            }
          }));
        },

        toggleAchievements: () => {
          set(state => ({
            ui: {
              ...state.ui,
              showAchievements: !state.ui.showAchievements
            }
          }));
        },

        setOfflineStatus: (isOffline) => {
          set(state => ({
            ui: {
              ...state.ui,
              isOffline
            }
          }));
        },

        // Settings Actions
        updateSettings: (newSettings) => {
          set(state => ({
            settings: {
              ...state.settings,
              ...newSettings
            }
          }));
        },

        // Achievement Actions
        unlockAchievement: (achievementId) => {
          set(state => {
            const achievement = state.achievements.unlocked.find(a => a.id === achievementId);
            if (!achievement || achievement.unlocked) {
              return state;
            }

            const updatedAchievements = state.achievements.unlocked.map(a =>
              a.id === achievementId
                ? { ...a, unlocked: true, unlockedAt: new Date() }
                : a
            );

            return {
              achievements: {
                ...state.achievements,
                unlocked: updatedAchievements
              }
            };
          });
        },

        checkAchievements: () => {
          const { grid, session, achievements } = get();
          const { placedElements } = grid;

          // Check "Primer Altar" achievement
          if (placedElements.length >= 5 && !achievements.unlocked.find(a => a.id === 'primer-altar')?.unlocked) {
            get().unlockAchievement('primer-altar');
          }

          // Check "Coleccionista" achievement
          if (session.uniqueElementsUsed.size >= 20 && !achievements.unlocked.find(a => a.id === 'coleccionista')?.unlocked) {
            get().unlockAchievement('coleccionista');
          }

          // Check "Generoso" achievement
          const offeringCount = placedElements.filter(el =>
            ['pan_de_muerto', 'comida', 'bebida'].includes(el.elementType)
          ).length;

          if (offeringCount >= 10 && !achievements.unlocked.find(a => a.id === 'generoso')?.unlocked) {
            get().unlockAchievement('generoso');
          }

          // Check "Iluminador" achievement
          const candleCount = placedElements.filter(el => el.elementType === 'vela').length;
          if (candleCount === 4 && !achievements.unlocked.find(a => a.id === 'iluminador')?.unlocked) {
            get().unlockAchievement('iluminador');
          }

          // Check "Explorador" achievement
          const categories = new Set(
            OFRENDA_ELEMENTS
              .filter(el => placedElements.some(p => p.elementType === el.type))
              .map(el => el.category)
          );

          if (categories.size === 4 && !achievements.unlocked.find(a => a.id === 'explorador')?.unlocked) {
            get().unlockAchievement('explorador');
          }
        },

        // Session Actions
        incrementAltarCount: () => {
          set(state => ({
            session: {
              ...state.session,
              altarCount: state.session.altarCount + 1
            }
          }));

          // Check altar count achievements
          const { session, achievements } = get();
          if (session.altarCount >= 5 && !achievements.unlocked.find(a => a.id === 'guardian-tradiciones')?.unlocked) {
            get().unlockAchievement('guardian-tradiciones');
          }
        },

        resetSession: () => {
          set({
            session: {
              startTime: new Date(),
              altarCount: 0,
              uniqueElementsUsed: new Set()
            }
          });
        }
      }),
      {
        name: 'altar-builder-storage',
        partialize: (state) => ({
          settings: state.settings,
          achievements: {
            unlocked: state.achievements.unlocked,
            progress: Array.from(state.achievements.progress.entries())
          },
          session: {
            ...state.session,
            uniqueElementsUsed: Array.from(state.session.uniqueElementsUsed)
          }
        })
      }
    ),
    { name: 'AltarBuilderStore' }
  )
);

// Selectors for better performance
export const useGridDimensions = () => useAltarStore(state => state.grid.dimensions);
export const usePlacedElements = () => useAltarStore(state => state.grid.placedElements);
export const useAvailableElements = () => useAltarStore(state => state.getAvailableElements());
export const useSettings = () => useAltarStore(state => state.settings);
export const useAchievements = () => useAltarStore(state => state.achievements.unlocked);
export const useIsDragging = () => useAltarStore(state => state.ui.isDragging);
export const useDragPreview = () => useAltarStore(state => state.ui.dragPreview);

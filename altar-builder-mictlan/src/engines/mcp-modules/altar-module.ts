// Altar MCP Module for Altar Builder Mictlán

import type {
  AltarMCPModule,
  AltarState,
  AltarActions,
  MCPAction,
  PlaceElementPayload,
  RemoveElementPayload
} from '../../types/mcp';
import type { PlacedElement, GridDimensions } from '../../types';
import { validateElementPlacement } from '../../utils/element-validation';
import { getResponsiveGridDimensions } from '../../utils/grid-utils';

// Initial altar state
const initialAltarState: AltarState = {
  dimensions: getResponsiveGridDimensions(window.innerWidth),
  placedElements: [],
  lastModified: new Date(),
  version: 1
};

// Altar actions implementation
const altarActions: AltarActions = {
  placeElement: (payload: PlaceElementPayload): MCPAction<PlaceElementPayload> => ({
    type: 'placeElement',
    payload,
    timestamp: new Date(),
    id: `place-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: payload.userId ? 'remote' : 'local'
  }),

  removeElement: (payload: RemoveElementPayload): MCPAction<RemoveElementPayload> => ({
    type: 'removeElement',
    payload,
    timestamp: new Date(),
    id: `remove-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: payload.userId ? 'remote' : 'local'
  }),

  clearAltar: (): MCPAction<{}> => ({
    type: 'clearAltar',
    payload: {},
    timestamp: new Date(),
    id: `clear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  validateComposition: (elements: PlacedElement[]): MCPAction<{ elements: PlacedElement[] }> => ({
    type: 'validateComposition',
    payload: { elements },
    timestamp: new Date(),
    id: `validate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  restoreAltar: (elements: PlacedElement[]): MCPAction<{ elements: PlacedElement[] }> => ({
    type: 'restoreAltar',
    payload: { elements },
    timestamp: new Date(),
    id: `restore-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  })
};

// Altar state reducer
const altarReducer = (state: AltarState, action: MCPAction): AltarState => {
  switch (action.type) {
    case 'placeElement': {
      const { element, position, userId } = action.payload as PlaceElementPayload;
      
      // Validate placement
      const validation = validateElementPlacement(
        element,
        position,
        state.placedElements,
        state.dimensions
      );

      if (!validation.isValid) {
        console.warn('[Altar Module] Invalid placement:', validation.reason);
        return state; // Return unchanged state for invalid placements
      }

      // Create new placed element
      const placedElement: PlacedElement = {
        id: `${element.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        elementType: element.type,
        position,
        placedAt: new Date()
      };

      return {
        ...state,
        placedElements: [...state.placedElements, placedElement],
        lastModified: new Date(),
        version: state.version + 1
      };
    }

    case 'removeElement': {
      const { elementId } = action.payload as RemoveElementPayload;
      
      return {
        ...state,
        placedElements: state.placedElements.filter(el => el.id !== elementId),
        lastModified: new Date(),
        version: state.version + 1
      };
    }

    case 'clearAltar': {
      return {
        ...state,
        placedElements: [],
        lastModified: new Date(),
        version: state.version + 1
      };
    }

    case 'validateComposition': {
      // Composition validation logic can be added here
      // For now, just return the current state
      console.log('[Altar Module] Validating composition with', state.placedElements.length, 'elements');
      return state;
    }

    case 'restoreAltar': {
      const { elements } = action.payload as { elements: PlacedElement[] };
      
      return {
        ...state,
        placedElements: elements,
        lastModified: new Date(),
        version: state.version + 1
      };
    }

    default:
      console.warn('[Altar Module] Unknown action type:', action.type);
      return state;
  }
};

// Create and export the altar module
export const altarModule: AltarMCPModule = {
  name: 'altar',
  state: initialAltarState,
  actions: altarActions,
  reducer: altarReducer,
  middleware: []
};

// Helper functions for altar operations
export const altarHelpers = {
  // Get element count by type
  getElementCount: (state: AltarState, elementType: string): number => {
    return state.placedElements.filter(el => el.elementType === elementType).length;
  },

  // Check if altar is complete (has minimum required elements)
  isAltarComplete: (state: AltarState): boolean => {
    const hasVela = state.placedElements.some(el => el.elementType === 'vela');
    const hasFoto = state.placedElements.some(el => el.elementType === 'foto' || el.elementType === 'retrato_principal');
    const hasOfrenda = state.placedElements.some(el => 
      ['pan_de_muerto', 'comida', 'bebida'].includes(el.elementType)
    );
    
    return hasVela && hasFoto && hasOfrenda;
  },

  // Calculate altar score based on composition
  calculateAltarScore: (state: AltarState): number => {
    let score = 0;
    
    // Base score for having elements
    score += state.placedElements.length * 10;
    
    // Bonus for complete altar
    if (altarHelpers.isAltarComplete(state)) {
      score += 100;
    }
    
    // Bonus for traditional elements
    const traditionalElements = ['vela', 'flor', 'foto', 'pan_de_muerto', 'agua'];
    const traditionalCount = state.placedElements.filter(el => 
      traditionalElements.includes(el.elementType)
    ).length;
    score += traditionalCount * 20;
    
    // Bonus for proper candle placement (top or bottom rows)
    const properCandles = state.placedElements.filter(el => 
      el.elementType === 'vela' && 
      (el.position.row === 0 || el.position.row === state.dimensions.rows - 1)
    ).length;
    score += properCandles * 15;
    
    return Math.max(0, score);
  },

  // Get cultural authenticity rating
  getCulturalAuthenticity: (state: AltarState): number => {
    const requiredElements = ['vela', 'foto', 'flor', 'agua'];
    const presentElements = new Set(state.placedElements.map(el => el.elementType));
    
    const requiredPresent = requiredElements.filter(el => presentElements.has(el)).length;
    const authenticity = (requiredPresent / requiredElements.length) * 100;
    
    // Bonus for having retrato principal in top center
    const retratoInCenter = state.placedElements.some(el => 
      el.elementType === 'retrato_principal' && 
      el.position.row === 0 && 
      el.position.col === Math.floor(state.dimensions.cols / 2)
    );
    
    return Math.min(100, authenticity + (retratoInCenter ? 10 : 0));
  }
};
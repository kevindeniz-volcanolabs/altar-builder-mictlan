// Steering MCP Module for Altar Builder Mictlán

import type {
  SteeringMCPModule,
  SteeringState,
  SteeringActions,
  MCPAction,
  Mariposa
} from '../../types/mcp';

// Initial steering state
const initialSteeringState: SteeringState = {
  mariposas: [],
  behaviorSettings: {
    wanderStrength: 0.5,
    fleeDistance: 100,
    separationDistance: 50,
    maxSpeed: 2
  },
  performanceMetrics: {
    fps: 60,
    activeCount: 0,
    maxCount: 5
  }
};

// Steering actions implementation
const steeringActions: SteeringActions = {
  spawnMariposa: (count: number): MCPAction<{ count: number }> => ({
    type: 'spawnMariposa',
    payload: { count },
    timestamp: new Date(),
    id: `spawn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  updateBehavior: (settings: Partial<SteeringState['behaviorSettings']>): MCPAction<{ settings: Partial<SteeringState['behaviorSettings']> }> => ({
    type: 'updateBehavior',
    payload: { settings },
    timestamp: new Date(),
    id: `behavior-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  optimizePerformance: (metrics: SteeringState['performanceMetrics']): MCPAction<{ metrics: SteeringState['performanceMetrics'] }> => ({
    type: 'optimizePerformance',
    payload: { metrics },
    timestamp: new Date(),
    id: `optimize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  })
};

// Steering state reducer
const steeringReducer = (state: SteeringState, action: MCPAction): SteeringState => {
  switch (action.type) {
    case 'spawnMariposa': {
      const { count } = action.payload as { count: number };
      
      // Don't exceed max count
      const currentCount = state.mariposas.length;
      const spawnCount = Math.min(count, state.performanceMetrics.maxCount - currentCount);
      
      if (spawnCount <= 0) {
        console.warn('[Steering Module] Cannot spawn mariposas: max count reached');
        return state;
      }

      const newMariposas: Mariposa[] = [];
      
      for (let i = 0; i < spawnCount; i++) {
        const mariposa: Mariposa = {
          id: `mariposa-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
          },
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
          },
          behavior: 'wander',
          lastUpdate: new Date()
        };
        newMariposas.push(mariposa);
      }

      return {
        ...state,
        mariposas: [...state.mariposas, ...newMariposas],
        performanceMetrics: {
          ...state.performanceMetrics,
          activeCount: state.mariposas.length + newMariposas.length
        }
      };
    }

    case 'updateBehavior': {
      const { settings } = action.payload as { settings: Partial<SteeringState['behaviorSettings']> };
      
      return {
        ...state,
        behaviorSettings: {
          ...state.behaviorSettings,
          ...settings
        }
      };
    }

    case 'optimizePerformance': {
      const { metrics } = action.payload as { metrics: SteeringState['performanceMetrics'] };
      
      let newState = {
        ...state,
        performanceMetrics: metrics
      };

      // Auto-optimize based on FPS
      if (metrics.fps < 30 && state.mariposas.length > 2) {
        // Remove some mariposas to improve performance
        const removeCount = Math.ceil(state.mariposas.length * 0.3);
        newState.mariposas = state.mariposas.slice(0, -removeCount);
        newState.performanceMetrics.activeCount = newState.mariposas.length;
        
        console.log(`[Steering Module] Performance optimization: removed ${removeCount} mariposas`);
      }

      return newState;
    }

    default:
      console.warn('[Steering Module] Unknown action type:', action.type);
      return state;
  }
};

// Create and export the steering module
export const steeringModule: SteeringMCPModule = {
  name: 'steering',
  state: initialSteeringState,
  actions: steeringActions,
  reducer: steeringReducer,
  middleware: []
};

// Helper functions for steering operations
export const steeringHelpers = {
  // Update mariposa position based on behavior
  updateMariposaPosition: (
    mariposa: Mariposa, 
    behaviorSettings: SteeringState['behaviorSettings'],
    obstacles: { x: number; y: number }[] = [],
    mousePosition?: { x: number; y: number }
  ): Mariposa => {
    const now = new Date();
    const deltaTime = now.getTime() - mariposa.lastUpdate.getTime();
    const dt = Math.min(deltaTime / 16.67, 2); // Cap at 2 frames worth

    let force = { x: 0, y: 0 };

    switch (mariposa.behavior) {
      case 'wander':
        force = steeringHelpers.calculateWanderForce(mariposa, behaviorSettings);
        break;
      
      case 'flee':
        if (mousePosition) {
          force = steeringHelpers.calculateFleeForce(mariposa, mousePosition, behaviorSettings);
        }
        break;
      
      case 'avoidance':
        force = steeringHelpers.calculateAvoidanceForce(mariposa, obstacles, behaviorSettings);
        break;
      
      case 'separation':
        // This would need other mariposas as input
        force = { x: 0, y: 0 };
        break;
    }

    // Apply force to velocity
    const newVelocity = {
      x: mariposa.velocity.x + force.x * dt,
      y: mariposa.velocity.y + force.y * dt
    };

    // Limit speed
    const speed = Math.sqrt(newVelocity.x ** 2 + newVelocity.y ** 2);
    if (speed > behaviorSettings.maxSpeed) {
      newVelocity.x = (newVelocity.x / speed) * behaviorSettings.maxSpeed;
      newVelocity.y = (newVelocity.y / speed) * behaviorSettings.maxSpeed;
    }

    // Update position
    const newPosition = {
      x: mariposa.position.x + newVelocity.x * dt,
      y: mariposa.position.y + newVelocity.y * dt
    };

    // Wrap around screen edges
    if (newPosition.x < 0) newPosition.x = window.innerWidth;
    if (newPosition.x > window.innerWidth) newPosition.x = 0;
    if (newPosition.y < 0) newPosition.y = window.innerHeight;
    if (newPosition.y > window.innerHeight) newPosition.y = 0;

    return {
      ...mariposa,
      position: newPosition,
      velocity: newVelocity,
      lastUpdate: now
    };
  },

  // Calculate wander force
  calculateWanderForce: (
    mariposa: Mariposa, 
    settings: SteeringState['behaviorSettings']
  ): { x: number; y: number } => {
    const wanderAngle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(wanderAngle) * settings.wanderStrength,
      y: Math.sin(wanderAngle) * settings.wanderStrength
    };
  },

  // Calculate flee force
  calculateFleeForce: (
    mariposa: Mariposa,
    target: { x: number; y: number },
    settings: SteeringState['behaviorSettings']
  ): { x: number; y: number } => {
    const dx = mariposa.position.x - target.x;
    const dy = mariposa.position.y - target.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (distance > settings.fleeDistance) {
      return { x: 0, y: 0 };
    }

    const strength = (settings.fleeDistance - distance) / settings.fleeDistance;
    const normalizedX = distance > 0 ? dx / distance : 0;
    const normalizedY = distance > 0 ? dy / distance : 0;

    return {
      x: normalizedX * strength * 2,
      y: normalizedY * strength * 2
    };
  },

  // Calculate avoidance force
  calculateAvoidanceForce: (
    mariposa: Mariposa,
    obstacles: { x: number; y: number }[],
    settings: SteeringState['behaviorSettings']
  ): { x: number; y: number } => {
    let totalForce = { x: 0, y: 0 };

    obstacles.forEach(obstacle => {
      const dx = mariposa.position.x - obstacle.x;
      const dy = mariposa.position.y - obstacle.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance < settings.separationDistance && distance > 0) {
        const strength = (settings.separationDistance - distance) / settings.separationDistance;
        totalForce.x += (dx / distance) * strength;
        totalForce.y += (dy / distance) * strength;
      }
    });

    return totalForce;
  },

  // Update all mariposas in state
  updateAllMariposas: (
    state: SteeringState,
    mousePosition?: { x: number; y: number },
    obstacles: { x: number; y: number }[] = []
  ): SteeringState => {
    const updatedMariposas = state.mariposas.map(mariposa => {
      // Determine behavior based on mouse proximity
      let behavior = mariposa.behavior;
      if (mousePosition) {
        const dx = mariposa.position.x - mousePosition.x;
        const dy = mariposa.position.y - mousePosition.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
        
        if (distance < state.behaviorSettings.fleeDistance) {
          behavior = 'flee';
        } else {
          behavior = 'wander';
        }
      }

      return steeringHelpers.updateMariposaPosition(
        { ...mariposa, behavior },
        state.behaviorSettings,
        obstacles,
        mousePosition
      );
    });

    return {
      ...state,
      mariposas: updatedMariposas
    };
  },

  // Remove mariposa by ID
  removeMariposa: (state: SteeringState, mariposaId: string): SteeringState => {
    return {
      ...state,
      mariposas: state.mariposas.filter(m => m.id !== mariposaId),
      performanceMetrics: {
        ...state.performanceMetrics,
        activeCount: state.mariposas.length - 1
      }
    };
  },

  // Clear all mariposas
  clearAllMariposas: (state: SteeringState): SteeringState => {
    return {
      ...state,
      mariposas: [],
      performanceMetrics: {
        ...state.performanceMetrics,
        activeCount: 0
      }
    };
  },

  // Get mariposas within viewport
  getVisibleMariposas: (state: SteeringState): Mariposa[] => {
    return state.mariposas.filter(mariposa => 
      mariposa.position.x >= -50 && 
      mariposa.position.x <= window.innerWidth + 50 &&
      mariposa.position.y >= -50 && 
      mariposa.position.y <= window.innerHeight + 50
    );
  },

  // Calculate performance metrics
  calculatePerformanceMetrics: (
    currentFps: number,
    activeCount: number
  ): SteeringState['performanceMetrics'] => {
    // Determine max count based on performance
    let maxCount = 5;
    if (currentFps < 30) {
      maxCount = 2;
    } else if (currentFps < 45) {
      maxCount = 3;
    }

    return {
      fps: currentFps,
      activeCount,
      maxCount
    };
  }
};
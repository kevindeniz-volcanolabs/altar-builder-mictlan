// Kiro MCP Configuration and Initialization for Altar Builder Mictlán

import { mcpEngine } from './mcp-engine';
import { mcpZustandBridge } from './mcp-zustand-bridge';
import { altarModule } from './mcp-modules/altar-module';
import { userModule } from './mcp-modules/user-module';
import { collaborationModule } from './mcp-modules/collaboration-module';
import { steeringModule } from './mcp-modules/steering-module';
import type { MCPConfig, MCPMiddleware, MCPAction } from '../types/mcp';

// MCP Configuration
const mcpConfig: MCPConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  stateValidation: true,
  rollbackOnError: true,
  maxRetries: 3,
  retryDelay: 1000
};

// Enhanced Logging Middleware with State Transition Tracking
const loggingMiddleware: MCPMiddleware = {
  name: 'logging',
  execute: async <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => {
    if (mcpConfig.enableLogging) {
      console.group(`[MCP Action] ${action.type}`);
      console.log('Action ID:', action.id);
      console.log('Action:', action);
      console.log('Timestamp:', action.timestamp);
      console.log('Source:', action.source);
      console.log('Payload:', action.payload);
    }

    const startTime = performance.now();
    
    try {
      await next(action);
      
      if (mcpConfig.enableLogging) {
        const duration = performance.now() - startTime;
        console.log(`✅ Completed in ${duration.toFixed(2)}ms`);
        
        // Log memory usage if available
        if ('memory' in performance) {
          const memoryUsage = (performance as any).memory.usedJSHeapSize;
          console.log(`Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    } catch (error) {
      if (mcpConfig.enableLogging) {
        const duration = performance.now() - startTime;
        console.error(`❌ Failed after ${duration.toFixed(2)}ms:`, error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      throw error;
    } finally {
      if (mcpConfig.enableLogging) {
        console.groupEnd();
      }
    }
  }
};

// Enhanced Performance Monitoring Middleware
const performanceMiddleware: MCPMiddleware = {
  name: 'performance',
  execute: async <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => {
    if (!mcpConfig.enablePerformanceMonitoring) {
      await next(action);
      return;
    }

    const startTime = performance.now();
    const startMemory = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0;

    // Track action frequency
    const actionFrequency = mcpEngine.getActionHistory()
      .filter(a => a.type === action.type && 
        Date.now() - a.timestamp.getTime() < 1000) // Last second
      .length;

    await next(action);

    const endTime = performance.now();
    const endMemory = 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0;
    
    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    // Enhanced performance warnings with thresholds
    if (duration > 100) {
      console.warn(`[MCP Performance] Slow action ${action.type}: ${duration.toFixed(2)}ms`);
    }

    if (duration > 500) {
      console.error(`[MCP Performance] Very slow action ${action.type}: ${duration.toFixed(2)}ms - Consider optimization`);
    }

    if (memoryDelta > 1024 * 1024) { // 1MB
      console.warn(`[MCP Performance] High memory usage for ${action.type}: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }

    if (memoryDelta > 5 * 1024 * 1024) { // 5MB
      console.error(`[MCP Performance] Excessive memory usage for ${action.type}: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }

    if (actionFrequency > 10) {
      console.warn(`[MCP Performance] High frequency action ${action.type}: ${actionFrequency} times in last second`);
    }

    // Log performance metrics periodically
    const metrics = mcpEngine.getPerformanceMetrics();
    if (metrics.actionCount % 50 === 0) { // Every 50 actions
      console.log('[MCP Performance] Metrics:', {
        totalActions: metrics.actionCount,
        averageTime: `${metrics.averageActionTime.toFixed(2)}ms`,
        stateSize: `${(metrics.stateSize / 1024).toFixed(2)}KB`,
        memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
};

// State Validation Middleware
const validationMiddleware: MCPMiddleware = {
  name: 'validation',
  execute: async <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => {
    if (!mcpConfig.stateValidation) {
      await next(action);
      return;
    }

    // Pre-action validation
    if (!action.type || !action.id || !action.timestamp) {
      throw new Error(`Invalid action structure: ${JSON.stringify(action)}`);
    }

    // Validate payload based on action type
    switch (action.type) {
      case 'placeElement':
        if (!action.payload.element || !action.payload.position) {
          throw new Error('placeElement action requires element and position');
        }
        break;
      
      case 'removeElement':
        if (!action.payload.elementId) {
          throw new Error('removeElement action requires elementId');
        }
        break;
      
      case 'updateSettings':
        if (!action.payload.settings) {
          throw new Error('updateSettings action requires settings');
        }
        break;
    }

    await next(action);
  }
};

// Enhanced Error Recovery Middleware
const errorRecoveryMiddleware: MCPMiddleware = {
  name: 'errorRecovery',
  execute: async <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => {
    let retries = 0;
    let lastError: any;
    
    while (retries <= mcpConfig.maxRetries) {
      try {
        await next(action);
        
        // If we had previous failures but this succeeded, log recovery
        if (retries > 0) {
          console.log(`[MCP Error Recovery] Action ${action.type} succeeded after ${retries} retries`);
        }
        
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        retries++;
        
        if (retries > mcpConfig.maxRetries) {
          console.error(`[MCP Error Recovery] Action ${action.type} failed after ${mcpConfig.maxRetries} retries:`, error);
          
          // Log detailed error information
          console.error('[MCP Error Recovery] Final error details:', {
            actionId: action.id,
            actionType: action.type,
            payload: action.payload,
            errorType: error.type || 'unknown',
            errorMessage: error.message || String(error),
            retryCount: retries - 1,
            timestamp: new Date().toISOString()
          });
          
          throw error;
        }
        
        console.warn(`[MCP Error Recovery] Retry ${retries}/${mcpConfig.maxRetries} for action ${action.type}`, {
          error: error.message || String(error),
          actionId: action.id
        });
        
        // Exponential backoff for retries
        const delay = mcpConfig.retryDelay * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

// Debug State Tracking Middleware
const debugStateMiddleware: MCPMiddleware = {
  name: 'debugState',
  execute: async <T>(action: MCPAction<T>, next: (action: MCPAction<T>) => Promise<void>) => {
    if (!mcpConfig.enableLogging) {
      await next(action);
      return;
    }

    // Capture state before action
    const preActionStates = new Map<string, any>();
    mcpEngine.modules.forEach((module, name) => {
      preActionStates.set(name, JSON.parse(JSON.stringify(module.state)));
    });

    try {
      await next(action);
      
      // Log state changes after successful action
      mcpEngine.modules.forEach((module, name) => {
        const preState = preActionStates.get(name);
        const postState = module.state;
        
        if (JSON.stringify(preState) !== JSON.stringify(postState)) {
          console.log(`[MCP Debug] State changed in module ${name} for action ${action.type}`);
          
          // Only log detailed diff in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Previous state:', preState);
            console.log('New state:', postState);
          }
        }
      });
      
    } catch (error) {
      // Log state at time of error
      console.error(`[MCP Debug] Action ${action.type} failed, current states:`, 
        Object.fromEntries(
          Array.from(mcpEngine.modules.entries()).map(([name, module]) => [name, module.state])
        )
      );
      throw error;
    }
  }
};

// Initialize MCP System
export const initializeMCP = async (): Promise<void> => {
  try {
    console.log('[MCP Config] Initializing Kiro MCP system...');

    // Add middleware to engine in order of execution
    mcpEngine.addMiddleware(loggingMiddleware);
    mcpEngine.addMiddleware(debugStateMiddleware);
    mcpEngine.addMiddleware(performanceMiddleware);
    mcpEngine.addMiddleware(validationMiddleware);
    mcpEngine.addMiddleware(errorRecoveryMiddleware);

    // Register modules
    mcpEngine.registerModule(altarModule);
    mcpEngine.registerModule(userModule);
    mcpEngine.registerModule(collaborationModule);
    mcpEngine.registerModule(steeringModule);

    // Initialize bridge
    mcpZustandBridge.initialize();

    console.log('[MCP Config] ✅ Kiro MCP system initialized successfully');

    // Set up global error handling
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.type === 'mcp_error') {
        console.error('[MCP Config] Unhandled MCP error:', event.reason);
        event.preventDefault();
      }
    });

  } catch (error) {
    console.error('[MCP Config] ❌ Failed to initialize MCP system:', error);
    throw error;
  }
};

// Cleanup MCP System
export const cleanupMCP = (): void => {
  try {
    console.log('[MCP Config] Cleaning up MCP system...');
    
    // Disconnect bridge
    mcpZustandBridge.disconnect();
    
    // Unregister modules
    mcpEngine.unregisterModule('altar');
    mcpEngine.unregisterModule('user');
    mcpEngine.unregisterModule('collaboration');
    mcpEngine.unregisterModule('steering');
    
    // Remove middleware
    mcpEngine.removeMiddleware('logging');
    mcpEngine.removeMiddleware('debugState');
    mcpEngine.removeMiddleware('performance');
    mcpEngine.removeMiddleware('validation');
    mcpEngine.removeMiddleware('errorRecovery');
    
    console.log('[MCP Config] ✅ MCP system cleaned up');
  } catch (error) {
    console.error('[MCP Config] ❌ Error during MCP cleanup:', error);
  }
};

// Get Enhanced MCP Status with Debug Information
export const getMCPStatus = () => {
  const debugInfo = mcpEngine.getDebugInfo();
  
  return {
    isInitialized: mcpZustandBridge.isConnected,
    moduleCount: mcpEngine.modules.size,
    performanceMetrics: mcpEngine.getPerformanceMetrics(),
    actionHistory: mcpEngine.getActionHistory().slice(-10), // Last 10 actions
    config: mcpConfig,
    // Enhanced debug information
    debugHistory: debugInfo.debugHistory,
    performanceAlerts: debugInfo.performanceAlerts,
    errorStatistics: debugInfo.errorStatistics,
    performanceRecommendations: debugInfo.performanceRecommendations,
    middleware: debugInfo.middleware
  };
};

// Get Debug Dashboard Data
export const getMCPDebugDashboard = () => {
  const debugLogger = mcpEngine.getDebugLogger();
  const performanceOptimizer = mcpEngine.getPerformanceOptimizer();
  
  return {
    status: getMCPStatus(),
    performanceTrends: performanceOptimizer.getPerformanceTrends(),
    errorStatistics: debugLogger.getErrorStatistics(),
    performanceAlerts: debugLogger.getPerformanceAlerts(),
    recommendations: performanceOptimizer.getRecommendations(),
    debugExport: debugLogger.exportDebugData()
  };
};

// Clear all debug data
export const clearMCPDebugData = () => {
  mcpEngine.clearDebugData();
  console.log('[MCP Config] Debug data cleared');
};

// Export configuration and engine for external use
export { mcpConfig, mcpEngine, mcpZustandBridge };

// Enhanced Development helpers
if (process.env.NODE_ENV === 'development') {
  // Expose enhanced MCP system to window for debugging
  (window as any).MCP = {
    engine: mcpEngine,
    bridge: mcpZustandBridge,
    config: mcpConfig,
    status: getMCPStatus,
    debugDashboard: getMCPDebugDashboard,
    clearDebugData: clearMCPDebugData,
    initialize: initializeMCP,
    cleanup: cleanupMCP,
    // Direct access to debug systems
    debugLogger: () => mcpEngine.getDebugLogger(),
    errorRecovery: () => mcpEngine.getErrorRecovery(),
    performanceOptimizer: () => mcpEngine.getPerformanceOptimizer()
  };
  
  console.log('[MCP Config] Development debugging tools available at window.MCP');
}
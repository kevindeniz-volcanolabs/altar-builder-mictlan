// Kiro MCP Engine Implementation for Altar Builder Mictlán

import type {
  MCPEngine,
  MCPModule,
  MCPAction,
  MCPMiddleware,
  MCPError,
  MCPConfig,
  MCPPerformanceMetrics
} from '../types/mcp';
import { MCPDebugLogger, MCPErrorRecovery, MCPPerformanceOptimizer } from './mcp-debug';

export class KiroMCPEngine implements MCPEngine {
  public modules = new Map<string, MCPModule>();
  private subscribers = new Map<string, Set<(state: any) => void>>();
  private middleware: MCPMiddleware[] = [];
  private config: MCPConfig;
  private performanceMetrics: MCPPerformanceMetrics;
  private actionHistory: MCPAction[] = [];
  private isProcessing = false;
  
  // Enhanced debugging and error handling
  private debugLogger: MCPDebugLogger;
  private errorRecovery: MCPErrorRecovery;
  private performanceOptimizer: MCPPerformanceOptimizer;

  constructor(config: Partial<MCPConfig> = {}) {
    this.config = {
      enableLogging: true,
      enablePerformanceMonitoring: true,
      stateValidation: true,
      rollbackOnError: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.performanceMetrics = {
      actionCount: 0,
      averageActionTime: 0,
      stateSize: 0,
      memoryUsage: 0,
      lastUpdate: new Date()
    };

    // Initialize enhanced debugging and error handling systems
    this.debugLogger = new MCPDebugLogger(this.config);
    this.errorRecovery = new MCPErrorRecovery(this.config);
    this.performanceOptimizer = new MCPPerformanceOptimizer(this.config);

    if (this.config.enableLogging) {
      console.log('[MCP Engine] Initialized with enhanced debugging and error handling:', this.config);
    }
  }

  registerModule<T extends MCPModule>(module: T): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }

    this.modules.set(module.name, module);
    this.subscribers.set(module.name, new Set());

    if (this.config.enableLogging) {
      console.log(`[MCP Engine] Registered module: ${module.name}`);
    }
  }

  unregisterModule(moduleName: string): void {
    if (!this.modules.has(moduleName)) {
      console.warn(`[MCP Engine] Module ${moduleName} not found for unregistration`);
      return;
    }

    this.modules.delete(moduleName);
    this.subscribers.delete(moduleName);

    if (this.config.enableLogging) {
      console.log(`[MCP Engine] Unregistered module: ${moduleName}`);
    }
  }

  async dispatch<T>(action: MCPAction<T>): Promise<void> {
    if (this.isProcessing) {
      // Queue the action if engine is busy
      setTimeout(() => this.dispatch(action), 10);
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();
    let targetModule: MCPModule | undefined;
    let previousState: any = null;
    let actionSuccess = false;
    let actionError: MCPError | undefined;

    try {
      if (this.config.enableLogging) {
        console.log(`[MCP Engine] Dispatching action: ${action.type}`, action);
      }

      // Execute middleware chain
      await this.executeMiddleware(action);

      // Find target module based on action type
      targetModule = this.findTargetModule(action.type);
      if (!targetModule) {
        throw new Error(`No module found to handle action: ${action.type}`);
      }

      // Create state snapshot for potential rollback
      if (this.config.rollbackOnError) {
        this.errorRecovery.createStateSnapshot(targetModule.name, targetModule.state);
        previousState = JSON.parse(JSON.stringify(targetModule.state));
      }

      try {
        // Log state transition (before)
        const preActionState = JSON.parse(JSON.stringify(targetModule.state));

        // Execute the action through the module's reducer
        const newState = targetModule.reducer(targetModule.state, action);
        
        // Validate new state if enabled
        if (this.config.stateValidation) {
          this.validateState(targetModule.name, newState);
        }

        // Update module state
        targetModule.state = newState;

        // Log state transition (after)
        this.debugLogger.logStateTransition(
          action.id,
          targetModule.name,
          preActionState,
          newState
        );

        // Notify subscribers
        this.notifySubscribers(targetModule.name, newState);

        // Add to action history
        this.actionHistory.push(action);
        if (this.actionHistory.length > 100) {
          this.actionHistory.shift(); // Keep only last 100 actions
        }

        actionSuccess = true;

      } catch (error) {
        actionSuccess = false;
        
        // Create MCP error
        actionError = {
          type: 'action_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          action,
          timestamp: new Date(),
          recoverable: true
        };

        // Attempt error recovery
        const recovered = await this.errorRecovery.attemptRecovery(actionError);
        
        if (this.config.rollbackOnError && !recovered) {
          // Rollback using error recovery system
          const rolledBackState = this.errorRecovery.rollbackState(targetModule.name);
          if (rolledBackState) {
            targetModule.state = rolledBackState;
            console.warn(`[MCP Engine] Rolled back state for module: ${targetModule.name}`);
          }
        }
        
        throw actionError;
      }

    } catch (error) {
      actionSuccess = false;
      
      if (!actionError) {
        actionError = {
          type: 'action_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          action,
          timestamp: new Date(),
          recoverable: false
        };
      }

      console.error('[MCP Engine] Action failed:', actionError);
      throw actionError;

    } finally {
      const duration = performance.now() - startTime;
      
      // Update performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.updatePerformanceMetrics(duration);
        this.performanceOptimizer.recordMetrics(this.performanceMetrics);
      }

      // Log action execution with enhanced debugging
      this.debugLogger.logActionExecution(
        action,
        duration,
        actionSuccess,
        actionError,
        targetModule?.state
      );

      this.isProcessing = false;
    }
  }

  subscribe(moduleNames: string[], callback: (state: any) => void): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    moduleNames.forEach(moduleName => {
      const moduleSubscribers = this.subscribers.get(moduleName);
      if (moduleSubscribers) {
        moduleSubscribers.add(callback);
        
        unsubscribeFunctions.push(() => {
          moduleSubscribers.delete(callback);
        });
      }
    });

    // Return unsubscribe function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }

  getState<T>(moduleName: string): T {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Module ${moduleName} not found`);
    }
    return module.state as T;
  }

  // Add middleware to the processing chain
  addMiddleware(middleware: MCPMiddleware): void {
    this.middleware.push(middleware);
    
    if (this.config.enableLogging) {
      console.log(`[MCP Engine] Added middleware: ${middleware.name}`);
    }
  }

  // Remove middleware from the processing chain
  removeMiddleware(middlewareName: string): void {
    const index = this.middleware.findIndex(m => m.name === middlewareName);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      
      if (this.config.enableLogging) {
        console.log(`[MCP Engine] Removed middleware: ${middlewareName}`);
      }
    }
  }

  // Get current performance metrics
  getPerformanceMetrics(): MCPPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Get action history
  getActionHistory(): MCPAction[] {
    return [...this.actionHistory];
  }

  // Clear action history
  clearActionHistory(): void {
    this.actionHistory = [];
  }

  // Enhanced debugging methods
  getDebugLogger(): MCPDebugLogger {
    return this.debugLogger;
  }

  getErrorRecovery(): MCPErrorRecovery {
    return this.errorRecovery;
  }

  getPerformanceOptimizer(): MCPPerformanceOptimizer {
    return this.performanceOptimizer;
  }

  // Get comprehensive debug information
  getDebugInfo(): {
    config: MCPConfig;
    modules: string[];
    middleware: string[];
    performanceMetrics: MCPPerformanceMetrics;
    actionHistory: MCPAction[];
    debugHistory: any;
    performanceAlerts: any[];
    errorStatistics: any[];
    performanceRecommendations: string[];
  } {
    return {
      config: this.config,
      modules: Array.from(this.modules.keys()),
      middleware: this.middleware.map(m => m.name),
      performanceMetrics: this.performanceMetrics,
      actionHistory: this.actionHistory.slice(-10), // Last 10 actions
      debugHistory: this.debugLogger.exportDebugData(),
      performanceAlerts: this.debugLogger.getPerformanceAlerts(),
      errorStatistics: this.debugLogger.getErrorStatistics(),
      performanceRecommendations: this.performanceOptimizer.getRecommendations()
    };
  }

  // Clear all debug data
  clearDebugData(): void {
    this.debugLogger.clearHistory();
    this.errorRecovery.clearSnapshots();
    this.clearActionHistory();
    console.log('[MCP Engine] All debug data cleared');
  }

  // Register custom error recovery strategy
  registerErrorRecoveryStrategy(
    errorType: string,
    strategy: (error: MCPError) => Promise<boolean>
  ): void {
    this.errorRecovery.registerRecoveryStrategy(errorType, strategy);
  }

  // Register custom performance optimization rule
  registerPerformanceOptimizationRule(
    name: string,
    rule: (metrics: MCPPerformanceMetrics) => void
  ): void {
    this.performanceOptimizer.registerOptimizationRule(name, rule);
  }

  private async executeMiddleware<T>(action: MCPAction<T>): Promise<void> {
    let index = 0;

    const next = async (currentAction: MCPAction<T>): Promise<void> => {
      if (index >= this.middleware.length) {
        return; // End of middleware chain
      }

      const middleware = this.middleware[index++];
      await middleware.execute(currentAction, next);
    };

    await next(action);
  }

  private findTargetModule(actionType: string): MCPModule | undefined {
    // Map action types to modules
    const actionModuleMap: Record<string, string> = {
      // Altar actions
      'placeElement': 'altar',
      'removeElement': 'altar',
      'clearAltar': 'altar',
      'validateComposition': 'altar',
      'restoreAltar': 'altar',
      
      // User actions
      'updateSettings': 'user',
      'unlockAchievement': 'user',
      'saveProgress': 'user',
      'resetSession': 'user',
      
      // Collaboration actions
      'joinRoom': 'collaboration',
      'leaveRoom': 'collaboration',
      'syncState': 'collaboration',
      'broadcastCursor': 'collaboration',
      
      // Steering actions
      'spawnMariposa': 'steering',
      'updateBehavior': 'steering',
      'optimizePerformance': 'steering'
    };

    const moduleName = actionModuleMap[actionType];
    return moduleName ? this.modules.get(moduleName) : undefined;
  }

  private notifySubscribers(moduleName: string, newState: any): void {
    const subscribers = this.subscribers.get(moduleName);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(newState);
        } catch (error) {
          console.error(`[MCP Engine] Subscriber callback error for module ${moduleName}:`, error);
        }
      });
    }
  }

  private validateState(moduleName: string, state: any): void {
    // Basic state validation - can be extended based on module requirements
    if (state === null || state === undefined) {
      throw new Error(`Invalid state for module ${moduleName}: state cannot be null or undefined`);
    }

    // Module-specific validation
    switch (moduleName) {
      case 'altar':
        if (!state.dimensions || !Array.isArray(state.placedElements)) {
          throw new Error('Invalid altar state: missing dimensions or placedElements');
        }
        break;
      
      case 'user':
        if (!state.settings) {
          throw new Error('Invalid user state: missing settings');
        }
        break;
      
      case 'collaboration':
        if (!Array.isArray(state.peers)) {
          throw new Error('Invalid collaboration state: peers must be an array');
        }
        break;
      
      case 'steering':
        if (!Array.isArray(state.mariposas)) {
          throw new Error('Invalid steering state: mariposas must be an array');
        }
        break;
    }
  }

  private updatePerformanceMetrics(actionTime: number): void {
    this.performanceMetrics.actionCount++;
    
    // Calculate rolling average
    const totalTime = this.performanceMetrics.averageActionTime * (this.performanceMetrics.actionCount - 1) + actionTime;
    this.performanceMetrics.averageActionTime = totalTime / this.performanceMetrics.actionCount;
    
    // Update state size (approximate)
    this.performanceMetrics.stateSize = this.calculateStateSize();
    
    // Update memory usage (if available)
    if ('memory' in performance) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
    
    this.performanceMetrics.lastUpdate = new Date();
  }

  private calculateStateSize(): number {
    let totalSize = 0;
    
    this.modules.forEach(module => {
      try {
        totalSize += JSON.stringify(module.state).length;
      } catch (error) {
        // Handle circular references or other serialization issues
        console.warn(`[MCP Engine] Could not calculate size for module: ${module.name}`);
      }
    });
    
    return totalSize;
  }
}

// Default MCP Engine instance
export const mcpEngine = new KiroMCPEngine();
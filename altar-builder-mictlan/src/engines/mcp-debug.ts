// MCP Debugging and Error Handling System for Altar Builder Mictlán

import type {
  MCPAction,
  MCPModule,
  MCPError,
  MCPPerformanceMetrics,
  MCPConfig
} from '../types/mcp';

// Enhanced debugging interfaces
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

// MCP Debug Logger Class
export class MCPDebugLogger {
  private debugHistory: MCPDebugInfo[] = [];
  private stateTransitions: MCPStateTransition[] = [];
  private performanceAlerts: MCPPerformanceAlert[] = [];
  private errorCount = new Map<string, number>();
  private config: MCPConfig;
  private maxHistorySize = 1000;
  private maxTransitionSize = 500;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  // Log action execution with detailed debugging info
  logActionExecution(
    action: MCPAction,
    duration: number,
    success: boolean,
    error?: MCPError,
    stateSnapshot?: any
  ): void {
    if (!this.config.enableLogging) return;

    const debugInfo: MCPDebugInfo = {
      actionId: action.id,
      actionType: action.type,
      timestamp: new Date(),
      duration,
      success,
      error,
      stateSnapshot: this.config.stateValidation ? this.deepClone(stateSnapshot) : undefined,
      memoryUsage: this.getMemoryUsage(),
      stackTrace: error ? new Error().stack : undefined
    };

    this.debugHistory.push(debugInfo);
    this.trimHistory();

    // Log to console with enhanced formatting
    this.logToConsole(debugInfo);

    // Track error frequency
    if (!success && error) {
      this.trackError(action.type, error);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(debugInfo);
  }

  // Log state transitions with diff analysis
  logStateTransition(
    actionId: string,
    moduleName: string,
    previousState: any,
    newState: any
  ): void {
    if (!this.config.enableLogging) return;

    const transition: MCPStateTransition = {
      actionId,
      moduleName,
      previousState: this.deepClone(previousState),
      newState: this.deepClone(newState),
      timestamp: new Date(),
      stateDiff: this.calculateStateDiff(previousState, newState)
    };

    this.stateTransitions.push(transition);
    this.trimTransitions();

    // Log state changes to console
    console.group(`[MCP State] ${moduleName} - ${actionId}`);
    console.log('Previous State:', previousState);
    console.log('New State:', newState);
    console.log('State Diff:', transition.stateDiff);
    console.groupEnd();
  }

  // Get debugging information for a specific action
  getActionDebugInfo(actionId: string): MCPDebugInfo | undefined {
    return this.debugHistory.find(info => info.actionId === actionId);
  }

  // Get state transition history for a module
  getModuleTransitions(moduleName: string): MCPStateTransition[] {
    return this.stateTransitions.filter(t => t.moduleName === moduleName);
  }

  // Get performance alerts
  getPerformanceAlerts(): MCPPerformanceAlert[] {
    return [...this.performanceAlerts];
  }

  // Get error statistics
  getErrorStatistics(): { actionType: string; count: number; lastOccurrence: Date }[] {
    const stats: { actionType: string; count: number; lastOccurrence: Date }[] = [];
    
    this.errorCount.forEach((count, actionType) => {
      const lastError = this.debugHistory
        .filter(info => info.actionType === actionType && !info.success)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      stats.push({
        actionType,
        count,
        lastOccurrence: lastError?.timestamp || new Date(0)
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  // Clear debug history
  clearHistory(): void {
    this.debugHistory = [];
    this.stateTransitions = [];
    this.performanceAlerts = [];
    this.errorCount.clear();
    console.log('[MCP Debug] History cleared');
  }

  // Export debug data for analysis
  exportDebugData(): {
    history: MCPDebugInfo[];
    transitions: MCPStateTransition[];
    alerts: MCPPerformanceAlert[];
    errorStats: { actionType: string; count: number; lastOccurrence: Date }[];
  } {
    return {
      history: [...this.debugHistory],
      transitions: [...this.stateTransitions],
      alerts: [...this.performanceAlerts],
      errorStats: this.getErrorStatistics()
    };
  }

  private logToConsole(debugInfo: MCPDebugInfo): void {
    const { actionType, duration, success, error } = debugInfo;
    
    if (success) {
      console.log(
        `%c[MCP Debug] ✅ ${actionType}`,
        'color: #10b981; font-weight: bold',
        `${duration.toFixed(2)}ms`
      );
    } else {
      console.error(
        `%c[MCP Debug] ❌ ${actionType}`,
        'color: #ef4444; font-weight: bold',
        `${duration.toFixed(2)}ms`,
        error
      );
    }

    // Log memory usage if significant
    if (debugInfo.memoryUsage && debugInfo.memoryUsage > 50 * 1024 * 1024) { // 50MB
      console.warn(
        `[MCP Debug] High memory usage: ${(debugInfo.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }

  private trackError(actionType: string, error: MCPError): void {
    const currentCount = this.errorCount.get(actionType) || 0;
    this.errorCount.set(actionType, currentCount + 1);

    // Alert if error frequency is high
    if (currentCount + 1 >= 5) {
      this.addPerformanceAlert({
        type: 'frequent_errors',
        message: `Action ${actionType} has failed ${currentCount + 1} times`,
        threshold: 5,
        currentValue: currentCount + 1,
        timestamp: new Date(),
        actionType
      });
    }
  }

  private checkPerformanceThresholds(debugInfo: MCPDebugInfo): void {
    // Check for slow actions
    if (debugInfo.duration > 100) {
      this.addPerformanceAlert({
        type: 'slow_action',
        message: `Slow action detected: ${debugInfo.actionType}`,
        threshold: 100,
        currentValue: debugInfo.duration,
        timestamp: debugInfo.timestamp,
        actionType: debugInfo.actionType
      });
    }

    // Check for high memory usage
    if (debugInfo.memoryUsage && debugInfo.memoryUsage > 100 * 1024 * 1024) { // 100MB
      this.addPerformanceAlert({
        type: 'high_memory',
        message: 'High memory usage detected',
        threshold: 100 * 1024 * 1024,
        currentValue: debugInfo.memoryUsage,
        timestamp: debugInfo.timestamp,
        actionType: debugInfo.actionType
      });
    }
  }

  private addPerformanceAlert(alert: MCPPerformanceAlert): void {
    this.performanceAlerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts.shift();
    }

    // Log alert to console
    console.warn(`[MCP Performance] ${alert.type}: ${alert.message}`, alert);
  }

  private calculateStateDiff(previous: any, current: any): any {
    if (previous === current) return null;
    
    if (typeof previous !== 'object' || typeof current !== 'object') {
      return { from: previous, to: current };
    }

    const diff: any = {};
    const allKeys = new Set([...Object.keys(previous || {}), ...Object.keys(current || {})]);

    for (const key of allKeys) {
      const prevValue = previous?.[key];
      const currValue = current?.[key];

      if (prevValue !== currValue) {
        if (typeof prevValue === 'object' && typeof currValue === 'object') {
          const nestedDiff = this.calculateStateDiff(prevValue, currValue);
          if (nestedDiff) {
            diff[key] = nestedDiff;
          }
        } else {
          diff[key] = { from: prevValue, to: currValue };
        }
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Map) return new Map(Array.from(obj, ([k, v]) => [k, this.deepClone(v)]));
    if (obj instanceof Set) return new Set(Array.from(obj, item => this.deepClone(item)));
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private trimHistory(): void {
    if (this.debugHistory.length > this.maxHistorySize) {
      this.debugHistory = this.debugHistory.slice(-this.maxHistorySize);
    }
  }

  private trimTransitions(): void {
    if (this.stateTransitions.length > this.maxTransitionSize) {
      this.stateTransitions = this.stateTransitions.slice(-this.maxTransitionSize);
    }
  }
}

// MCP Error Recovery System
export class MCPErrorRecovery {
  private stateSnapshots = new Map<string, any>();
  private recoveryStrategies = new Map<string, (error: MCPError) => Promise<boolean>>();
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
    this.setupDefaultRecoveryStrategies();
  }

  // Create a state snapshot before action execution
  createStateSnapshot(moduleName: string, state: any): void {
    if (!this.config.rollbackOnError) return;
    
    this.stateSnapshots.set(moduleName, this.deepClone(state));
  }

  // Rollback to previous state snapshot
  rollbackState(moduleName: string): any | null {
    const snapshot = this.stateSnapshots.get(moduleName);
    if (snapshot) {
      console.warn(`[MCP Recovery] Rolling back state for module: ${moduleName}`);
      return this.deepClone(snapshot);
    }
    return null;
  }

  // Register a custom recovery strategy
  registerRecoveryStrategy(
    errorType: string,
    strategy: (error: MCPError) => Promise<boolean>
  ): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  // Attempt to recover from an error
  async attemptRecovery(error: MCPError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type);
    if (strategy) {
      try {
        const recovered = await strategy(error);
        if (recovered) {
          console.log(`[MCP Recovery] Successfully recovered from ${error.type}`);
        }
        return recovered;
      } catch (recoveryError) {
        console.error(`[MCP Recovery] Recovery strategy failed for ${error.type}:`, recoveryError);
      }
    }
    return false;
  }

  // Clear state snapshots
  clearSnapshots(): void {
    this.stateSnapshots.clear();
  }

  private setupDefaultRecoveryStrategies(): void {
    // Strategy for action failures
    this.registerRecoveryStrategy('action_failed', async (error: MCPError) => {
      if (error.action && error.recoverable) {
        // For recoverable errors, we can retry the action
        console.log(`[MCP Recovery] Action ${error.action.type} is recoverable, will be retried`);
        return true;
      }
      return false;
    });

    // Strategy for state sync errors
    this.registerRecoveryStrategy('state_sync_error', async (error: MCPError) => {
      console.log('[MCP Recovery] Attempting to resync state...');
      // In a real implementation, this would trigger a full state resync
      return true;
    });

    // Strategy for validation errors
    this.registerRecoveryStrategy('validation_error', async (error: MCPError) => {
      console.log('[MCP Recovery] Validation error detected, rolling back...');
      return true; // Rollback will be handled by the caller
    });
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Map) return new Map(Array.from(obj, ([k, v]) => [k, this.deepClone(v)]));
    if (obj instanceof Set) return new Set(Array.from(obj, item => this.deepClone(item)));
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

// MCP Performance Optimizer
export class MCPPerformanceOptimizer {
  private performanceHistory: MCPPerformanceMetrics[] = [];
  private optimizationRules = new Map<string, (metrics: MCPPerformanceMetrics) => void>();
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
    this.setupOptimizationRules();
  }

  // Record performance metrics
  recordMetrics(metrics: MCPPerformanceMetrics): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.performanceHistory.push({ ...metrics });
    
    // Keep only last 100 metrics
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    // Apply optimization rules
    this.applyOptimizations(metrics);
  }

  // Get performance trends
  getPerformanceTrends(): {
    averageActionTime: number[];
    memoryUsage: number[];
    stateSize: number[];
    actionCount: number[];
  } {
    return {
      averageActionTime: this.performanceHistory.map(m => m.averageActionTime),
      memoryUsage: this.performanceHistory.map(m => m.memoryUsage),
      stateSize: this.performanceHistory.map(m => m.stateSize),
      actionCount: this.performanceHistory.map(m => m.actionCount)
    };
  }

  // Register custom optimization rule
  registerOptimizationRule(
    name: string,
    rule: (metrics: MCPPerformanceMetrics) => void
  ): void {
    this.optimizationRules.set(name, rule);
  }

  // Get performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const latest = this.performanceHistory[this.performanceHistory.length - 1];
    
    if (!latest) return recommendations;

    if (latest.averageActionTime > 50) {
      recommendations.push('Consider optimizing action processing - average time is high');
    }

    if (latest.stateSize > 1024 * 1024) { // 1MB
      recommendations.push('State size is large - consider state cleanup or compression');
    }

    if (latest.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Memory usage is high - consider garbage collection');
    }

    const recentMetrics = this.performanceHistory.slice(-10);
    if (recentMetrics.length >= 5) {
      const avgActionTime = recentMetrics.reduce((sum, m) => sum + m.averageActionTime, 0) / recentMetrics.length;
      if (avgActionTime > latest.averageActionTime * 1.5) {
        recommendations.push('Performance is degrading - investigate recent changes');
      }
    }

    return recommendations;
  }

  private applyOptimizations(metrics: MCPPerformanceMetrics): void {
    this.optimizationRules.forEach((rule, name) => {
      try {
        rule(metrics);
      } catch (error) {
        console.error(`[MCP Optimizer] Optimization rule ${name} failed:`, error);
      }
    });
  }

  private setupOptimizationRules(): void {
    // Memory cleanup rule
    this.registerOptimizationRule('memory_cleanup', (metrics) => {
      if (metrics.memoryUsage > 80 * 1024 * 1024) { // 80MB
        console.warn('[MCP Optimizer] High memory usage detected, suggesting cleanup');
        // Trigger garbage collection if available
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    });

    // State size optimization rule
    this.registerOptimizationRule('state_size', (metrics) => {
      if (metrics.stateSize > 512 * 1024) { // 512KB
        console.warn('[MCP Optimizer] Large state size detected, consider state pruning');
      }
    });

    // Action performance rule
    this.registerOptimizationRule('action_performance', (metrics) => {
      if (metrics.averageActionTime > 100) {
        console.warn('[MCP Optimizer] Slow action performance detected');
      }
    });
  }
}
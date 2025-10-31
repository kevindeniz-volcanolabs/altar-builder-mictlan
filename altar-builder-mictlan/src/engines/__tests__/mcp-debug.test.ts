// Tests for MCP Debugging and Error Handling System

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPDebugLogger, MCPErrorRecovery, MCPPerformanceOptimizer } from '../mcp-debug';
import type { MCPConfig, MCPAction, MCPError, MCPPerformanceMetrics } from '../../types/mcp';

describe('MCP Debug System', () => {
  let config: MCPConfig;
  let debugLogger: MCPDebugLogger;
  let errorRecovery: MCPErrorRecovery;
  let performanceOptimizer: MCPPerformanceOptimizer;

  beforeEach(() => {
    config = {
      enableLogging: true,
      enablePerformanceMonitoring: true,
      stateValidation: true,
      rollbackOnError: true,
      maxRetries: 3,
      retryDelay: 100
    };

    debugLogger = new MCPDebugLogger(config);
    errorRecovery = new MCPErrorRecovery(config);
    performanceOptimizer = new MCPPerformanceOptimizer(config);
  });

  describe('MCPDebugLogger', () => {
    it('should log action execution successfully', () => {
      const action: MCPAction = {
        type: 'placeElement',
        payload: { element: { id: 'test' }, position: { row: 0, col: 0 } },
        timestamp: new Date(),
        id: 'test-action-1',
        source: 'local'
      };

      debugLogger.logActionExecution(action, 50, true);
      
      const debugInfo = debugLogger.getActionDebugInfo('test-action-1');
      expect(debugInfo).toBeDefined();
      expect(debugInfo?.success).toBe(true);
      expect(debugInfo?.duration).toBe(50);
    });

    it('should log action execution with error', () => {
      const action: MCPAction = {
        type: 'placeElement',
        payload: { element: { id: 'test' }, position: { row: 0, col: 0 } },
        timestamp: new Date(),
        id: 'test-action-2',
        source: 'local'
      };

      const error: MCPError = {
        type: 'action_failed',
        message: 'Test error',
        action,
        timestamp: new Date(),
        recoverable: true
      };

      debugLogger.logActionExecution(action, 100, false, error);
      
      const debugInfo = debugLogger.getActionDebugInfo('test-action-2');
      expect(debugInfo).toBeDefined();
      expect(debugInfo?.success).toBe(false);
      expect(debugInfo?.error).toEqual(error);
    });

    it('should log state transitions', () => {
      const previousState = { elements: [] };
      const newState = { elements: [{ id: 'test' }] };

      debugLogger.logStateTransition('test-action-3', 'altar', previousState, newState);
      
      const transitions = debugLogger.getModuleTransitions('altar');
      expect(transitions).toHaveLength(1);
      expect(transitions[0].actionId).toBe('test-action-3');
      expect(transitions[0].moduleName).toBe('altar');
    });

    it('should track error statistics', () => {
      const action1: MCPAction = {
        type: 'placeElement',
        payload: {},
        timestamp: new Date(),
        id: 'error-action-1',
        source: 'local'
      };

      const action2: MCPAction = {
        type: 'placeElement',
        payload: {},
        timestamp: new Date(),
        id: 'error-action-2',
        source: 'local'
      };

      const error: MCPError = {
        type: 'action_failed',
        message: 'Test error',
        action: action1,
        timestamp: new Date(),
        recoverable: true
      };

      debugLogger.logActionExecution(action1, 50, false, error);
      debugLogger.logActionExecution(action2, 50, false, error);

      const errorStats = debugLogger.getErrorStatistics();
      expect(errorStats).toHaveLength(1);
      expect(errorStats[0].actionType).toBe('placeElement');
      expect(errorStats[0].count).toBe(2);
    });

    it('should clear history', () => {
      const action: MCPAction = {
        type: 'placeElement',
        payload: {},
        timestamp: new Date(),
        id: 'clear-test',
        source: 'local'
      };

      debugLogger.logActionExecution(action, 50, true);
      expect(debugLogger.getActionDebugInfo('clear-test')).toBeDefined();

      debugLogger.clearHistory();
      expect(debugLogger.getActionDebugInfo('clear-test')).toBeUndefined();
    });
  });

  describe('MCPErrorRecovery', () => {
    it('should create and rollback state snapshots', () => {
      const initialState = { elements: [], count: 0 };
      const moduleName = 'test-module';

      errorRecovery.createStateSnapshot(moduleName, initialState);
      
      const rolledBackState = errorRecovery.rollbackState(moduleName);
      expect(rolledBackState).toEqual(initialState);
    });

    it('should register and execute recovery strategies', async () => {
      const mockStrategy = vi.fn().mockResolvedValue(true);
      
      errorRecovery.registerRecoveryStrategy('test_error', mockStrategy);

      const error: MCPError = {
        type: 'test_error',
        message: 'Test error',
        timestamp: new Date(),
        recoverable: true
      };

      const recovered = await errorRecovery.attemptRecovery(error);
      
      expect(recovered).toBe(true);
      expect(mockStrategy).toHaveBeenCalledWith(error);
    });

    it('should handle recovery strategy failures', async () => {
      const mockStrategy = vi.fn().mockRejectedValue(new Error('Strategy failed'));
      
      errorRecovery.registerRecoveryStrategy('failing_error', mockStrategy);

      const error: MCPError = {
        type: 'failing_error',
        message: 'Test error',
        timestamp: new Date(),
        recoverable: true
      };

      const recovered = await errorRecovery.attemptRecovery(error);
      
      expect(recovered).toBe(false);
    });
  });

  describe('MCPPerformanceOptimizer', () => {
    it('should record performance metrics', () => {
      const metrics: MCPPerformanceMetrics = {
        actionCount: 10,
        averageActionTime: 25,
        stateSize: 1024,
        memoryUsage: 50 * 1024 * 1024,
        lastUpdate: new Date()
      };

      performanceOptimizer.recordMetrics(metrics);
      
      const trends = performanceOptimizer.getPerformanceTrends();
      expect(trends.actionCount).toHaveLength(1);
      expect(trends.actionCount[0]).toBe(10);
    });

    it('should provide performance recommendations', () => {
      const highMemoryMetrics: MCPPerformanceMetrics = {
        actionCount: 100,
        averageActionTime: 75,
        stateSize: 2 * 1024 * 1024, // 2MB
        memoryUsage: 150 * 1024 * 1024, // 150MB
        lastUpdate: new Date()
      };

      performanceOptimizer.recordMetrics(highMemoryMetrics);
      
      const recommendations = performanceOptimizer.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('average time'))).toBe(true);
      expect(recommendations.some(r => r.includes('State size'))).toBe(true);
      expect(recommendations.some(r => r.includes('Memory usage'))).toBe(true);
    });

    it('should register custom optimization rules', () => {
      const mockRule = vi.fn();
      
      performanceOptimizer.registerOptimizationRule('test-rule', mockRule);

      const metrics: MCPPerformanceMetrics = {
        actionCount: 1,
        averageActionTime: 10,
        stateSize: 100,
        memoryUsage: 1024,
        lastUpdate: new Date()
      };

      performanceOptimizer.recordMetrics(metrics);
      
      expect(mockRule).toHaveBeenCalledWith(metrics);
    });
  });
});
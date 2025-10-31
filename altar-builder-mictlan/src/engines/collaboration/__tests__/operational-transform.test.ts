import { describe, it, expect, beforeEach } from 'vitest';
import { OperationalTransform, type Operation } from '../operational-transform';
import type { CollaborationAction } from '../../../types';

describe('OperationalTransform', () => {
  let ot: OperationalTransform;

  beforeEach(() => {
    ot = new OperationalTransform();
  });

  describe('Action to Operation Conversion', () => {
    it('should convert element_place action to operation', () => {
      const action: CollaborationAction = {
        type: 'element_place',
        peerId: 'peer1',
        timestamp: 1000,
        data: {
          elementId: 'vela-1',
          elementType: 'vela',
          position: { row: 0, col: 0 }
        }
      };

      const operation = ot.actionToOperation(action);

      expect(operation).toEqual({
        id: 'peer1-1000',
        type: 'place',
        elementId: 'vela-1',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      });
    });

    it('should convert element_remove action to operation', () => {
      const action: CollaborationAction = {
        type: 'element_remove',
        peerId: 'peer2',
        timestamp: 2000,
        data: {
          elementId: 'vela-1',
          position: { row: 0, col: 0 }
        }
      };

      const operation = ot.actionToOperation(action);

      expect(operation).toEqual({
        id: 'peer2-2000',
        type: 'remove',
        elementId: 'vela-1',
        position: { row: 0, col: 0 },
        timestamp: 2000,
        peerId: 'peer2'
      });
    });

    it('should return null for unsupported action types', () => {
      const action: CollaborationAction = {
        type: 'cursor_move',
        peerId: 'peer1',
        timestamp: 1000,
        data: { x: 100, y: 200 }
      };

      const operation = ot.actionToOperation(action);
      expect(operation).toBeNull();
    });
  });

  describe('Operation to Action Conversion', () => {
    it('should convert place operation to action', () => {
      const operation: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementId: 'vela-1',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const action = ot.operationToAction(operation);

      expect(action).toEqual({
        type: 'element_place',
        peerId: 'peer1',
        timestamp: 1000,
        data: {
          elementId: 'vela-1',
          elementType: 'vela',
          position: { row: 0, col: 0 }
        }
      });
    });

    it('should convert remove operation to action', () => {
      const operation: Operation = {
        id: 'peer2-2000',
        type: 'remove',
        elementId: 'vela-1',
        position: { row: 0, col: 0 },
        timestamp: 2000,
        peerId: 'peer2'
      };

      const action = ot.operationToAction(operation);

      expect(action).toEqual({
        type: 'element_remove',
        peerId: 'peer2',
        timestamp: 2000,
        data: {
          elementId: 'vela-1',
          position: { row: 0, col: 0 }
        }
      });
    });
  });

  describe('Conflict Detection', () => {
    it('should detect place-place conflicts at same position', () => {
      const op1: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const op2: Operation = {
        id: 'peer2-1001',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 1001,
        peerId: 'peer2'
      };

      const conflict = ot['detectConflict'](op1, op2);
      expect(conflict).toBe(true);
    });

    it('should detect remove-remove conflicts for same element', () => {
      const op1: Operation = {
        id: 'peer1-1000',
        type: 'remove',
        elementId: 'vela-1',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const op2: Operation = {
        id: 'peer2-1001',
        type: 'remove',
        elementId: 'vela-1',
        position: { row: 0, col: 0 },
        timestamp: 1001,
        peerId: 'peer2'
      };

      const conflict = ot['detectConflict'](op1, op2);
      expect(conflict).toBe(true);
    });

    it('should not detect conflicts for different positions', () => {
      const op1: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const op2: Operation = {
        id: 'peer2-1001',
        type: 'place',
        elementType: 'flor',
        position: { row: 1, col: 1 },
        timestamp: 1001,
        peerId: 'peer2'
      };

      const conflict = ot['detectConflict'](op1, op2);
      expect(conflict).toBe(false);
    });

    it('should detect remove-place conflicts within time window', () => {
      const op1: Operation = {
        id: 'peer1-1000',
        type: 'remove',
        elementId: 'vela-1',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const op2: Operation = {
        id: 'peer2-1500',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 1500,
        peerId: 'peer2'
      };

      const conflict = ot['detectConflict'](op1, op2);
      expect(conflict).toBe(true);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts using timestamp (last writer wins)', () => {
      const incomingOp: Operation = {
        id: 'peer1-2000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 2000,
        peerId: 'peer1'
      };

      const localOp: Operation = {
        id: 'peer2-1000',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer2'
      };

      const result = ot['resolveConflict'](incomingOp, localOp);
      
      expect(result.shouldApply).toBe(true);
      expect(result.operation).toEqual(incomingOp);
    });

    it('should resolve timestamp ties using peer ID', () => {
      const incomingOp: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const localOp: Operation = {
        id: 'peer2-1000',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer2'
      };

      const result = ot['resolveConflict'](incomingOp, localOp);
      
      // peer2 > peer1 lexicographically, so peer1 should not apply
      expect(result.shouldApply).toBe(false);
    });

    it('should find alternative position for rejected place operations', () => {
      // Mock isPositionOccupied to return false for alternative positions
      ot['isPositionOccupied'] = () => false;

      const incomingOp: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const localOp: Operation = {
        id: 'peer2-1000',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer2'
      };

      const result = ot['resolveConflict'](incomingOp, localOp);
      
      expect(result.shouldApply).toBe(true);
      expect(result.operation.position).not.toEqual({ row: 0, col: 0 });
    });
  });

  describe('Transform Operation', () => {
    it('should transform operation without conflicts', () => {
      const incomingOp: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const result = ot.transform(incomingOp, []);
      
      expect(result.shouldApply).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.operation).toEqual(incomingOp);
    });

    it('should transform operation with conflicts', () => {
      const incomingOp: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const localOp: Operation = {
        id: 'peer2-2000',
        type: 'place',
        elementType: 'flor',
        position: { row: 0, col: 0 },
        timestamp: 2000,
        peerId: 'peer2'
      };

      const result = ot.transform(incomingOp, [localOp]);
      
      expect(result.shouldApply).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual(localOp);
    });
  });

  describe('Alternative Position Finding', () => {
    it('should find alternative position near original', () => {
      // Mock isPositionOccupied to return false
      ot['isPositionOccupied'] = () => false;

      const alternative = ot['findAlternativePosition']({ row: 5, col: 5 });
      
      expect(alternative).toBeDefined();
      expect(alternative!.row).toBeGreaterThanOrEqual(4);
      expect(alternative!.row).toBeLessThanOrEqual(6);
      expect(alternative!.col).toBeGreaterThanOrEqual(4);
      expect(alternative!.col).toBeLessThanOrEqual(6);
    });

    it('should return null when no alternative found', () => {
      // Mock isPositionOccupied to always return true
      ot['isPositionOccupied'] = () => true;

      const alternative = ot['findAlternativePosition']({ row: 5, col: 5 });
      
      expect(alternative).toBeNull();
    });

    it('should respect grid boundaries', () => {
      ot['isPositionOccupied'] = () => false;

      // Test corner position
      const alternative = ot['findAlternativePosition']({ row: 0, col: 0 });
      
      expect(alternative).toBeDefined();
      expect(alternative!.row).toBeGreaterThanOrEqual(0);
      expect(alternative!.col).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Operation History', () => {
    it('should track operation history', () => {
      const op: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      ot.transform(op, []);
      
      const recent = ot.getRecentOperations('peer1', 0);
      expect(recent).toHaveLength(1);
      expect(recent[0]).toEqual(op);
    });

    it('should limit history size', () => {
      // Add many operations to test history trimming
      for (let i = 0; i < 1200; i++) {
        const op: Operation = {
          id: `peer1-${i}`,
          type: 'place',
          elementType: 'vela',
          position: { row: 0, col: 0 },
          timestamp: i,
          peerId: 'peer1'
        };
        ot.transform(op, []);
      }

      const stats = ot.getStats();
      expect(stats.totalOperations).toBeLessThan(1200);
    });

    it('should cleanup old operations', () => {
      const oldOp: Operation = {
        id: 'peer1-1000',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: 1000,
        peerId: 'peer1'
      };

      const newOp: Operation = {
        id: 'peer1-5000',
        type: 'place',
        elementType: 'flor',
        position: { row: 1, col: 1 },
        timestamp: 5000,
        peerId: 'peer1'
      };

      ot.transform(oldOp, []);
      ot.transform(newOp, []);

      ot.cleanup(3000); // Remove operations older than 3000

      const recent = ot.getRecentOperations('peer1', 0);
      expect(recent).toHaveLength(1);
      expect(recent[0]).toEqual(newOp);
    });
  });

  describe('Statistics', () => {
    it('should provide operation statistics', () => {
      const ops: Operation[] = [
        {
          id: 'peer1-1000',
          type: 'place',
          elementType: 'vela',
          position: { row: 0, col: 0 },
          timestamp: 1000,
          peerId: 'peer1'
        },
        {
          id: 'peer1-2000',
          type: 'remove',
          elementId: 'vela-1',
          position: { row: 0, col: 0 },
          timestamp: 2000,
          peerId: 'peer1'
        },
        {
          id: 'peer2-3000',
          type: 'place',
          elementType: 'flor',
          position: { row: 1, col: 1 },
          timestamp: 3000,
          peerId: 'peer2'
        }
      ];

      ops.forEach(op => ot.transform(op, []));

      const stats = ot.getStats();
      
      expect(stats.totalOperations).toBe(3);
      expect(stats.operationsByType.place).toBe(2);
      expect(stats.operationsByType.remove).toBe(1);
      expect(stats.operationsByPeer.peer1).toBe(2);
      expect(stats.operationsByPeer.peer2).toBe(1);
    });
  });
});
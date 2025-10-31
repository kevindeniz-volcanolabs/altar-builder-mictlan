import type { CollaborationAction, PlacedElement, GridPosition } from '../../types';

export interface Operation {
  id: string;
  type: 'place' | 'remove' | 'move';
  elementId?: string;
  elementType?: string;
  position?: GridPosition;
  previousPosition?: GridPosition;
  timestamp: number;
  peerId: string;
}

export interface TransformResult {
  operation: Operation;
  conflicts: Operation[];
  shouldApply: boolean;
}

export class OperationalTransform {
  private operationHistory: Operation[] = [];
  private readonly maxHistorySize = 1000;

  /**
   * Transform an incoming operation against local operations
   */
  transform(incomingOp: Operation, localOps: Operation[]): TransformResult {
    const conflicts: Operation[] = [];
    let transformedOp = { ...incomingOp };
    let shouldApply = true;

    // Check for conflicts with local operations
    for (const localOp of localOps) {
      const conflict = this.detectConflict(transformedOp, localOp);
      
      if (conflict) {
        conflicts.push(localOp);
        
        // Apply transformation rules
        const resolution = this.resolveConflict(transformedOp, localOp);
        transformedOp = resolution.operation;
        shouldApply = resolution.shouldApply;
        
        if (!shouldApply) break;
      }
    }

    // Add to history if we're applying it
    if (shouldApply) {
      this.addToHistory(transformedOp);
    }

    return {
      operation: transformedOp,
      conflicts,
      shouldApply
    };
  }

  /**
   * Convert collaboration action to operation
   */
  actionToOperation(action: CollaborationAction): Operation | null {
    const baseOp = {
      id: `${action.peerId}-${action.timestamp}`,
      timestamp: action.timestamp,
      peerId: action.peerId
    };

    switch (action.type) {
      case 'element_place':
        return {
          ...baseOp,
          type: 'place',
          elementId: action.data.elementId,
          elementType: action.data.elementType,
          position: action.data.position
        };

      case 'element_remove':
        return {
          ...baseOp,
          type: 'remove',
          elementId: action.data.elementId,
          position: action.data.position
        };

      default:
        return null;
    }
  }

  /**
   * Convert operation back to collaboration action
   */
  operationToAction(operation: Operation): CollaborationAction | null {
    const baseAction = {
      peerId: operation.peerId,
      timestamp: operation.timestamp
    };

    switch (operation.type) {
      case 'place':
        return {
          ...baseAction,
          type: 'element_place',
          data: {
            elementId: operation.elementId,
            elementType: operation.elementType,
            position: operation.position
          }
        };

      case 'remove':
        return {
          ...baseAction,
          type: 'element_remove',
          data: {
            elementId: operation.elementId,
            position: operation.position
          }
        };

      default:
        return null;
    }
  }

  /**
   * Detect if two operations conflict
   */
  private detectConflict(op1: Operation, op2: Operation): boolean {
    // Same position conflicts
    if (op1.position && op2.position) {
      const samePosition = op1.position.row === op2.position.row && 
                          op1.position.col === op2.position.col;
      
      if (samePosition) {
        // Place-Place conflict
        if (op1.type === 'place' && op2.type === 'place') {
          return true;
        }
        
        // Remove-Place conflict (trying to place where something was just removed)
        if ((op1.type === 'remove' && op2.type === 'place') ||
            (op1.type === 'place' && op2.type === 'remove')) {
          return Math.abs(op1.timestamp - op2.timestamp) < 1000; // Within 1 second
        }
      }
    }

    // Same element conflicts
    if (op1.elementId && op2.elementId && op1.elementId === op2.elementId) {
      // Remove-Remove conflict
      if (op1.type === 'remove' && op2.type === 'remove') {
        return true;
      }
      
      // Move conflicts (future enhancement)
      if (op1.type === 'move' || op2.type === 'move') {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve conflicts between operations
   */
  private resolveConflict(incomingOp: Operation, localOp: Operation): {
    operation: Operation;
    shouldApply: boolean;
  } {
    // Timestamp-based resolution (last writer wins with tie-breaking)
    if (incomingOp.timestamp !== localOp.timestamp) {
      const shouldApply = incomingOp.timestamp > localOp.timestamp;
      return {
        operation: incomingOp,
        shouldApply
      };
    }

    // Tie-breaking by peer ID (deterministic)
    const shouldApply = incomingOp.peerId > localOp.peerId;
    
    // If we're not applying, try to find alternative position for place operations
    if (!shouldApply && incomingOp.type === 'place' && incomingOp.position) {
      const alternativePosition = this.findAlternativePosition(incomingOp.position);
      if (alternativePosition) {
        return {
          operation: {
            ...incomingOp,
            position: alternativePosition
          },
          shouldApply: true
        };
      }
    }

    return {
      operation: incomingOp,
      shouldApply
    };
  }

  /**
   * Find an alternative position near the original
   */
  private findAlternativePosition(originalPosition: GridPosition): GridPosition | null {
    const { row, col } = originalPosition;
    const maxDistance = 3;
    
    // Try positions in expanding circles around the original
    for (let distance = 1; distance <= maxDistance; distance++) {
      for (let dr = -distance; dr <= distance; dr++) {
        for (let dc = -distance; dc <= distance; dc++) {
          if (Math.abs(dr) === distance || Math.abs(dc) === distance) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            // Check bounds (assuming 9x12 grid, but this should be configurable)
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 12) {
              const candidate = { row: newRow, col: newCol };
              
              // Check if position is free (simplified check)
              if (!this.isPositionOccupied(candidate)) {
                return candidate;
              }
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a position is occupied (simplified implementation)
   */
  private isPositionOccupied(position: GridPosition): boolean {
    // In a real implementation, this would check against current grid state
    // For now, we'll do a simple check against recent operations
    const recentOps = this.operationHistory.slice(-50);
    
    return recentOps.some(op => 
      op.type === 'place' && 
      op.position &&
      op.position.row === position.row && 
      op.position.col === position.col
    );
  }

  /**
   * Add operation to history
   */
  private addToHistory(operation: Operation): void {
    this.operationHistory.push(operation);
    
    // Trim history if it gets too large
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(-this.maxHistorySize / 2);
    }
  }

  /**
   * Get recent operations for a peer
   */
  getRecentOperations(peerId: string, since: number): Operation[] {
    return this.operationHistory.filter(op => 
      op.peerId === peerId && op.timestamp > since
    );
  }

  /**
   * Clear old operations
   */
  cleanup(olderThan: number): void {
    this.operationHistory = this.operationHistory.filter(op => 
      op.timestamp > olderThan
    );
  }

  /**
   * Get operation statistics
   */
  getStats(): {
    totalOperations: number;
    operationsByType: Record<string, number>;
    operationsByPeer: Record<string, number>;
  } {
    const stats = {
      totalOperations: this.operationHistory.length,
      operationsByType: {} as Record<string, number>,
      operationsByPeer: {} as Record<string, number>
    };

    for (const op of this.operationHistory) {
      stats.operationsByType[op.type] = (stats.operationsByType[op.type] || 0) + 1;
      stats.operationsByPeer[op.peerId] = (stats.operationsByPeer[op.peerId] || 0) + 1;
    }

    return stats;
  }
}
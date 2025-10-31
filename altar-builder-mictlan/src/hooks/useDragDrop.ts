/**
 * useDragDrop Hook
 *
 * Enhanced drag and drop functionality with comprehensive state management.
 * Provides clean API for all drag operations with validation and feedback.
 */

import { useCallback, useRef } from 'react';
import { useAltarStore } from '../store/useAltarStore';
import type { OfrendarElement, GridPosition } from '../types';

/**
 * Drag state information
 */
export interface DragState {
  isDragging: boolean;
  draggedElement: OfrendarElement | null;
  dragSourceType: 'panel' | 'grid' | null;
  dragSourcePosition: GridPosition | null;
}

/**
 * Drop validation result
 */
export interface DropValidation {
  isValid: boolean;
  reason?: string;
  canDrop: boolean;
}

/**
 * Drag and drop event handlers
 */
export interface DragDropHandlers {
  onDragStart: (element: OfrendarElement, sourceType: 'panel' | 'grid', sourcePosition?: GridPosition) => void;
  onDragEnd: () => void;
  onDragOver: (position: GridPosition) => void;
  onDrop: (position: GridPosition) => boolean;
}

/**
 * Main drag and drop hook
 */
export function useDragDrop() {
  const store = useAltarStore();
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    draggedElement: null,
    dragSourceType: null,
    dragSourcePosition: null
  });

  // Start dragging an element
  const startDrag = useCallback((
    element: OfrendarElement,
    sourceType: 'panel' | 'grid',
    sourcePosition?: GridPosition
  ): void => {
    dragStateRef.current = {
      isDragging: true,
      draggedElement: element,
      dragSourceType: sourceType,
      dragSourcePosition: sourcePosition || null
    };

    // Update store UI state
    store.setDragging(true);
    store.setDragPreview({
      element,
      position: { x: 0, y: 0 },
      isValid: true
    });
  }, [store]);

  // End dragging
  const endDrag = useCallback((): void => {
    dragStateRef.current = {
      isDragging: false,
      draggedElement: null,
      dragSourceType: null,
      dragSourcePosition: null
    };

    // Clear store UI state
    store.setDragging(false);
    store.setDragPreview(undefined);
  }, [store]);

  // Validate drop at position
  const validateDrop = useCallback((
    element: OfrendarElement,
    position: GridPosition
  ): DropValidation => {
    // Check if position is within bounds
    const gridDims = store.grid.dimensions;
    if (position.row < 0 || position.row >= gridDims.rows ||
        position.col < 0 || position.col >= gridDims.cols) {
      return {
        isValid: false,
        canDrop: false,
        reason: 'Posición fuera de los límites'
      };
    }

    // Check if position is occupied (unless dragging from grid to same position)
    const isOccupied = store.grid.placedElements.some(
      el => el.position.row === position.row && el.position.col === position.col
    );

    const isDraggingFromSamePosition =
      dragStateRef.current.dragSourceType === 'grid' &&
      dragStateRef.current.dragSourcePosition?.row === position.row &&
      dragStateRef.current.dragSourcePosition?.col === position.col;

    if (isOccupied && !isDraggingFromSamePosition) {
      return {
        isValid: false,
        canDrop: false,
        reason: 'Esta posición ya está ocupada'
      };
    }

    // Check usage limits (only if dragging from panel)
    if (dragStateRef.current.dragSourceType === 'panel') {
      const usageCount = store.grid.placedElements.filter(
        el => el.elementType === element.type
      ).length;

      if (element.maxQuantity && usageCount >= element.maxQuantity) {
        return {
          isValid: false,
          canDrop: false,
          reason: `Solo puedes usar ${element.maxQuantity} ${element.name}`
        };
      }
    }

    return {
      isValid: true,
      canDrop: true
    };
  }, [store]);

  // Handle drag over position
  const dragOver = useCallback((position: GridPosition): void => {
    if (dragStateRef.current.draggedElement) {
      const validation = validateDrop(dragStateRef.current.draggedElement, position);
      store.setDragPreview({
        element: dragStateRef.current.draggedElement,
        position: { x: position.col, y: position.row },
        isValid: validation.canDrop
      });
    }
  }, [store, validateDrop]);

  // Handle drop at position
  const drop = useCallback((position: GridPosition): boolean => {
    const { draggedElement, dragSourceType, dragSourcePosition } = dragStateRef.current;

    if (!draggedElement) {
      return false;
    }

    // Validate drop
    const validation = validateDrop(draggedElement, position);
    if (!validation.canDrop) {
      endDrag();
      return false;
    }

    // Handle drop from panel
    if (dragSourceType === 'panel') {
      const success = store.placeElement(draggedElement, position);
      endDrag();
      return success;
    }

    // Handle drop from grid (move element)
    if (dragSourceType === 'grid' && dragSourcePosition) {
      // If dropping on same position, do nothing
      if (dragSourcePosition.row === position.row &&
          dragSourcePosition.col === position.col) {
        endDrag();
        return true;
      }

      // Find the element at source position
      const sourceElement = store.grid.placedElements.find(
        el => el.position.row === dragSourcePosition.row &&
              el.position.col === dragSourcePosition.col
      );

      if (sourceElement) {
        // Remove from source
        store.removeElement(sourceElement.id);
        // Place at target
        const success = store.placeElement(draggedElement, position);
        endDrag();
        return success;
      }
    }

    endDrag();
    return false;
  }, [store, validateDrop, endDrag]);

  // Get current drag state
  const getDragState = useCallback((): DragState => {
    return { ...dragStateRef.current };
  }, []);

  // Check if currently dragging
  const isDragging = useCallback((): boolean => {
    return dragStateRef.current.isDragging;
  }, []);

  // Get dragged element
  const getDraggedElement = useCallback((): OfrendarElement | null => {
    return dragStateRef.current.draggedElement;
  }, []);

  // Create event handlers for HTML drag and drop API
  const createHandlers = useCallback((
    element: OfrendarElement,
    sourceType: 'panel' | 'grid',
    sourcePosition?: GridPosition
  ): DragDropHandlers => {
    return {
      onDragStart: () => startDrag(element, sourceType, sourcePosition),
      onDragEnd: endDrag,
      onDragOver: dragOver,
      onDrop: drop
    };
  }, [startDrag, endDrag, dragOver, drop]);

  return {
    // State
    getDragState,
    isDragging,
    getDraggedElement,

    // Actions
    startDrag,
    endDrag,
    dragOver,
    drop,

    // Validation
    validateDrop,

    // Utilities
    createHandlers
  };
}

/**
 * Hook for drag preview customization
 */
export function useDragPreview() {
  const previewRef = useRef<HTMLElement | null>(null);

  // Create a custom drag preview element
  const createPreview = useCallback((element: OfrendarElement): HTMLElement => {
    const preview = document.createElement('div');
    preview.style.position = 'absolute';
    preview.style.top = '-1000px';
    preview.style.opacity = '0.7';
    preview.style.pointerEvents = 'none';
    preview.style.padding = '0.5rem';
    preview.style.backgroundColor = '#1F2937';
    preview.style.border = '2px solid #F97316';
    preview.style.borderRadius = '0.5rem';
    preview.style.color = '#FFFFFF';
    preview.textContent = element.name;

    document.body.appendChild(preview);
    previewRef.current = preview;

    return preview;
  }, []);

  // Clean up preview element
  const cleanupPreview = useCallback((): void => {
    if (previewRef.current) {
      document.body.removeChild(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  return {
    createPreview,
    cleanupPreview
  };
}

/**
 * Hook for drag and drop accessibility
 */
export function useDragDropAccessibility() {
  const { startDrag, drop, endDrag } = useDragDrop();

  // Handle keyboard-based drag and drop
  const handleKeyboardDrag = useCallback((
    event: React.KeyboardEvent,
    element: OfrendarElement,
    sourceType: 'panel' | 'grid',
    sourcePosition?: GridPosition
  ): void => {
    // Space or Enter to start dragging
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      startDrag(element, sourceType, sourcePosition);
    }
  }, [startDrag]);

  // Handle keyboard-based drop
  const handleKeyboardDrop = useCallback((
    event: React.KeyboardEvent,
    position: GridPosition
  ): boolean => {
    // Space or Enter to drop
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      return drop(position);
    }

    // Escape to cancel
    if (event.key === 'Escape') {
      event.preventDefault();
      endDrag();
      return false;
    }

    return false;
  }, [drop, endDrag]);

  // Get ARIA attributes for draggable elements
  const getDraggableProps = useCallback((
    element: OfrendarElement,
    sourceType: 'panel' | 'grid'
  ) => {
    return {
      role: 'button',
      draggable: true,
      'aria-grabbed': false,
      'aria-label': `Arrastrar ${element.name}`,
      tabIndex: 0
    };
  }, []);

  // Get ARIA attributes for drop zones
  const getDropZoneProps = useCallback((position: GridPosition, isValid: boolean) => {
    return {
      role: 'region',
      'aria-dropeffect': isValid ? 'move' : 'none',
      'aria-label': `Zona de colocación fila ${position.row + 1}, columna ${position.col + 1}`,
      tabIndex: 0
    };
  }, []);

  return {
    handleKeyboardDrag,
    handleKeyboardDrop,
    getDraggableProps,
    getDropZoneProps
  };
}

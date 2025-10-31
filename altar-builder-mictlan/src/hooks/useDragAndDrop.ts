import { useCallback, useEffect } from 'react';
import type { OfrendarElement, GridPosition, ValidationResult } from '../types';
import { useAltarStore } from '../store/useAltarStore';
import { validateElementPlacement } from '../utils/element-validation';

/**
 * Hook for managing drag and drop functionality
 */
export function useDragAndDrop() {
  const {
    placeElement,
    setDragPreview,
    setDragging,
    grid,
    settings
  } = useAltarStore();

  /**
   * Handle drag start from element panel
   */
  const handleDragStart = useCallback((
    event: React.DragEvent,
    element: OfrendarElement
  ) => {
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(element));
    event.dataTransfer.setData('text/plain', element.name);

    // Create custom drag image (optional)
    if (event.dataTransfer.setDragImage) {
      const dragImage = createDragImage(element);
      event.dataTransfer.setDragImage(dragImage, 25, 25);
    }

    // Update drag state
    setDragging(true);
    setDragPreview({
      element,
      position: { x: event.clientX, y: event.clientY },
      isValid: false
    });
  }, [setDragging, setDragPreview]);

  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback((event: React.DragEvent) => {
    setDragging(false);
    setDragPreview(undefined);
  }, [setDragging, setDragPreview]);

  /**
   * Validate drop at position
   */
  const validateDrop = useCallback((
    element: OfrendarElement,
    position: GridPosition
  ): ValidationResult => {
    return validateElementPlacement(
      element,
      position,
      grid.placedElements,
      grid.dimensions
    );
  }, [grid]);

  /**
   * Handle drop on grid
   */
  const handleDrop = useCallback((
    element: OfrendarElement,
    position: GridPosition
  ): boolean => {
    const validation = validateDrop(element, position);

    if (!validation.isValid) {
      // Play error sound if audio enabled
      if (settings.audioEnabled) {
        playErrorSound();
      }
      return false;
    }

    // Place element
    const success = placeElement(element, position);

    if (success && settings.audioEnabled && element.soundEffect) {
      playPlacementSound(element.soundEffect);
    }

    return success;
  }, [validateDrop, placeElement, settings]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      setDragging(false);
      setDragPreview(undefined);
    };
  }, [setDragging, setDragPreview]);

  return {
    handleDragStart,
    handleDragEnd,
    validateDrop,
    handleDrop
  };
}

/**
 * Create a custom drag image element
 */
function createDragImage(element: OfrendarElement): HTMLElement {
  const dragImage = document.createElement('div');
  dragImage.style.position = 'absolute';
  dragImage.style.top = '-9999px';
  dragImage.style.width = '50px';
  dragImage.style.height = '50px';
  dragImage.style.display = 'flex';
  dragImage.style.alignItems = 'center';
  dragImage.style.justifyContent = 'center';
  dragImage.style.fontSize = '32px';
  dragImage.style.opacity = '0.8';
  dragImage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  dragImage.style.borderRadius = '8px';
  dragImage.style.padding = '8px';
  dragImage.textContent = element.icon;

  document.body.appendChild(dragImage);

  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);

  return dragImage;
}

/**
 * Play error sound (placeholder)
 */
function playErrorSound() {
  // TODO: Implement error sound playback in Level 2
  console.log('Error sound');
}

/**
 * Play placement sound (placeholder)
 */
function playPlacementSound(soundEffect: string) {
  // TODO: Implement sound effect playback in Level 2
  console.log('Playing sound:', soundEffect);
}

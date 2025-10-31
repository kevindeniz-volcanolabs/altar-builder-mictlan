/**
 * useKeyboardNavigation Hook
 *
 * Provides keyboard navigation functionality for React components.
 * Includes grid navigation, shortcuts, and focus management.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAltarStore, usePlacedElements, useGridDimensions } from '../store/useAltarStore';
import type { GridPosition, OfrendarElement } from '../types';
import {
  getNextGridPosition,
  getNavigationDirection,
  getGlobalShortcutsManager,
  createFocusTrap,
  type KeyboardShortcut,
  type FocusTrapOptions
} from '../utils/keyboard-navigation';

/**
 * Grid navigation options
 */
export interface GridNavigationOptions {
  enabled?: boolean;
  wrap?: boolean;
  onNavigate?: (position: GridPosition) => void;
  onSelect?: (position: GridPosition) => void;
}

/**
 * Hook for grid keyboard navigation
 */
export function useGridNavigation(options: GridNavigationOptions = {}) {
  const { enabled = true, wrap = false, onNavigate, onSelect } = options;
  const gridDimensions = useGridDimensions();
  const [focusedCell, setFocusedCell] = useState<GridPosition>({ row: 0, col: 0 });

  // Handle arrow key navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const direction = getNavigationDirection(event);
    if (!direction) return;

    event.preventDefault();
    event.stopPropagation();

    let nextPosition = getNextGridPosition(focusedCell, direction, gridDimensions);

    // Handle wrapping
    if (!nextPosition && wrap) {
      switch (direction) {
        case 'up':
          nextPosition = { row: gridDimensions.rows - 1, col: focusedCell.col };
          break;
        case 'down':
          nextPosition = { row: 0, col: focusedCell.col };
          break;
        case 'left':
          nextPosition = { row: focusedCell.row, col: gridDimensions.cols - 1 };
          break;
        case 'right':
          nextPosition = { row: focusedCell.row, col: 0 };
          break;
      }
    }

    if (nextPosition) {
      setFocusedCell(nextPosition);
      onNavigate?.(nextPosition);
    }
  }, [enabled, focusedCell, gridDimensions, wrap, onNavigate]);

  // Handle Enter/Space for selection
  const handleSelect = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(focusedCell);
    }
  }, [enabled, focusedCell, onSelect]);

  // Set initial focus
  useEffect(() => {
    if (enabled) {
      setFocusedCell({ row: 0, col: 0 });
    }
  }, [enabled]);

  return {
    focusedCell,
    setFocusedCell,
    handleKeyDown,
    handleSelect
  };
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, KeyboardShortcut>) {
  const shortcutsManager = useRef(getGlobalShortcutsManager()).current;

  useEffect(() => {
    // Register shortcuts
    Object.entries(shortcuts).forEach(([id, shortcut]) => {
      shortcutsManager.register(id, shortcut);
    });

    // Setup global listener
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcutsManager.handleKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      Object.keys(shortcuts).forEach(id => {
        shortcutsManager.unregister(id);
      });
    };
  }, [shortcuts, shortcutsManager]);

  return {
    enable: () => shortcutsManager.enable(),
    disable: () => shortcutsManager.disable(),
    getShortcuts: () => shortcutsManager.getShortcuts()
  };
}

/**
 * Hook for managing focus trap
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: FocusTrapOptions & { enabled?: boolean } = {}
) {
  const { enabled = true, ...focusTrapOptions } = options;
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    cleanupRef.current = createFocusTrap(containerRef.current, focusTrapOptions);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [enabled, containerRef, focusTrapOptions]);
}

/**
 * Hook for altar-specific keyboard shortcuts
 */
export function useAltarKeyboardShortcuts() {
  const store = useAltarStore();
  const placedElements = usePlacedElements();

  const shortcuts: Record<string, KeyboardShortcut> = {
    clearAltar: {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      description: 'Limpiar altar',
      action: () => {
        if (placedElements.length > 0) {
          if (confirm('¿Estás seguro de que quieres limpiar el altar?')) {
            store.clearAltar();
          }
        }
      }
    },
    save: {
      key: 's',
      ctrlKey: true,
      description: 'Guardar altar',
      action: () => {
        // Trigger save action (implementation depends on save system)
        const event = new CustomEvent('altar:save');
        document.dispatchEvent(event);
      }
    },
    undo: {
      key: 'z',
      ctrlKey: true,
      description: 'Deshacer',
      action: () => {
        // Undo functionality (would need to implement undo/redo system)
        console.log('Undo action');
      }
    },
    redo: {
      key: 'y',
      ctrlKey: true,
      description: 'Rehacer',
      action: () => {
        // Redo functionality
        console.log('Redo action');
      }
    },
    help: {
      key: '?',
      shiftKey: true,
      description: 'Mostrar ayuda de teclado',
      action: () => {
        const event = new CustomEvent('altar:show-keyboard-help');
        document.dispatchEvent(event);
      }
    },
    escape: {
      key: 'Escape',
      description: 'Cancelar acción actual',
      action: () => {
        store.setDragging(false);
        store.setDragPreview(undefined);
      }
    }
  };

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

/**
 * Hook for element panel keyboard navigation
 */
export function useElementPanelNavigation(elements: OfrendarElement[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(elements.length - 1, prev + 1));
        break;
      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setSelectedIndex(elements.length - 1);
        break;
    }
  }, [elements.length]);

  const getSelectedElement = useCallback((): OfrendarElement | null => {
    return elements[selectedIndex] || null;
  }, [elements, selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    getSelectedElement
  };
}

/**
 * Hook for managing keyboard focus indicators
 */
export function useKeyboardFocusIndicator() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardMode(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isKeyboardMode) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }, [isKeyboardMode]);

  return isKeyboardMode;
}

/**
 * Hook for announcing changes to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create ARIA live region if it doesn't exist
    if (!announceRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(liveRegion);
      announceRef.current = liveRegion;
    }

    return () => {
      if (announceRef.current && document.body.contains(announceRef.current)) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;

      // Clear after 1 second
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return announce;
}

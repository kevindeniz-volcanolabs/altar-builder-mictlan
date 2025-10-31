/**
 * Keyboard Navigation Utilities
 *
 * Provides keyboard navigation support for the entire application.
 * Includes arrow key navigation, keyboard shortcuts, and focus management.
 */

import type { GridPosition, GridDimensions } from '../types';

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

/**
 * Navigation direction
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  initialFocus?: HTMLElement;
  returnFocus?: boolean;
  allowOutsideClick?: boolean;
}

/**
 * Get next grid position based on navigation direction
 */
export function getNextGridPosition(
  current: GridPosition,
  direction: NavigationDirection,
  dimensions: GridDimensions
): GridPosition | null {
  let nextRow = current.row;
  let nextCol = current.col;

  switch (direction) {
    case 'up':
      nextRow = current.row - 1;
      break;
    case 'down':
      nextRow = current.row + 1;
      break;
    case 'left':
      nextCol = current.col - 1;
      break;
    case 'right':
      nextCol = current.col + 1;
      break;
  }

  // Check bounds
  if (nextRow < 0 || nextRow >= dimensions.rows ||
      nextCol < 0 || nextCol >= dimensions.cols) {
    return null;
  }

  return { row: nextRow, col: nextCol };
}

/**
 * Get navigation direction from keyboard event
 */
export function getNavigationDirection(event: KeyboardEvent): NavigationDirection | null {
  switch (event.key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

/**
 * Check if keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  if (shortcut.ctrlKey && !event.ctrlKey) return false;
  if (shortcut.shiftKey && !event.shiftKey) return false;
  if (shortcut.altKey && !event.altKey) return false;
  if (shortcut.metaKey && !event.metaKey) return false;

  return true;
}

/**
 * Keyboard Shortcuts Manager
 */
export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled: boolean = true;

  /**
   * Register a keyboard shortcut
   */
  register(id: string, shortcut: KeyboardShortcut): void {
    this.shortcuts.set(id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.enabled) {
      return false;
    }

    // Ignore shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return false;
    }

    for (const [id, shortcut] of this.shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return true;
      }
    }

    return false;
  }

  /**
   * Enable shortcuts
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable shortcuts
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }
}

/**
 * Global keyboard shortcuts manager instance
 */
let globalShortcutsManager: KeyboardShortcutsManager | null = null;

export function getGlobalShortcutsManager(): KeyboardShortcutsManager {
  if (!globalShortcutsManager) {
    globalShortcutsManager = new KeyboardShortcutsManager();
  }
  return globalShortcutsManager;
}

/**
 * Focus Management Utilities
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  const elements = container.querySelectorAll(focusableSelectors.join(','));
  return Array.from(elements) as HTMLElement[];
}

/**
 * Create a focus trap within a container
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return () => {}; // No-op cleanup
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const previousActiveElement = document.activeElement as HTMLElement;

  // Set initial focus
  if (options.initialFocus) {
    options.initialFocus.focus();
  } else {
    firstElement.focus();
  }

  // Handle tab key to trap focus
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Handle clicks outside if not allowed
  const handleClick = (event: MouseEvent) => {
    if (!options.allowOutsideClick && !container.contains(event.target as Node)) {
      event.preventDefault();
      event.stopPropagation();
      firstElement.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  if (!options.allowOutsideClick) {
    document.addEventListener('click', handleClick, true);
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    if (!options.allowOutsideClick) {
      document.removeEventListener('click', handleClick, true);
    }

    // Return focus if requested
    if (options.returnFocus && previousActiveElement) {
      previousActiveElement.focus();
    }
  };
}

/**
 * Skip link navigation for accessibility
 */
export function createSkipLink(targetId: string, label: string = 'Saltar al contenido principal'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = label;
  skipLink.style.cssText = `
    position: absolute;
    left: -9999px;
    z-index: 999;
    padding: 1em;
    background-color: #000;
    color: #fff;
    text-decoration: none;
    opacity: 0;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.left = '0';
    skipLink.style.opacity = '1';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.left = '-9999px';
    skipLink.style.opacity = '0';
  });

  return skipLink;
}

/**
 * Roving tabindex manager for grid navigation
 */
export class RovingTabIndexManager {
  private items: HTMLElement[] = [];
  private currentIndex: number = 0;

  constructor(private container: HTMLElement, private itemSelector: string) {
    this.updateItems();
  }

  /**
   * Update the list of managed items
   */
  updateItems(): void {
    this.items = Array.from(
      this.container.querySelectorAll(this.itemSelector)
    ) as HTMLElement[];

    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
    });
  }

  /**
   * Move focus to the next item
   */
  focusNext(): void {
    if (this.items.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateFocus();
  }

  /**
   * Move focus to the previous item
   */
  focusPrevious(): void {
    if (this.items.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updateFocus();
  }

  /**
   * Move focus to a specific index
   */
  focusItem(index: number): void {
    if (index < 0 || index >= this.items.length) return;

    this.currentIndex = index;
    this.updateFocus();
  }

  /**
   * Update focus state
   */
  private updateFocus(): void {
    this.items.forEach((item, index) => {
      if (index === this.currentIndex) {
        item.setAttribute('tabindex', '0');
        item.focus();
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Get current focused item
   */
  getCurrentItem(): HTMLElement | null {
    return this.items[this.currentIndex] || null;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.items = [];
  }
}

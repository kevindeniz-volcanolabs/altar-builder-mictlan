/**
 * useAltar Hook
 *
 * Comprehensive hook for altar state management.
 * Provides clean API for all altar operations.
 */

import { useCallback } from 'react';
import { useAltarStore, usePlacedElements, useGridDimensions } from '../store/useAltarStore';
import type { OfrendarElement, GridPosition, PlacedElement } from '../types';

/**
 * Main altar management hook
 */
export function useAltar() {
  const store = useAltarStore();
  const placedElements = usePlacedElements();
  const gridDimensions = useGridDimensions();

  // Place element on grid
  const placeElement = useCallback((element: OfrendarElement, position: GridPosition): boolean => {
    return store.placeElement(element, position);
  }, [store]);

  // Remove element from grid
  const removeElement = useCallback((elementId: string): void => {
    store.removeElement(elementId);
  }, [store]);

  // Clear entire altar
  const clearAltar = useCallback((): void => {
    store.clearAltar();
  }, [store]);

  // Restore altar from saved state
  const restoreAltar = useCallback((elements: PlacedElement[]): void => {
    store.restoreAltar(elements);
  }, [store]);

  // Get element at position
  const getElementAt = useCallback((position: GridPosition): PlacedElement | undefined => {
    return placedElements.find(
      el => el.position.row === position.row && el.position.col === position.col
    );
  }, [placedElements]);

  // Check if position is occupied
  const isPositionOccupied = useCallback((position: GridPosition): boolean => {
    return placedElements.some(
      el => el.position.row === position.row && el.position.col === position.col
    );
  }, [placedElements]);

  // Get element usage count
  const getElementUsageCount = useCallback((elementType: string): number => {
    return store.getElementUsageCount(elementType);
  }, [store]);

  // Get altar statistics
  const getStatistics = useCallback(() => {
    const totalElements = placedElements.length;
    const uniqueTypes = new Set(placedElements.map(el => el.elementType)).size;

    return {
      totalElements,
      uniqueTypes,
      completionPercentage: Math.round((totalElements / 20) * 100),
      gridUtilization: Math.round((totalElements / (gridDimensions.rows * gridDimensions.cols)) * 100)
    };
  }, [placedElements, gridDimensions]);

  // Check if altar is empty
  const isEmpty = useCallback((): boolean => {
    return placedElements.length === 0;
  }, [placedElements]);

  // Check if altar is complete (has at least 10 elements)
  const isComplete = useCallback((): boolean => {
    return placedElements.length >= 10;
  }, [placedElements]);

  return {
    // State
    placedElements,
    gridDimensions,

    // Actions
    placeElement,
    removeElement,
    clearAltar,
    restoreAltar,

    // Queries
    getElementAt,
    isPositionOccupied,
    getElementUsageCount,
    getStatistics,
    isEmpty,
    isComplete
  };
}

/**
 * Hook for altar validation
 */
export function useAltarValidation() {
  const placedElements = usePlacedElements();

  // Validate cultural authenticity
  const validateCulturalAuthenticity = useCallback((): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } => {
    const suggestions: string[] = [];
    let score = 100;

    // Check for essential elements
    const hasPhotos = placedElements.some(el => el.elementType === 'foto');
    const hasCandles = placedElements.some(el => el.elementType === 'vela');
    const hasFlowers = placedElements.some(el => el.elementType === 'flor');

    if (!hasPhotos) {
      suggestions.push('Agrega fotos de tus seres queridos');
      score -= 20;
    }
    if (!hasCandles) {
      suggestions.push('Las velas guían el camino de los difuntos');
      score -= 15;
    }
    if (!hasFlowers) {
      suggestions.push('Las flores de cempasúchil son tradicionales');
      score -= 15;
    }

    // Check for minimum elements
    if (placedElements.length < 5) {
      suggestions.push('Agrega más elementos a tu altar');
      score -= 10;
    }

    return {
      isValid: score >= 60,
      score: Math.max(0, score),
      suggestions
    };
  }, [placedElements]);

  // Validate grid placement
  const validatePlacement = useCallback((
    element: OfrendarElement,
    position: GridPosition
  ): {
    isValid: boolean;
    reason?: string;
  } => {
    // Check if position is within bounds
    const gridDims = useAltarStore.getState().grid.dimensions;
    if (position.row < 0 || position.row >= gridDims.rows ||
        position.col < 0 || position.col >= gridDims.cols) {
      return { isValid: false, reason: 'Posición fuera de los límites' };
    }

    // Check if position is occupied
    const isOccupied = placedElements.some(
      el => el.position.row === position.row && el.position.col === position.col
    );
    if (isOccupied) {
      return { isValid: false, reason: 'Esta posición ya está ocupada' };
    }

    // Check usage limits
    const usageCount = placedElements.filter(el => el.elementType === element.type).length;
    if (element.maxQuantity && usageCount >= element.maxQuantity) {
      return { isValid: false, reason: `Solo puedes usar ${element.maxQuantity} ${element.name}` };
    }

    return { isValid: true };
  }, [placedElements]);

  return {
    validateCulturalAuthenticity,
    validatePlacement
  };
}

/**
 * Hook for altar export metadata
 */
export function useAltarMetadata() {
  const placedElements = usePlacedElements();
  const { getStatistics } = useAltar();

  const generateMetadata = useCallback(() => {
    const stats = getStatistics();
    const validation = useAltarValidation().validateCulturalAuthenticity();

    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      statistics: stats,
      culturalScore: validation.score,
      elements: placedElements.map(el => ({
        type: el.elementType,
        position: el.position,
        placedAt: el.placedAt
      }))
    };
  }, [placedElements, getStatistics]);

  return {
    generateMetadata
  };
}

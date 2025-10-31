import type {
  OfrendarElement,
  PlacedElement,
  GridPosition,
  GridDimensions,
  ValidationResult
} from '../types';
import { ElementType } from '../types';

/**
 * Validate if an element can be placed at a specific position
 */
export function validateElementPlacement(
  element: OfrendarElement,
  position: GridPosition,
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions
): ValidationResult {
  // Check if position is within grid bounds
  if (!isPositionWithinBounds(position, gridDimensions)) {
    return {
      isValid: false,
      reason: 'Position is outside grid boundaries'
    };
  }

  // Check if position is already occupied
  if (isPositionOccupied(position, currentAltar)) {
    return {
      isValid: false,
      reason: 'This position is already occupied'
    };
  }

  // Check element quantity restrictions
  const quantityCheck = validateQuantityRestriction(element, currentAltar);
  if (!quantityCheck.isValid) {
    return quantityCheck;
  }

  // Check placement rules
  for (const rule of element.placementRules) {
    const ruleCheck = validatePlacementRule(rule, position, element, currentAltar, gridDimensions);
    if (!ruleCheck.isValid) {
      return ruleCheck;
    }
  }

  return {
    isValid: true
  };
}

/**
 * Check if position is within grid boundaries
 */
export function isPositionWithinBounds(
  position: GridPosition,
  gridDimensions: GridDimensions
): boolean {
  return (
    position.row >= 0 &&
    position.row < gridDimensions.rows &&
    position.col >= 0 &&
    position.col < gridDimensions.cols
  );
}

/**
 * Check if position is already occupied
 */
export function isPositionOccupied(
  position: GridPosition,
  currentAltar: PlacedElement[]
): boolean {
  return currentAltar.some(
    el => el.position.row === position.row && el.position.col === position.col
  );
}

/**
 * Validate quantity restrictions for an element type
 */
export function validateQuantityRestriction(
  element: OfrendarElement,
  currentAltar: PlacedElement[]
): ValidationResult {
  const sameTypeCount = currentAltar.filter(
    el => el.elementType === element.type
  ).length;

  if (sameTypeCount >= element.maxQuantity) {
    const quantityRule = element.placementRules.find(r => r.type === 'maxQuantity');
    return {
      isValid: false,
      reason: quantityRule?.message || `Maximum ${element.maxQuantity} of this element allowed`
    };
  }

  return { isValid: true };
}

/**
 * Validate a specific placement rule
 */
export function validatePlacementRule(
  rule: OfrendarElement['placementRules'][0],
  position: GridPosition,
  element: OfrendarElement,
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions
): ValidationResult {
  switch (rule.type) {
    case 'rowRestriction':
      return validateRowRestriction(rule.value as string, position, gridDimensions, rule.message);

    case 'columnRestriction':
      return validateColumnRestriction(rule.value as string, position, gridDimensions, rule.message);

    case 'proximity':
      return validateProximityRule(rule.value, position, currentAltar, rule.message);

    case 'stacking':
      return validateStackingRule(rule.value, position, element, currentAltar, rule.message);

    default:
      return { isValid: true };
  }
}

/**
 * Validate row restriction rules
 */
function validateRowRestriction(
  restriction: string,
  position: GridPosition,
  gridDimensions: GridDimensions,
  message: string
): ValidationResult {
  switch (restriction) {
    case 'top-only':
      if (position.row !== 0) {
        return { isValid: false, reason: message };
      }
      break;

    case 'bottom-only':
      if (position.row !== gridDimensions.rows - 1) {
        return { isValid: false, reason: message };
      }
      break;

    case 'top-bottom-only':
      if (position.row !== 0 && position.row !== gridDimensions.rows - 1) {
        return { isValid: false, reason: message };
      }
      break;

    case 'middle-only':
      const middleRow = Math.floor(gridDimensions.rows / 2);
      if (Math.abs(position.row - middleRow) > 1) {
        return { isValid: false, reason: message };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate column restriction rules
 */
function validateColumnRestriction(
  restriction: string,
  position: GridPosition,
  gridDimensions: GridDimensions,
  message: string
): ValidationResult {
  switch (restriction) {
    case 'center':
      const centerCol = Math.floor(gridDimensions.cols / 2);
      if (position.col !== centerCol) {
        return {
          isValid: false,
          reason: message,
          suggestions: [{ row: position.row, col: centerCol }]
        };
      }
      break;

    case 'left-half':
      const midCol = Math.floor(gridDimensions.cols / 2);
      if (position.col >= midCol) {
        return { isValid: false, reason: message };
      }
      break;

    case 'right-half':
      const midColRight = Math.floor(gridDimensions.cols / 2);
      if (position.col < midColRight) {
        return { isValid: false, reason: message };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate proximity rules (elements that should be near/far from others)
 */
function validateProximityRule(
  ruleValue: any,
  position: GridPosition,
  currentAltar: PlacedElement[],
  message: string
): ValidationResult {
  // This can be extended to check for specific element types nearby
  // For now, just a basic implementation
  return { isValid: true };
}

/**
 * Validate stacking rules (elements that can/cannot stack)
 */
function validateStackingRule(
  ruleValue: any,
  position: GridPosition,
  element: OfrendarElement,
  currentAltar: PlacedElement[],
  message: string
): ValidationResult {
  // Check if there's an element below this position
  const elementBelow = currentAltar.find(
    el => el.position.row === position.row + 1 && el.position.col === position.col
  );

  // Implement stacking logic if needed
  return { isValid: true };
}

/**
 * Get suggested positions for an element
 */
export function getSuggestedPositions(
  element: OfrendarElement,
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions,
  maxSuggestions: number = 5
): GridPosition[] {
  const suggestions: GridPosition[] = [];

  // Try to find valid positions
  for (let row = 0; row < gridDimensions.rows && suggestions.length < maxSuggestions; row++) {
    for (let col = 0; col < gridDimensions.cols && suggestions.length < maxSuggestions; col++) {
      const position: GridPosition = { row, col };
      const validation = validateElementPlacement(element, position, currentAltar, gridDimensions);

      if (validation.isValid) {
        suggestions.push(position);
      }
    }
  }

  return suggestions;
}

/**
 * Check if element can be removed
 */
export function canRemoveElement(
  elementId: string,
  currentAltar: PlacedElement[]
): ValidationResult {
  const element = currentAltar.find(el => el.id === elementId);

  if (!element) {
    return {
      isValid: false,
      reason: 'Element not found'
    };
  }

  // Check if removing this element would break any dependencies
  // (e.g., if other elements depend on this one being present)
  // For now, all elements can be removed
  return {
    isValid: true
  };
}

/**
 * Get element count by type
 */
export function getElementCountByType(
  type: ElementType,
  currentAltar: PlacedElement[]
): number {
  return currentAltar.filter(el => el.elementType === type).length;
}

/**
 * Get all used element types
 */
export function getUsedElementTypes(currentAltar: PlacedElement[]): Set<ElementType> {
  return new Set(currentAltar.map(el => el.elementType));
}

/**
 * Check if altar has room for more elements
 */
export function hasRoomForElement(
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions
): boolean {
  const maxElements = gridDimensions.rows * gridDimensions.cols;
  return currentAltar.length < maxElements;
}

/**
 * Get available positions count
 */
export function getAvailablePositionsCount(
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions
): number {
  const maxElements = gridDimensions.rows * gridDimensions.cols;
  return maxElements - currentAltar.length;
}

/**
 * Validate entire altar for cultural authenticity
 */
export function validateAltarAuthenticity(
  currentAltar: PlacedElement[],
  gridDimensions: GridDimensions
): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for essential elements
  const hasCandle = currentAltar.some(el => el.elementType === ElementType.VELA);
  const hasPhoto = currentAltar.some(el =>
    el.elementType === ElementType.FOTO || el.elementType === ElementType.RETRATO_PRINCIPAL
  );
  const hasOffering = currentAltar.some(el =>
    el.elementType === ElementType.PAN_DE_MUERTO ||
    el.elementType === ElementType.COMIDA ||
    el.elementType === ElementType.BEBIDA
  );

  if (!hasCandle) {
    warnings.push('Missing candles - they light the way for the souls');
    recommendations.push('Add at least one candle to guide the spirits');
  }

  if (!hasPhoto) {
    warnings.push('Missing photos - they represent those being honored');
    recommendations.push('Add photographs of loved ones');
  }

  if (!hasOffering) {
    warnings.push('Missing offerings - sustenance for the returning souls');
    recommendations.push('Add food or drink offerings');
  }

  // Check for flowers
  const hasFlowers = currentAltar.some(el => el.elementType === ElementType.FLOR);
  if (!hasFlowers) {
    recommendations.push('Consider adding marigolds to guide the spirits');
  }

  // Check for water
  const hasWater = currentAltar.some(el => el.elementType === ElementType.AGUA);
  if (!hasWater) {
    recommendations.push('Add water to quench the thirst of traveling souls');
  }

  const isValid = hasCandle && hasPhoto && hasOffering;

  return {
    isValid,
    warnings,
    recommendations
  };
}

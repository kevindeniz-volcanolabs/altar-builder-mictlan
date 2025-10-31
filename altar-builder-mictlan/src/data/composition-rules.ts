import type { PlacedElement } from '../types';
import { ElementType } from '../types';

export interface CompositionRule {
  name: string;
  description: string;
  validator: (altar: PlacedElement[], gridDimensions: { rows: number; cols: number }) => boolean;
  scoreMultiplier: number;
  culturalSignificance: string;
}

/**
 * Traditional altar composition rules based on Day of the Dead cultural practices
 */
export const COMPOSITION_RULES: CompositionRule[] = [
  {
    name: 'Elementos Esenciales',
    description: 'Must have at least 1 candle, 1 photo, and 1 offering',
    validator: (altar) => {
      const hasCandle = altar.some(el => el.elementType === ElementType.VELA);
      const hasPhoto = altar.some(el =>
        el.elementType === ElementType.FOTO || el.elementType === ElementType.RETRATO_PRINCIPAL
      );
      const hasOffering = altar.some(el =>
        el.elementType === ElementType.PAN_DE_MUERTO ||
        el.elementType === ElementType.COMIDA ||
        el.elementType === ElementType.BEBIDA
      );
      return hasCandle && hasPhoto && hasOffering;
    },
    scoreMultiplier: 2.0,
    culturalSignificance: 'The three essential elements represent light, memory, and sustenance'
  },
  {
    name: 'Los Cuatro Elementos',
    description: 'Includes representations of earth, water, fire, and air',
    validator: (altar) => {
      const hasFire = altar.some(el =>
        el.elementType === ElementType.VELA || el.elementType === ElementType.INCIENSO
      );
      const hasWater = altar.some(el => el.elementType === ElementType.AGUA);
      const hasEarth = altar.some(el =>
        el.elementType === ElementType.COMIDA ||
        el.elementType === ElementType.FLOR ||
        el.elementType === ElementType.SAL
      );
      const hasAir = altar.some(el => el.elementType === ElementType.PAPEL_PICADO);
      return hasFire && hasWater && hasEarth && hasAir;
    },
    scoreMultiplier: 1.5,
    culturalSignificance: 'The four elements help souls navigate between worlds'
  },
  {
    name: 'Simetría Tradicional',
    description: 'Candles placed symmetrically on opposite sides',
    validator: (altar, gridDimensions) => {
      const candles = altar.filter(el => el.elementType === ElementType.VELA);
      if (candles.length < 2) return false;

      // Check if candles are placed symmetrically
      const centerCol = Math.floor(gridDimensions.cols / 2);
      const leftCandles = candles.filter(c => c.position.col < centerCol);
      const rightCandles = candles.filter(c => c.position.col > centerCol);

      return leftCandles.length > 0 && rightCandles.length > 0;
    },
    scoreMultiplier: 1.3,
    culturalSignificance: 'Symmetry represents balance and harmony'
  },
  {
    name: 'Retrato Centrado',
    description: 'Main portrait placed in the center top of the altar',
    validator: (altar, gridDimensions) => {
      const mainPortrait = altar.find(el => el.elementType === ElementType.RETRATO_PRINCIPAL);
      if (!mainPortrait) return false;

      const centerCol = Math.floor(gridDimensions.cols / 2);
      return mainPortrait.position.row === 0 && mainPortrait.position.col === centerCol;
    },
    scoreMultiplier: 1.4,
    culturalSignificance: 'The honored soul is placed at the highest point'
  },
  {
    name: 'Flores en Abundancia',
    description: 'At least 3 marigold flowers decorating the altar',
    validator: (altar) => {
      const flowers = altar.filter(el => el.elementType === ElementType.FLOR);
      return flowers.length >= 3;
    },
    scoreMultiplier: 1.2,
    culturalSignificance: 'Marigolds guide spirits home with their bright color and scent'
  },
  {
    name: 'Camino de Pétalos',
    description: 'Flowers create a visual path (horizontal or vertical line)',
    validator: (altar) => {
      const flowers = altar.filter(el => el.elementType === ElementType.FLOR);
      if (flowers.length < 3) return false;

      // Check for horizontal line
      const rows = new Set(flowers.map(f => f.position.row));
      if (rows.size === 1 && flowers.length >= 3) return true;

      // Check for vertical line
      const cols = new Set(flowers.map(f => f.position.col));
      if (cols.size === 1 && flowers.length >= 3) return true;

      return false;
    },
    scoreMultiplier: 1.3,
    culturalSignificance: 'A path of petals guides souls to the altar'
  },
  {
    name: 'Ofrendas Generosas',
    description: 'At least 5 different offerings (food, drinks, pan de muerto)',
    validator: (altar) => {
      const offerings = altar.filter(el =>
        el.elementType === ElementType.PAN_DE_MUERTO ||
        el.elementType === ElementType.COMIDA ||
        el.elementType === ElementType.BEBIDA
      );
      return offerings.length >= 5;
    },
    scoreMultiplier: 1.3,
    culturalSignificance: 'Abundant offerings honor and welcome returning souls'
  },
  {
    name: 'Niveles del Altar',
    description: 'Elements distributed across different rows (representing levels)',
    validator: (altar, gridDimensions) => {
      const rows = new Set(altar.map(el => el.position.row));
      // Should have elements in at least 3 different rows
      return rows.size >= 3;
    },
    scoreMultiplier: 1.25,
    culturalSignificance: 'Traditional altars have multiple levels representing the journey'
  },
  {
    name: 'Pan de Muerto Presente',
    description: 'Includes traditional bread of the dead',
    validator: (altar) => {
      return altar.some(el => el.elementType === ElementType.PAN_DE_MUERTO);
    },
    scoreMultiplier: 1.2,
    culturalSignificance: 'Pan de muerto is a traditional offering essential to Day of the Dead'
  },
  {
    name: 'Purificación Completa',
    description: 'Includes both salt and incense for purification',
    validator: (altar) => {
      const hasSalt = altar.some(el => el.elementType === ElementType.SAL);
      const hasIncense = altar.some(el => el.elementType === ElementType.INCIENSO);
      return hasSalt && hasIncense;
    },
    scoreMultiplier: 1.3,
    culturalSignificance: 'Salt and incense purify the space for the returning souls'
  }
];

/**
 * Calculate altar score based on composition rules
 */
export function calculateAltarScore(
  altar: PlacedElement[],
  gridDimensions: { rows: number; cols: number }
): {
  score: number;
  maxScore: number;
  percentage: number;
  satisfiedRules: CompositionRule[];
  unsatisfiedRules: CompositionRule[];
} {
  const satisfiedRules: CompositionRule[] = [];
  const unsatisfiedRules: CompositionRule[] = [];

  let score = 0;
  const baseScore = 10; // Base points for having elements
  const maxPossibleScore = COMPOSITION_RULES.reduce((sum, rule) => sum + (rule.scoreMultiplier * 10), baseScore);

  // Add base score if altar has any elements
  if (altar.length > 0) {
    score += baseScore;
  }

  // Check each composition rule
  for (const rule of COMPOSITION_RULES) {
    if (rule.validator(altar, gridDimensions)) {
      satisfiedRules.push(rule);
      score += rule.scoreMultiplier * 10;
    } else {
      unsatisfiedRules.push(rule);
    }
  }

  const percentage = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

  return {
    score,
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage),
    satisfiedRules,
    unsatisfiedRules
  };
}

/**
 * Check if altar meets minimum requirements for completion
 */
export function isAltarComplete(altar: PlacedElement[]): boolean {
  const essentialsRule = COMPOSITION_RULES.find(r => r.name === 'Elementos Esenciales');
  if (!essentialsRule) return false;

  return essentialsRule.validator(altar, { rows: 12, cols: 9 });
}

/**
 * Get suggestions for improving altar composition
 */
export function getCompositionSuggestions(
  altar: PlacedElement[],
  gridDimensions: { rows: number; cols: number }
): string[] {
  const suggestions: string[] = [];

  for (const rule of COMPOSITION_RULES) {
    if (!rule.validator(altar, gridDimensions)) {
      suggestions.push(`${rule.description} - ${rule.culturalSignificance}`);
    }
  }

  return suggestions;
}

/**
 * Calculate cultural authenticity score (0-100)
 */
export function calculateCulturalAuthenticity(
  altar: PlacedElement[],
  gridDimensions: { rows: number; cols: number }
): number {
  const result = calculateAltarScore(altar, gridDimensions);

  // Weight essential rules more heavily
  const essentialRulesSatisfied = result.satisfiedRules.filter(r =>
    r.name === 'Elementos Esenciales' ||
    r.name === 'Los Cuatro Elementos' ||
    r.name === 'Pan de Muerto Presente'
  ).length;

  const essentialWeight = (essentialRulesSatisfied / 3) * 50; // Up to 50 points
  const otherWeight = result.percentage * 0.5; // Up to 50 points

  return Math.min(100, Math.round(essentialWeight + otherWeight));
}

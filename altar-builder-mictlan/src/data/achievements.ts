import type { Achievement } from '../types';

/**
 * Achievement definitions for Altar Builder Mictlán
 * Achievements track and reward user progress and engagement
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primer-altar',
    name: 'Primer Altar',
    description: 'Completa tu primer altar con los elementos esenciales',
    icon: '🎯',
    condition: {
      type: 'altarCount',
      target: 1,
      current: 0
    },
    unlocked: false
  },
  {
    id: 'coleccionista',
    name: 'Coleccionista',
    description: 'Usa los 20 tipos diferentes de elementos en tus altares',
    icon: '🏆',
    condition: {
      type: 'elementCount',
      target: 20,
      current: 0
    },
    unlocked: false
  },
  {
    id: 'guardian-tradiciones',
    name: 'Guardián de Tradiciones',
    description: 'Crea 5 altares completos',
    icon: '👑',
    condition: {
      type: 'altarCount',
      target: 5,
      current: 0
    },
    unlocked: false
  },
  {
    id: 'maestro-simetria',
    name: 'Maestro de Simetría',
    description: 'Crea un altar perfectamente simétrico',
    icon: '⚖️',
    condition: {
      type: 'composition',
      target: 'Simetría Tradicional',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'artista-flores',
    name: 'Artista de Flores',
    description: 'Crea un camino de pétalos en tu altar',
    icon: '🌺',
    condition: {
      type: 'composition',
      target: 'Camino de Pétalos',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Logra un altar con 100% de autenticidad cultural',
    icon: '⭐',
    condition: {
      type: 'composition',
      target: 'perfect-score',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'generoso',
    name: 'Generoso',
    description: 'Coloca al menos 10 ofrendas en un solo altar',
    icon: '🎁',
    condition: {
      type: 'elementCount',
      target: 10,
      current: 0
    },
    unlocked: false
  },
  {
    id: 'iluminador',
    name: 'Iluminador',
    description: 'Coloca las 4 velas representando los puntos cardinales',
    icon: '🕯️',
    condition: {
      type: 'composition',
      target: 'four-candles',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'guardian-memoria',
    name: 'Guardián de la Memoria',
    description: 'Coloca 5 fotografías en un altar',
    icon: '📸',
    condition: {
      type: 'composition',
      target: 'five-photos',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Usa elementos de todas las 4 categorías en un altar',
    icon: '🧭',
    condition: {
      type: 'composition',
      target: 'all-categories',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'arquitecto',
    name: 'Arquitecto de Niveles',
    description: 'Crea un altar usando todas las filas disponibles',
    icon: '🏗️',
    condition: {
      type: 'composition',
      target: 'all-rows',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'purificador',
    name: 'Purificador',
    description: 'Completa la purificación con sal e incienso',
    icon: '✨',
    condition: {
      type: 'composition',
      target: 'Purificación Completa',
      current: 0
    },
    unlocked: false
  },
  {
    id: 'velocista',
    name: 'Velocista',
    description: 'Completa un altar en menos de 5 minutos',
    icon: '⚡',
    condition: {
      type: 'time',
      target: 300, // 5 minutes in seconds
      current: 0
    },
    unlocked: false
  },
  {
    id: 'dedicado',
    name: 'Dedicado',
    description: 'Trabaja en un altar por más de 30 minutos',
    icon: '⏰',
    condition: {
      type: 'time',
      target: 1800, // 30 minutes in seconds
      current: 0
    },
    unlocked: false
  },
  {
    id: 'cuatro-elementos',
    name: 'Maestro de los Elementos',
    description: 'Incluye los cuatro elementos: tierra, agua, fuego y aire',
    icon: '🌊',
    condition: {
      type: 'composition',
      target: 'Los Cuatro Elementos',
      current: 0
    },
    unlocked: false
  }
];

/**
 * Check if an achievement should be unlocked
 */
export function checkAchievementUnlock(
  achievement: Achievement,
  context: {
    altarCount?: number;
    uniqueElementsUsed?: Set<string>;
    satisfiedRules?: string[];
    currentAltar?: any;
    elapsedTime?: number;
  }
): boolean {
  const { type, target } = achievement.condition;

  switch (type) {
    case 'altarCount':
      return (context.altarCount || 0) >= (target as number);

    case 'elementCount':
      if (achievement.id === 'coleccionista') {
        return (context.uniqueElementsUsed?.size || 0) >= (target as number);
      }
      if (achievement.id === 'generoso') {
        return (context.currentAltar?.elements?.length || 0) >= (target as number);
      }
      return false;

    case 'composition':
      const ruleNames = context.satisfiedRules || [];

      if (target === 'perfect-score') {
        // Check if all major composition rules are satisfied
        const majorRules = [
          'Elementos Esenciales',
          'Los Cuatro Elementos',
          'Simetría Tradicional',
          'Retrato Centrado',
          'Pan de Muerto Presente'
        ];
        return majorRules.every(rule => ruleNames.includes(rule));
      }

      if (target === 'four-candles') {
        const candles = context.currentAltar?.elements?.filter((el: any) =>
          el.elementType === 'vela'
        ) || [];
        return candles.length === 4;
      }

      if (target === 'five-photos') {
        const photos = context.currentAltar?.elements?.filter((el: any) =>
          el.elementType === 'foto' || el.elementType === 'retrato_principal'
        ) || [];
        return photos.length >= 5;
      }

      if (target === 'all-categories') {
        const categories = new Set(
          context.currentAltar?.elements?.map((el: any) => el.category) || []
        );
        return categories.size === 4;
      }

      if (target === 'all-rows') {
        const rows = new Set(
          context.currentAltar?.elements?.map((el: any) => el.position.row) || []
        );
        const gridRows = context.currentAltar?.gridDimensions?.rows || 12;
        return rows.size === gridRows;
      }

      // Check if the specific rule is satisfied
      return ruleNames.includes(target as string);

    case 'time':
      if (achievement.id === 'velocista') {
        return (context.elapsedTime || Infinity) <= (target as number);
      }
      if (achievement.id === 'dedicado') {
        return (context.elapsedTime || 0) >= (target as number);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get all unlockable achievements based on current context
 */
export function getUnlockableAchievements(
  currentAchievements: Achievement[],
  context: Parameters<typeof checkAchievementUnlock>[1]
): Achievement[] {
  return currentAchievements
    .filter(achievement => !achievement.unlocked)
    .filter(achievement => checkAchievementUnlock(achievement, context));
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  achievement: Achievement,
  context: Parameters<typeof checkAchievementUnlock>[1]
): Achievement {
  const { type, target } = achievement.condition;
  let current = achievement.condition.current;

  switch (type) {
    case 'altarCount':
      current = context.altarCount || 0;
      break;

    case 'elementCount':
      if (achievement.id === 'coleccionista') {
        current = context.uniqueElementsUsed?.size || 0;
      } else if (achievement.id === 'generoso') {
        current = context.currentAltar?.elements?.length || 0;
      }
      break;

    case 'composition':
      current = checkAchievementUnlock(achievement, context) ? 1 : 0;
      break;

    case 'time':
      current = context.elapsedTime || 0;
      break;
  }

  return {
    ...achievement,
    condition: {
      ...achievement.condition,
      current
    }
  };
}

/**
 * Get achievement progress percentage
 */
export function getAchievementProgress(achievement: Achievement): number {
  const { type, target, current } = achievement.condition;

  if (type === 'composition') {
    return current > 0 ? 100 : 0;
  }

  const targetNum = typeof target === 'number' ? target : 100;
  const currentNum = current;

  return Math.min(100, Math.round((currentNum / targetNum) * 100));
}

/**
 * Get achievement category for display
 */
export function getAchievementCategory(achievement: Achievement): string {
  const id = achievement.id;

  if (['primer-altar', 'guardian-tradiciones'].includes(id)) {
    return 'Progreso';
  }
  if (['coleccionista', 'explorador'].includes(id)) {
    return 'Colección';
  }
  if (['maestro-simetria', 'artista-flores', 'perfectionist', 'arquitecto'].includes(id)) {
    return 'Composición';
  }
  if (['generoso', 'iluminador', 'guardian-memoria'].includes(id)) {
    return 'Ofrendas';
  }
  if (['velocista', 'dedicado'].includes(id)) {
    return 'Tiempo';
  }
  if (['purificador', 'cuatro-elementos'].includes(id)) {
    return 'Tradición';
  }

  return 'General';
}

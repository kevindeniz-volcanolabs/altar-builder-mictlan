import type {
  OfrendarElement
} from '../types';
import {
  ElementType,
  ElementCategory,
  AnimationType
} from '../types';

/**
 * Traditional Day of the Dead ofrenda elements
 * Each element follows cultural traditions and placement rules
 */
export const OFRENDA_ELEMENTS: OfrendarElement[] = [
  // ESENCIALES - Essential elements for any altar
  {
    id: 'vela-1',
    name: 'Vela',
    type: ElementType.VELA,
    category: ElementCategory.ESENCIALES,
    icon: '🕯️',
    maxQuantity: 4,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 4,
        message: 'Maximum 4 candles per altar (representing the four cardinal directions)'
      },
      {
        type: 'rowRestriction',
        value: 'top-bottom-only',
        message: 'Candles should be placed in the top or bottom rows'
      }
    ],
    animations: [
      {
        type: AnimationType.FLICKER,
        duration: 2000,
        easing: 'ease-in-out',
        loop: true
      }
    ],
    soundEffect: 'candle-light',
    description: 'Candles light the way for the souls returning home'
  },
  {
    id: 'foto-1',
    name: 'Fotografía',
    type: ElementType.FOTO,
    category: ElementCategory.ESENCIALES,
    icon: '🖼️',
    maxQuantity: 5,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 5,
        message: 'Maximum 5 photographs per altar'
      }
    ],
    soundEffect: 'photo-place',
    description: 'Photos of loved ones who have passed'
  },
  {
    id: 'retrato-principal',
    name: 'Retrato Principal',
    type: ElementType.RETRATO_PRINCIPAL,
    category: ElementCategory.ESENCIALES,
    icon: '🖼️✨',
    maxQuantity: 1,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 1,
        message: 'Only one main portrait per altar'
      },
      {
        type: 'rowRestriction',
        value: 'top-only',
        message: 'Main portrait should be centered in the top row'
      },
      {
        type: 'columnRestriction',
        value: 'center',
        message: 'Main portrait must be in the center column'
      }
    ],
    animations: [
      {
        type: AnimationType.GLOW,
        duration: 3000,
        easing: 'ease-in-out',
        loop: true
      }
    ],
    soundEffect: 'photo-place',
    description: 'The main portrait of the honored deceased, placed at the center top'
  },
  {
    id: 'agua-1',
    name: 'Agua',
    type: ElementType.AGUA,
    category: ElementCategory.ESENCIALES,
    icon: '💧',
    maxQuantity: 2,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 2,
        message: 'Maximum 2 glasses of water per altar'
      }
    ],
    soundEffect: 'water-place',
    description: 'Water quenches the thirst of the returning souls'
  },
  {
    id: 'sal-1',
    name: 'Sal',
    type: ElementType.SAL,
    category: ElementCategory.ESENCIALES,
    icon: '🧂',
    maxQuantity: 1,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 1,
        message: 'One bowl of salt per altar'
      }
    ],
    soundEffect: 'salt-place',
    description: 'Salt purifies and protects the soul'
  },

  // DECORATIVOS - Decorative elements
  {
    id: 'flor-cempasuchil-1',
    name: 'Flor de Cempasúchil',
    type: ElementType.FLOR,
    category: ElementCategory.DECORATIVOS,
    icon: '🌼',
    maxQuantity: 8,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 8,
        message: 'Maximum 8 marigold flowers per altar'
      }
    ],
    animations: [
      {
        type: AnimationType.SWAY,
        duration: 3000,
        easing: 'ease-in-out',
        loop: true
      }
    ],
    soundEffect: 'flower-place',
    description: 'Marigolds guide the spirits with their bright color and scent'
  },
  {
    id: 'papel-picado-1',
    name: 'Papel Picado',
    type: ElementType.PAPEL_PICADO,
    category: ElementCategory.DECORATIVOS,
    icon: '🎊',
    maxQuantity: 4,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 4,
        message: 'Maximum 4 papel picado decorations'
      },
      {
        type: 'rowRestriction',
        value: 'top-only',
        message: 'Papel picado typically hangs at the top'
      }
    ],
    animations: [
      {
        type: AnimationType.FLUTTER,
        duration: 2500,
        easing: 'ease-in-out',
        loop: true
      }
    ],
    soundEffect: 'paper-rustle',
    description: 'Decorative perforated paper representing wind and the fragility of life'
  },
  {
    id: 'calavera-1',
    name: 'Calavera de Azúcar',
    type: ElementType.CALAVERA,
    category: ElementCategory.DECORATIVOS,
    icon: '💀',
    maxQuantity: 3,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 3,
        message: 'Maximum 3 sugar skulls per altar'
      }
    ],
    soundEffect: 'skull-place',
    description: 'Sugar skulls celebrate the cycle of life and death'
  },
  {
    id: 'incienso-1',
    name: 'Incienso',
    type: ElementType.INCIENSO,
    category: ElementCategory.DECORATIVOS,
    icon: '🪔',
    maxQuantity: 2,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 2,
        message: 'Maximum 2 incense burners per altar'
      }
    ],
    animations: [
      {
        type: AnimationType.GLOW,
        duration: 4000,
        easing: 'ease-in-out',
        loop: true
      }
    ],
    soundEffect: 'incense-place',
    description: 'Incense purifies the space and guides spirits home'
  },
  {
    id: 'cruz-1',
    name: 'Cruz',
    type: ElementType.CRUZ,
    category: ElementCategory.DECORATIVOS,
    icon: '✝️',
    maxQuantity: 1,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 1,
        message: 'One cross per altar'
      }
    ],
    soundEffect: 'cross-place',
    description: 'A cross representing faith and protection'
  },

  // OFRENDAS - Food and drink offerings
  {
    id: 'pan-de-muerto-1',
    name: 'Pan de Muerto',
    type: ElementType.PAN_DE_MUERTO,
    category: ElementCategory.OFRENDAS,
    icon: '🍞',
    maxQuantity: 3,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 3,
        message: 'Maximum 3 pieces of pan de muerto'
      }
    ],
    soundEffect: 'bread-place',
    description: 'Traditional bread of the dead, decorated with bone-shaped pieces'
  },
  {
    id: 'comida-1',
    name: 'Comida Favorita',
    type: ElementType.COMIDA,
    category: ElementCategory.OFRENDAS,
    icon: '🍲',
    maxQuantity: 5,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 5,
        message: 'Maximum 5 food offerings'
      }
    ],
    soundEffect: 'food-place',
    description: 'Favorite foods of the deceased'
  },
  {
    id: 'bebida-1',
    name: 'Bebida Favorita',
    type: ElementType.BEBIDA,
    category: ElementCategory.OFRENDAS,
    icon: '🍷',
    maxQuantity: 3,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 3,
        message: 'Maximum 3 drink offerings'
      }
    ],
    soundEffect: 'drink-place',
    description: 'Favorite drinks of the deceased'
  },
  {
    id: 'fruta-1',
    name: 'Frutas',
    type: ElementType.COMIDA,
    category: ElementCategory.OFRENDAS,
    icon: '🍊',
    maxQuantity: 4,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 4,
        message: 'Maximum 4 fruit offerings'
      }
    ],
    soundEffect: 'food-place',
    description: 'Fresh fruits as offerings'
  },
  {
    id: 'dulces-1',
    name: 'Dulces',
    type: ElementType.COMIDA,
    category: ElementCategory.OFRENDAS,
    icon: '🍬',
    maxQuantity: 5,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 5,
        message: 'Maximum 5 candy offerings'
      }
    ],
    soundEffect: 'candy-place',
    description: 'Traditional sweets and candies'
  },

  // PERSONALES - Personal items
  {
    id: 'juguete-1',
    name: 'Juguete',
    type: ElementType.JUGUETE,
    category: ElementCategory.PERSONALES,
    icon: '🧸',
    maxQuantity: 3,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 3,
        message: 'Maximum 3 toys (for children altars)'
      }
    ],
    soundEffect: 'toy-place',
    description: 'Toys for children who have passed'
  },
  {
    id: 'libro-1',
    name: 'Libro',
    type: ElementType.LIBRO,
    category: ElementCategory.PERSONALES,
    icon: '📖',
    maxQuantity: 3,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 3,
        message: 'Maximum 3 books'
      }
    ],
    soundEffect: 'book-place',
    description: 'Favorite books or prayer books'
  },
  {
    id: 'instrumento-1',
    name: 'Instrumento Musical',
    type: ElementType.JUGUETE, // Using JUGUETE as proxy for personal items
    category: ElementCategory.PERSONALES,
    icon: '🎸',
    maxQuantity: 2,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 2,
        message: 'Maximum 2 musical instruments'
      }
    ],
    soundEffect: 'instrument-place',
    description: 'Musical instruments the deceased enjoyed'
  },
  {
    id: 'herramienta-1',
    name: 'Herramienta de Trabajo',
    type: ElementType.LIBRO, // Using LIBRO as proxy for personal items
    category: ElementCategory.PERSONALES,
    icon: '🔧',
    maxQuantity: 2,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 2,
        message: 'Maximum 2 work tools'
      }
    ],
    soundEffect: 'tool-place',
    description: 'Tools representing the deceased\'s profession or hobby'
  },
  {
    id: 'ropa-1',
    name: 'Prenda de Vestir',
    type: ElementType.LIBRO, // Using LIBRO as proxy for personal items
    category: ElementCategory.PERSONALES,
    icon: '👔',
    maxQuantity: 2,
    placementRules: [
      {
        type: 'maxQuantity',
        value: 2,
        message: 'Maximum 2 clothing items'
      }
    ],
    soundEffect: 'cloth-place',
    description: 'Favorite clothing or accessories of the deceased'
  }
];

/**
 * Get elements by category
 */
export function getElementsByCategory(category: ElementCategory): OfrendarElement[] {
  return OFRENDA_ELEMENTS.filter(el => el.category === category);
}

/**
 * Get element by ID
 */
export function getElementById(id: string): OfrendarElement | undefined {
  return OFRENDA_ELEMENTS.find(el => el.id === id);
}

/**
 * Get element by type
 */
export function getElementsByType(type: ElementType): OfrendarElement[] {
  return OFRENDA_ELEMENTS.filter(el => el.type === type);
}

/**
 * Get all available categories
 */
export function getAllCategories(): ElementCategory[] {
  return Object.values(ElementCategory);
}

/**
 * Get category display name in Spanish
 */
export function getCategoryDisplayName(category: ElementCategory): string {
  const names: Record<ElementCategory, string> = {
    [ElementCategory.ESENCIALES]: 'Elementos Esenciales',
    [ElementCategory.DECORATIVOS]: 'Elementos Decorativos',
    [ElementCategory.OFRENDAS]: 'Ofrendas de Comida',
    [ElementCategory.PERSONALES]: 'Objetos Personales'
  };
  return names[category];
}

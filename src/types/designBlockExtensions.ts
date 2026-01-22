// Extended types for design blocks - backgrounds, gradients, etc.

// Background types for sub-blocks
export type SubBlockBackgroundType = 'none' | 'color' | 'gradient' | 'image';

// Gradient directions
export type GradientDirection = 
  | 'to-t' 
  | 'to-tr' 
  | 'to-r' 
  | 'to-br' 
  | 'to-b' 
  | 'to-bl' 
  | 'to-l' 
  | 'to-tl';

// Gradient preset
export interface GradientPreset {
  id: string;
  name: string;
  nameRu: string;
  colors: string[];
  direction: GradientDirection;
}

// Background configuration for sub-blocks
export interface SubBlockBackground {
  type: SubBlockBackgroundType;
  color?: string;
  gradientColors?: string[];
  gradientDirection?: GradientDirection;
  imageUrl?: string;
  imageOpacity?: number;
  overlay?: 'none' | 'light' | 'dark';
}

// Predefined gradient presets
export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    nameRu: 'Закат',
    colors: ['#f97316', '#ec4899'],
    direction: 'to-r',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    nameRu: 'Океан',
    colors: ['#06b6d4', '#3b82f6'],
    direction: 'to-r',
  },
  {
    id: 'forest',
    name: 'Forest',
    nameRu: 'Лес',
    colors: ['#22c55e', '#14b8a6'],
    direction: 'to-r',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    nameRu: 'Лаванда',
    colors: ['#a855f7', '#6366f1'],
    direction: 'to-r',
  },
  {
    id: 'fire',
    name: 'Fire',
    nameRu: 'Огонь',
    colors: ['#ef4444', '#f97316'],
    direction: 'to-t',
  },
  {
    id: 'night',
    name: 'Night',
    nameRu: 'Ночь',
    colors: ['#1e293b', '#475569'],
    direction: 'to-b',
  },
];

// Helper to generate CSS gradient string
export const generateGradientCSS = (
  colors: string[],
  direction: GradientDirection
): string => {
  const directionMap: Record<GradientDirection, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left',
  };

  return `linear-gradient(${directionMap[direction]}, ${colors.join(', ')})`;
};

// Helper to create default background
export const createDefaultBackground = (): SubBlockBackground => ({
  type: 'none',
});

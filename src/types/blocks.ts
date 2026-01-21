// Block types for mobile-first vertical course format

import { SubBlock } from './designBlock';

export type BlockType = 
  // Content blocks
  | 'text'
  | 'heading'
  | 'video'
  | 'audio'
  | 'image_text'
  | 'design' // Composable design block with sub-blocks
  // Interactive/Quiz blocks
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'slider';

export interface BlockOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}


export interface Block {
  id: string;
  lessonId: string;
  type: BlockType;
  order: number;
  
  // Content
  content: string;
  
  // Media
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  
  // Quiz specific
  options?: BlockOption[];
  correctAnswer?: string | string[] | boolean | number;
  explanation?: string; // For incorrect answers
  explanationPartial?: string; // For partially correct answers (multiple choice)
  explanationCorrect?: string; // For correct answers
  
  // Fill blank
  blankWord?: string;
  
  // Matching
  matchingPairs?: MatchingPair[];
  
  // Slider
  sliderMin?: number;
  sliderMax?: number;
  sliderCorrect?: number;
  sliderCorrectMax?: number; // For range answer
  sliderStep?: number;
  
  // Ordering
  orderingItems?: string[];
  correctOrder?: string[];
  
  // Design block sub-blocks
  subBlocks?: SubBlock[];
  
  // Styling
  backgroundColor?: string;
  textColor?: string;
  textSize?: 'small' | 'medium' | 'large' | 'xlarge';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Block configuration for the editor - using semantic design tokens
export interface BlockConfig {
  type: BlockType;
  icon: string;
  label: string;
  labelRu: string;
  category: 'content' | 'interactive';
  // Use semantic classes that match the design system
  colorClass: string;
  bgClass: string;
  description: string;
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  // Content blocks - using primary/muted tones
  heading: {
    type: 'heading',
    icon: 'Heading',
    label: 'Heading',
    labelRu: 'Заголовок',
    category: 'content',
    colorClass: 'text-foreground',
    bgClass: 'bg-muted/50',
    description: 'Крупный заголовок секции'
  },
  text: {
    type: 'text',
    icon: 'Type',
    label: 'Text',
    labelRu: 'Текст',
    category: 'content',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    description: 'Текстовый блок'
  },
  video: {
    type: 'video',
    icon: 'Play',
    label: 'Video',
    labelRu: 'Видео',
    category: 'content',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    description: 'Видео контент'
  },
  audio: {
    type: 'audio',
    icon: 'Volume2',
    label: 'Audio',
    labelRu: 'Аудио',
    category: 'content',
    colorClass: 'text-warning-foreground',
    bgClass: 'bg-warning/10',
    description: 'Аудио плеер'
  },
  image_text: {
    type: 'image_text',
    icon: 'LayoutList',
    label: 'Image + Text',
    labelRu: 'Картинка + Текст',
    category: 'content',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    description: 'Картинка с текстом снизу'
  },
  design: {
    type: 'design',
    icon: 'Layers',
    label: 'Design',
    labelRu: 'Дизайн',
    category: 'content',
    colorClass: 'text-ai',
    bgClass: 'bg-ai/10',
    description: 'Составной блок с суб-элементами'
  },
  
  // Interactive blocks - using quiz semantic colors
  single_choice: {
    type: 'single_choice',
    icon: 'CircleDot',
    label: 'Single Choice',
    labelRu: 'Один ответ',
    category: 'interactive',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    description: 'Выбор одного ответа'
  },
  multiple_choice: {
    type: 'multiple_choice',
    icon: 'CheckSquare',
    label: 'Multiple Choice',
    labelRu: 'Несколько ответов',
    category: 'interactive',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    description: 'Выбор нескольких ответов'
  },
  true_false: {
    type: 'true_false',
    icon: 'ToggleLeft',
    label: 'True/False',
    labelRu: 'Да/Нет',
    category: 'interactive',
    colorClass: 'text-warning-foreground',
    bgClass: 'bg-warning/10',
    description: 'Вопрос Да или Нет'
  },
  fill_blank: {
    type: 'fill_blank',
    icon: 'PenLine',
    label: 'Fill Blank',
    labelRu: 'Заполни пропуск',
    category: 'interactive',
    colorClass: 'text-accent-foreground',
    bgClass: 'bg-accent',
    description: 'Заполнить пропущенное слово'
  },
  matching: {
    type: 'matching',
    icon: 'Link2',
    label: 'Matching',
    labelRu: 'Соответствие',
    category: 'interactive',
    colorClass: 'text-ai',
    bgClass: 'bg-ai/10',
    description: 'Соединить пары'
  },
  ordering: {
    type: 'ordering',
    icon: 'ListOrdered',
    label: 'Ordering',
    labelRu: 'Порядок',
    category: 'interactive',
    colorClass: 'text-warning-foreground',
    bgClass: 'bg-warning/10',
    description: 'Расположить в порядке'
  },
  slider: {
    type: 'slider',
    icon: 'SlidersHorizontal',
    label: 'Slider',
    labelRu: 'Ползунок',
    category: 'interactive',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    description: 'Выбрать значение на шкале'
  },
};

// Mobile preview dimensions (9:16 aspect ratio)
export const MOBILE_PREVIEW = {
  width: 375,
  height: 667,
  aspectRatio: '9/16',
};

// Helper to create empty block
export const createEmptyBlock = (type: BlockType, lessonId: string, order: number): Block => ({
  id: crypto.randomUUID(),
  lessonId,
  type,
  order,
  content: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...(type === 'single_choice' || type === 'multiple_choice' ? {
    options: [
      { id: crypto.randomUUID(), text: 'Вариант 1', isCorrect: true },
      { id: crypto.randomUUID(), text: 'Вариант 2', isCorrect: false },
    ]
  } : {}),
  ...(type === 'true_false' ? { correctAnswer: true } : {}),
  ...(type === 'slider' ? { sliderMin: 0, sliderMax: 100, sliderCorrect: 50, sliderStep: 1 } : {}),
  ...(type === 'matching' ? {
    matchingPairs: [
      { id: crypto.randomUUID(), left: 'Левый 1', right: 'Правый 1' },
      { id: crypto.randomUUID(), left: 'Левый 2', right: 'Правый 2' },
    ]
  } : {}),
  ...(type === 'ordering' ? {
    orderingItems: ['Пункт 1', 'Пункт 2', 'Пункт 3'],
    correctOrder: ['Пункт 1', 'Пункт 2', 'Пункт 3']
  } : {}),
  ...(type === 'design' ? { subBlocks: [] } : {}),
});

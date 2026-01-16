// Block types for mobile-first vertical course format

export type BlockType = 
  // Content blocks
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'audio'
  | 'image_text'
  // Interactive/Quiz blocks
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'slider'
  | 'hotspot';

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

export interface HotspotArea {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number;
  height: number;
  label: string;
  isCorrect: boolean;
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
  explanation?: string;
  
  // Fill blank
  blankWord?: string;
  
  // Matching
  matchingPairs?: MatchingPair[];
  
  // Hotspot
  hotspotAreas?: HotspotArea[];
  
  // Slider
  sliderMin?: number;
  sliderMax?: number;
  sliderCorrect?: number;
  sliderStep?: number;
  
  // Ordering
  orderingItems?: string[];
  correctOrder?: string[];
  
  // Styling
  backgroundColor?: string;
  textColor?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Block configuration for the editor
export interface BlockConfig {
  type: BlockType;
  icon: string;
  label: string;
  labelRu: string;
  category: 'content' | 'interactive';
  color: string;
  bgColor: string;
  description: string;
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  // Content blocks
  heading: {
    type: 'heading',
    icon: 'Heading',
    label: 'Heading',
    labelRu: 'Заголовок',
    category: 'content',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    description: 'Крупный заголовок для секции'
  },
  text: {
    type: 'text',
    icon: 'Type',
    label: 'Text',
    labelRu: 'Текст',
    category: 'content',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Текстовый блок с форматированием'
  },
  image: {
    type: 'image',
    icon: 'Image',
    label: 'Image',
    labelRu: 'Картинка',
    category: 'content',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Изображение на весь экран'
  },
  video: {
    type: 'video',
    icon: 'Play',
    label: 'Video',
    labelRu: 'Видео',
    category: 'content',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Видео контент'
  },
  audio: {
    type: 'audio',
    icon: 'Volume2',
    label: 'Audio',
    labelRu: 'Аудио',
    category: 'content',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Аудио плеер'
  },
  image_text: {
    type: 'image_text',
    icon: 'LayoutList',
    label: 'Image + Text',
    labelRu: 'Картинка + Текст',
    category: 'content',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Картинка с текстом снизу'
  },
  
  // Interactive blocks
  single_choice: {
    type: 'single_choice',
    icon: 'CircleDot',
    label: 'Single Choice',
    labelRu: 'Один ответ',
    category: 'interactive',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Выбор одного правильного ответа'
  },
  multiple_choice: {
    type: 'multiple_choice',
    icon: 'CheckSquare',
    label: 'Multiple Choice',
    labelRu: 'Несколько ответов',
    category: 'interactive',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Выбор нескольких правильных ответов'
  },
  true_false: {
    type: 'true_false',
    icon: 'ToggleLeft',
    label: 'True/False',
    labelRu: 'Да/Нет',
    category: 'interactive',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Вопрос с ответом Да или Нет'
  },
  fill_blank: {
    type: 'fill_blank',
    icon: 'PenLine',
    label: 'Fill Blank',
    labelRu: 'Заполни пропуск',
    category: 'interactive',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Заполнить пропущенное слово'
  },
  matching: {
    type: 'matching',
    icon: 'Link2',
    label: 'Matching',
    labelRu: 'Соответствие',
    category: 'interactive',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Соединить пары'
  },
  ordering: {
    type: 'ordering',
    icon: 'ListOrdered',
    label: 'Ordering',
    labelRu: 'Порядок',
    category: 'interactive',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Расположить в правильном порядке'
  },
  slider: {
    type: 'slider',
    icon: 'SlidersHorizontal',
    label: 'Slider',
    labelRu: 'Ползунок',
    category: 'interactive',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    description: 'Выбрать значение на шкале'
  },
  hotspot: {
    type: 'hotspot',
    icon: 'MousePointer2',
    label: 'Hotspot',
    labelRu: 'Точки на картинке',
    category: 'interactive',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    description: 'Нажать на правильные области картинки'
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
});

// Design Block - composable sub-blocks for visual layouts

// Sub-block types
export type SubBlockType = 
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'icon'
  | 'badge'
  | 'animation';

// Text highlight types
export type TextHighlightType = 'none' | 'marker' | 'underline' | 'wavy';

// Divider style types
export type DividerStyleType = 'thin' | 'medium' | 'bold' | 'dashed' | 'dotted' | 'wavy';

// Sub-block interface
export interface SubBlock {
  id: string;
  type: SubBlockType;
  order: number;
  
  // Content
  content?: string;
  
  // Image specific
  imageUrl?: string;
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  imageRotation?: number; // degrees, e.g. -15, 0, 15
  
  // Button specific
  buttonLabel?: string;
  buttonUrl?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  // Icon specific
  iconName?: string;
  iconSize?: 'medium' | 'large';
  iconColor?: string;
  
  // Badge specific
  badgeText?: string;
  badgeVariant?: 'square' | 'oval' | 'contrast' | 'pastel';
  badgeSize?: 'small' | 'medium' | 'large';
  
  // Animation (Rive/Lottie) specific
  animationUrl?: string;
  animationType?: 'rive' | 'lottie';
  animationSize?: 'small' | 'medium' | 'large' | 'full';
  animationStateMachine?: string;
  animationAutoplay?: boolean;
  animationLoop?: boolean;
  
  // Styling
  textAlign?: 'left' | 'center' | 'right';
  textSize?: 'small' | 'medium' | 'large' | 'xlarge';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  // Background/backdrop for text blocks
  backdrop?: 'none' | 'light' | 'dark' | 'primary' | 'blur';
  backdropRounded?: boolean;
  
  // Text highlighting
  highlight?: TextHighlightType;
  
  // Divider specific
  dividerStyle?: DividerStyleType;
}

// Sub-block configuration for the selector
export interface SubBlockConfig {
  type: SubBlockType;
  icon: string;
  label: string;
  labelRu: string;
  description: string;
}

export const SUB_BLOCK_CONFIGS: Record<SubBlockType, SubBlockConfig> = {
  heading: {
    type: 'heading',
    icon: 'Heading',
    label: 'Heading',
    labelRu: 'Заголовок',
    description: 'Крупный заголовок',
  },
  text: {
    type: 'text',
    icon: 'Type',
    label: 'Text',
    labelRu: 'Текст',
    description: 'Параграф текста',
  },
  image: {
    type: 'image',
    icon: 'Image',
    label: 'Image',
    labelRu: 'Картинка',
    description: 'Изображение',
  },
  button: {
    type: 'button',
    icon: 'MousePointerClick',
    label: 'Link Button',
    labelRu: 'Кнопка с ссылкой',
    description: 'Кнопка с внешней ссылкой',
  },
  divider: {
    type: 'divider',
    icon: 'Minus',
    label: 'Divider',
    labelRu: 'Разделитель',
    description: 'Горизонтальная линия',
  },
  icon: {
    type: 'icon',
    icon: 'Sparkles',
    label: 'Icon',
    labelRu: 'Иконка',
    description: 'Декоративная иконка',
  },
  badge: {
    type: 'badge',
    icon: 'Tag',
    label: 'Badge',
    labelRu: 'Бейдж',
    description: 'Метка или тег',
  },
  animation: {
    type: 'animation',
    icon: 'Play',
    label: 'Animation',
    labelRu: 'Анимация',
    description: 'Lottie/Rive анимация',
  },
};

// Design block templates
export type DesignTemplateId = 'hero' | 'card' | 'feature' | 'empty';

export interface DesignTemplate {
  id: DesignTemplateId;
  name: string;
  nameRu: string;
  description: string;
  subBlocks: Omit<SubBlock, 'id'>[];
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'hero',
    name: 'Hero',
    nameRu: 'Hero-секция',
    description: 'Большой заголовок с подзаголовком и кнопкой',
    subBlocks: [
      { type: 'badge', order: 1, badgeText: 'Новинка', badgeVariant: 'oval', textAlign: 'center' },
      { type: 'heading', order: 2, content: 'Добро пожаловать!', textAlign: 'center', textSize: 'xlarge', fontWeight: 'bold' },
      { type: 'text', order: 3, content: 'Описание вашего курса или урока', textAlign: 'center', textSize: 'medium' },
      { type: 'button', order: 4, buttonLabel: 'Начать', buttonVariant: 'primary', textAlign: 'center' },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    nameRu: 'Карточка',
    description: 'Картинка с заголовком и описанием',
    subBlocks: [
      { type: 'image', order: 1, imageSize: 'medium', textAlign: 'center' },
      { type: 'heading', order: 2, content: 'Заголовок карточки', textAlign: 'center', textSize: 'large', fontWeight: 'semibold' },
      { type: 'text', order: 3, content: 'Описание карточки', textAlign: 'center', textSize: 'medium' },
    ],
  },
  {
    id: 'feature',
    name: 'Feature',
    nameRu: 'Фича',
    description: 'Иконка с заголовком и описанием',
    subBlocks: [
      { type: 'icon', order: 1, iconName: 'Star', iconSize: 'large', textAlign: 'center' },
      { type: 'heading', order: 2, content: 'Преимущество', textAlign: 'center', textSize: 'large', fontWeight: 'semibold' },
      { type: 'text', order: 3, content: 'Описание преимущества вашего курса', textAlign: 'center', textSize: 'medium' },
    ],
  },
  {
    id: 'empty',
    name: 'Empty',
    nameRu: 'Пустой',
    description: 'Создайте свой дизайн с нуля',
    subBlocks: [],
  },
];

// Helper to create a new sub-block
export const createSubBlock = (type: SubBlockType, order: number): SubBlock => ({
  id: crypto.randomUUID(),
  type,
  order,
  textAlign: 'center',
  padding: 'medium',
  ...(type === 'heading' ? { content: 'Заголовок', textSize: 'large' as const, fontWeight: 'bold' as const } : {}),
  ...(type === 'text' ? { content: 'Текст абзаца', textSize: 'medium' as const } : {}),
  ...(type === 'image' ? { imageSize: 'medium' as const } : {}),
  ...(type === 'button' ? { buttonLabel: 'Кнопка', buttonVariant: 'primary' as const } : {}),
  ...(type === 'badge' ? { badgeText: 'Бейдж', badgeVariant: 'oval' as const, badgeSize: 'medium' as const } : {}),
  ...(type === 'icon' ? { iconName: 'Star', iconSize: 'medium' as const } : {}),
  ...(type === 'animation' ? { animationSize: 'medium' as const, animationAutoplay: true, animationLoop: true } : {}),
});

// Helper to create sub-blocks from template
export const createSubBlocksFromTemplate = (templateId: DesignTemplateId): SubBlock[] => {
  const template = DESIGN_TEMPLATES.find(t => t.id === templateId);
  if (!template) return [];
  
  return template.subBlocks.map(sb => ({
    ...sb,
    id: crypto.randomUUID(),
  }));
};

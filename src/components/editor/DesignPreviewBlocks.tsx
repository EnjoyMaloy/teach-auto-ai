import React, { useState } from 'react';
import { DesignSystemConfig } from '@/types/designSystem';
import { DesignSystemProvider } from '@/components/runtime/DesignSystemProvider';
import { SlideRenderer } from '@/components/runtime/SlideRenderer';
import { Slide } from '@/types/course';
import { SubBlock } from '@/types/designBlock';
import { cn } from '@/lib/utils';
import { 
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, Layers
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  heading: Heading,
  text: Type,
  image_text: LayoutList,
  video: Play,
  audio: Volume2,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  true_false: ToggleLeft,
  fill_blank: PenLine,
  matching: Link2,
  ordering: ListOrdered,
  slider: SlidersHorizontal,
  design: Layers,
};

const blockLabels: Record<string, string> = {
  design: 'Дизайн-блок',
  heading: 'Заголовок',
  text: 'Текст',
  image_text: 'Картинка + текст',
  single_choice: 'Один ответ',
  multiple_choice: 'Несколько ответов',
  true_false: 'Да/Нет',
  fill_blank: 'Заполни пропуск',
  matching: 'Соответствие',
  ordering: 'Порядок',
  slider: 'Ползунок',
};

// Sample slides demonstrating all block types
const createSampleSlides = (): Slide[] => {
  const now = new Date();
  return [
    // Design block intro
    {
      id: 'sample-design-intro',
      lessonId: 'sample',
      type: 'design',
      order: 1,
      content: '',
      subBlocks: [
        {
          id: 'sub-badge',
          type: 'badge',
          order: 1,
          badges: [{ id: '1', text: '🎨 Урок 1', iconType: 'none' }],
          badgeVariant: 'oval',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-heading',
          type: 'heading',
          order: 2,
          content: 'Введение в курс',
          textSize: 'xlarge',
          fontWeight: 'bold',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-text',
          type: 'text',
          order: 3,
          content: 'Добро пожаловать! Сегодня мы изучим основы веб-разработки.',
          textSize: 'medium',
          textAlign: 'center',
        } as SubBlock,
      ],
      createdAt: now,
      updatedAt: now,
    },
    // Heading
    {
      id: 'sample-heading',
      lessonId: 'sample',
      type: 'heading',
      order: 2,
      content: 'Основы HTML',
      createdAt: now,
      updatedAt: now,
    },
    // Text
    {
      id: 'sample-text',
      lessonId: 'sample',
      type: 'text',
      order: 3,
      content: 'HTML (HyperText Markup Language) — это стандартный язык разметки для создания веб-страниц. Он определяет структуру контента на странице с помощью тегов.',
      createdAt: now,
      updatedAt: now,
    },
    // Image + Text
    {
      id: 'sample-image-text',
      lessonId: 'sample',
      type: 'image_text',
      order: 4,
      content: 'Структура HTML-документа состоит из вложенных элементов, образующих дерево.',
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
      createdAt: now,
      updatedAt: now,
    },
    // Single choice
    {
      id: 'sample-single-choice',
      lessonId: 'sample',
      type: 'single_choice',
      order: 5,
      content: 'Какой тег используется для создания ссылки?',
      options: [
        { id: 'opt1', text: '<a>', isCorrect: true },
        { id: 'opt2', text: '<link>', isCorrect: false },
        { id: 'opt3', text: '<href>', isCorrect: false },
        { id: 'opt4', text: '<url>', isCorrect: false },
      ],
      explanation: 'Тег <a> (anchor) создаёт гиперссылку на другую страницу.',
      explanationCorrect: 'Верно! Тег <a> используется для ссылок.',
      createdAt: now,
      updatedAt: now,
    },
    // Multiple choice
    {
      id: 'sample-multiple-choice',
      lessonId: 'sample',
      type: 'multiple_choice',
      order: 6,
      content: 'Какие из этих тегов являются блочными?',
      options: [
        { id: 'opt1', text: '<div>', isCorrect: true },
        { id: 'opt2', text: '<span>', isCorrect: false },
        { id: 'opt3', text: '<p>', isCorrect: true },
        { id: 'opt4', text: '<section>', isCorrect: true },
      ],
      explanation: '<span> — это строчный элемент.',
      explanationCorrect: 'Отлично! div, p и section — блочные элементы.',
      createdAt: now,
      updatedAt: now,
    },
    // True/False
    {
      id: 'sample-true-false',
      lessonId: 'sample',
      type: 'true_false',
      order: 7,
      content: 'Тег <img> требует закрывающий тег.',
      correctAnswer: false,
      explanation: '<img> — самозакрывающийся тег.',
      explanationCorrect: 'Правильно! <img> не требует закрывающего тега.',
      createdAt: now,
      updatedAt: now,
    },
    // Fill blank
    {
      id: 'sample-fill-blank',
      lessonId: 'sample',
      type: 'fill_blank',
      order: 8,
      content: 'Для создания заголовка первого уровня используется тег ___.',
      blankWord: 'h1',
      explanation: 'Теги h1-h6 создают заголовки разных уровней.',
      explanationCorrect: 'Верно! <h1> — заголовок первого уровня.',
      createdAt: now,
      updatedAt: now,
    },
    // Matching
    {
      id: 'sample-matching',
      lessonId: 'sample',
      type: 'matching',
      order: 9,
      content: 'Соедините теги с их назначением:',
      matchingPairs: [
        { id: 'pair1', left: '<ul>', right: 'Маркированный список' },
        { id: 'pair2', left: '<ol>', right: 'Нумерованный список' },
        { id: 'pair3', left: '<table>', right: 'Таблица' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    // Ordering
    {
      id: 'sample-ordering',
      lessonId: 'sample',
      type: 'ordering',
      order: 10,
      content: 'Расположите теги в правильном порядке вложенности:',
      orderingItems: ['<body>', '<html>', '<head>', '<!DOCTYPE html>'],
      correctOrder: ['<!DOCTYPE html>', '<html>', '<head>', '<body>'],
      createdAt: now,
      updatedAt: now,
    },
    // Slider
    {
      id: 'sample-slider',
      lessonId: 'sample',
      type: 'slider',
      order: 11,
      content: 'Сколько уровней заголовков в HTML?',
      sliderMin: 1,
      sliderMax: 10,
      sliderCorrect: 6,
      sliderStep: 1,
      explanation: 'В HTML есть заголовки от h1 до h6.',
      explanationCorrect: 'Отлично! В HTML 6 уровней заголовков.',
      createdAt: now,
      updatedAt: now,
    },
  ] as Slide[];
};

interface DesignPreviewBlocksProps {
  config: DesignSystemConfig;
}

export const DesignPreviewBlocks: React.FC<DesignPreviewBlocksProps> = ({ config }) => {
  const sampleSlides = createSampleSlides();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSlide = sampleSlides[selectedIndex];

  // Compute background style
  const bgStyle = config.backgroundType === 'gradient'
    ? `linear-gradient(${config.gradientAngle || 135}deg, hsl(${config.gradientFrom}), hsl(${config.gradientTo}))`
    : `hsl(${config.backgroundColor})`;

  return (
    <div className="h-full flex">
      {/* Left: Blocks list */}
      <div className="w-72 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Демо-блоки</h3>
          <p className="text-xs text-muted-foreground">{sampleSlides.length} блоков</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sampleSlides.map((slide, index) => {
            const Icon = iconMap[slide.type] || Layers;
            const isSelected = selectedIndex === index;
            
            return (
              <button
                key={slide.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                  isSelected 
                    ? "bg-primary/10 border-2 border-primary" 
                    : "hover:bg-muted border-2 border-transparent"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {blockLabels[slide.type] || slide.type}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {slide.content?.slice(0, 30) || 'Блок контента'}
                    {(slide.content?.length || 0) > 30 ? '...' : ''}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Fast View Preview */}
      <div className="flex-1 flex flex-col bg-muted/30">
        <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Fast View</span>
          <span className="text-xs text-muted-foreground">
            {selectedIndex + 1} / {sampleSlides.length}
          </span>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {/* Phone frame */}
          <div 
            className="w-full max-w-[390px] h-full max-h-[780px] rounded-[2.5rem] border-[6px] border-foreground/10 shadow-xl overflow-hidden flex flex-col"
            style={{ background: bgStyle }}
          >
            {/* Status bar */}
            <div className="h-10 flex items-center justify-center flex-shrink-0">
              <div className="w-20 h-5 bg-foreground/10 rounded-full" />
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((selectedIndex + 1) / sampleSlides.length) * 100}%`,
                    backgroundColor: `hsl(${config.primaryColor})`,
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <DesignSystemProvider config={config}>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SlideRenderer
                  slide={selectedSlide}
                  designSystem={config}
                />
              </div>
            </DesignSystemProvider>

            {/* Bottom button */}
            <div className="p-4 pb-6 flex-shrink-0" style={{ background: bgStyle }}>
              <div 
                className="w-full py-3.5 text-center font-semibold text-sm"
                style={{
                  backgroundColor: `hsl(${config.primaryColor})`,
                  color: `hsl(${config.primaryForeground})`,
                  borderRadius: config.buttonStyle === 'pill' ? '9999px' : config.buttonStyle === 'square' ? '0' : config.borderRadius,
                  boxShadow: config.buttonDepth === 'raised' 
                    ? `0 4px 0 0 hsl(${config.primaryColor} / 0.4)` 
                    : 'none',
                }}
              >
                Продолжить
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

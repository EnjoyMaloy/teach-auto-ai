import React, { useState } from 'react';
import { DesignSystemConfig } from '@/types/designSystem';
import { Slide } from '@/types/course';
import { Block, BlockType } from '@/types/blocks';
import { SubBlock } from '@/types/designBlock';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';
import { cn } from '@/lib/utils';
import { 
  Heading, Type, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, Layers
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  heading: Heading,
  text: Type,
  image_text: LayoutList,
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

// Convert Slide to Block for MobilePreviewFrame
const slideToBlock = (slide: Slide): Block => ({
  id: slide.id,
  lessonId: slide.lessonId,
  type: slide.type as BlockType,
  order: slide.order,
  content: slide.content,
  imageUrl: slide.imageUrl,
  videoUrl: slide.videoUrl,
  audioUrl: slide.audioUrl,
  options: slide.options,
  correctAnswer: slide.correctAnswer,
  explanation: slide.explanation,
  explanationCorrect: slide.explanationCorrect,
  explanationPartial: slide.explanationPartial,
  blankWord: slide.blankWord,
  matchingPairs: slide.matchingPairs,
  sliderMin: slide.sliderMin,
  sliderMax: slide.sliderMax,
  sliderCorrect: slide.sliderCorrect,
  sliderCorrectMax: slide.sliderCorrectMax,
  sliderStep: slide.sliderStep,
  orderingItems: slide.orderingItems,
  correctOrder: slide.correctOrder,
  subBlocks: (slide as any).subBlocks,
  backgroundColor: slide.backgroundColor,
  textColor: slide.textColor,
  textSize: (slide as any).textSize,
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt,
});

// Sample slides demonstrating all block types
const createSampleSlides = (): Slide[] => {
  const now = new Date();
  return [
    // Design block with ALL sub-block types
    {
      id: 'sample-design-intro',
      lessonId: 'sample',
      type: 'design',
      order: 1,
      content: '',
      subBlocks: [
        // Badge - 4 варианта с иконками Lucide
        {
          id: 'sub-badge',
          type: 'badge',
          order: 1,
          badges: [
            { id: '1', text: 'Square', iconType: 'lucide', iconValue: 'BookOpen' },
            { id: '2', text: 'Oval', iconType: 'lucide', iconValue: 'Sparkles' },
            { id: '3', text: 'Contrast', iconType: 'lucide', iconValue: 'Zap' },
            { id: '4', text: 'Pastel', iconType: 'lucide', iconValue: 'Heart' },
          ],
          badgeVariant: 'oval',
          badgeSize: 'large',
          badgeLayout: 'horizontal',
          textAlign: 'center',
        } as SubBlock,
        // Дополнительные бейджи для показа всех вариантов
        {
          id: 'sub-badge-square',
          type: 'badge',
          order: 2,
          badges: [
            { id: '1', text: 'Square стиль', iconType: 'lucide', iconValue: 'Star' },
          ],
          badgeVariant: 'square',
          badgeSize: 'large',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-badge-contrast',
          type: 'badge',
          order: 3,
          badges: [
            { id: '1', text: 'Contrast стиль', iconType: 'lucide', iconValue: 'Award' },
          ],
          badgeVariant: 'contrast',
          badgeSize: 'large',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-badge-pastel',
          type: 'badge',
          order: 4,
          badges: [
            { id: '1', text: 'Pastel стиль', iconType: 'lucide', iconValue: 'Palette' },
          ],
          badgeVariant: 'pastel',
          badgeSize: 'large',
          textAlign: 'center',
        } as SubBlock,
        // Heading
        {
          id: 'sub-heading',
          type: 'heading',
          order: 5,
          content: 'Все типы суб-блоков',
          textSize: 'xlarge',
          fontWeight: 'bold',
          textAlign: 'center',
        } as SubBlock,
        // Image
        {
          id: 'sub-image',
          type: 'image',
          order: 6,
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
          imageSize: 'medium',
          textAlign: 'center',
        } as SubBlock,
        // Text с форматированием - подложка Light
        {
          id: 'sub-text-light',
          type: 'text',
          order: 7,
          content: '<p>Подложка <strong>Light</strong> — <em>светлый</em> фон с <u>подчёркиванием</u></p>',
          textSize: 'medium',
          textAlign: 'center',
          backdrop: 'light',
          backdropRounded: true,
        } as SubBlock,
        // Text - подложка Dark
        {
          id: 'sub-text-dark',
          type: 'text',
          order: 8,
          content: '<p>Подложка <strong>Dark</strong> — <em>тёмный</em> фон</p>',
          textSize: 'medium',
          textAlign: 'center',
          backdrop: 'dark',
          backdropRounded: true,
        } as SubBlock,
        // Text - подложка Primary
        {
          id: 'sub-text-primary',
          type: 'text',
          order: 9,
          content: '<p>Подложка <strong>Primary</strong> — акцентный цвет</p>',
          textSize: 'medium',
          textAlign: 'center',
          backdrop: 'primary',
          backdropRounded: true,
        } as SubBlock,
        // Text - подложка Blur
        {
          id: 'sub-text-blur',
          type: 'text',
          order: 10,
          content: '<p>Подложка <strong>Blur</strong> — размытие</p>',
          textSize: 'medium',
          textAlign: 'center',
          backdrop: 'blur',
          backdropRounded: true,
        } as SubBlock,
        // Divider
        {
          id: 'sub-divider',
          type: 'divider',
          order: 11,
          dividerStyle: 'medium',
        } as SubBlock,
        // Table
        {
          id: 'sub-table',
          type: 'table',
          order: 12,
          tableData: [
            [{ id: 't1', content: 'Тип' }, { id: 't2', content: 'Описание' }],
            [{ id: 't3', content: 'Badge' }, { id: 't4', content: 'Метка' }],
            [{ id: 't5', content: 'Button' }, { id: 't6', content: 'Кнопка' }],
          ],
          tableStyle: 'striped',
          tableTextSize: 'small',
          textAlign: 'left',
        } as SubBlock,
        // Button
        {
          id: 'sub-button',
          type: 'button',
          order: 13,
          buttonLabel: 'Подробнее',
          buttonVariant: 'primary',
          buttonUrl: 'https://example.com',
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
  const selectedBlock = slideToBlock(selectedSlide);

  const handleContinue = () => {
    if (selectedIndex < sampleSlides.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

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

      {/* Right: Fast View using MobilePreviewFrame */}
      <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Fast View</span>
          <span className="text-xs text-muted-foreground">
            {selectedIndex + 1} / {sampleSlides.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <MobilePreviewFrame
            block={selectedBlock}
            lessonTitle="Демо-урок"
            blockIndex={selectedIndex}
            totalBlocks={sampleSlides.length}
            onContinue={handleContinue}
            designSystem={config}
            isReadOnly={true}
            isMuted={true}
          />
        </div>
      </div>
    </div>
  );
};

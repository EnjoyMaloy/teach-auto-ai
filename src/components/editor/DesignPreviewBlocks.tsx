import React from 'react';
import { DesignSystemConfig } from '@/types/designSystem';
import { DesignSystemProvider } from '@/components/runtime/DesignSystemProvider';
import { SlideRenderer } from '@/components/runtime/SlideRenderer';
import { Slide } from '@/types/course';
import { SubBlock } from '@/types/designBlock';

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
          badges: [{ id: '1', text: '🎨 Превью', iconType: 'none' }],
          badgeVariant: 'oval',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-heading',
          type: 'heading',
          order: 2,
          content: 'Дизайн-система',
          textSize: 'xlarge',
          fontWeight: 'bold',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub-text',
          type: 'text',
          order: 3,
          content: 'Так будет выглядеть ваш курс для учеников',
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
      content: 'Заголовок урока',
      createdAt: now,
      updatedAt: now,
    },
    // Text
    {
      id: 'sample-text',
      lessonId: 'sample',
      type: 'text',
      order: 3,
      content: 'Это пример текстового блока. Здесь может быть подробное описание материала урока с форматированием и акцентами.',
      createdAt: now,
      updatedAt: now,
    },
    // Image + Text
    {
      id: 'sample-image-text',
      lessonId: 'sample',
      type: 'image_text',
      order: 4,
      content: 'Подпись к изображению — краткое описание иллюстрации.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      createdAt: now,
      updatedAt: now,
    },
    // Single choice
    {
      id: 'sample-single-choice',
      lessonId: 'sample',
      type: 'single_choice',
      order: 5,
      content: 'Какой язык программирования самый популярный?',
      options: [
        { id: 'opt1', text: 'JavaScript', isCorrect: true },
        { id: 'opt2', text: 'Python', isCorrect: false },
        { id: 'opt3', text: 'Java', isCorrect: false },
        { id: 'opt4', text: 'C++', isCorrect: false },
      ],
      explanation: 'JavaScript остаётся самым используемым языком.',
      explanationCorrect: 'Верно! JavaScript лидирует.',
      createdAt: now,
      updatedAt: now,
    },
    // Multiple choice
    {
      id: 'sample-multiple-choice',
      lessonId: 'sample',
      type: 'multiple_choice',
      order: 6,
      content: 'Выберите все фреймворки JavaScript:',
      options: [
        { id: 'opt1', text: 'React', isCorrect: true },
        { id: 'opt2', text: 'Vue', isCorrect: true },
        { id: 'opt3', text: 'Django', isCorrect: false },
        { id: 'opt4', text: 'Angular', isCorrect: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    // True/False
    {
      id: 'sample-true-false',
      lessonId: 'sample',
      type: 'true_false',
      order: 7,
      content: 'TypeScript компилируется в JavaScript.',
      correctAnswer: true,
      createdAt: now,
      updatedAt: now,
    },
    // Fill blank
    {
      id: 'sample-fill-blank',
      lessonId: 'sample',
      type: 'fill_blank',
      order: 8,
      content: 'React использует виртуальный ___ для оптимизации.',
      blankWord: 'DOM',
      createdAt: now,
      updatedAt: now,
    },
    // Matching
    {
      id: 'sample-matching',
      lessonId: 'sample',
      type: 'matching',
      order: 9,
      content: 'Соедините технологии с их назначением:',
      matchingPairs: [
        { id: 'pair1', left: 'HTML', right: 'Структура' },
        { id: 'pair2', left: 'CSS', right: 'Стилизация' },
        { id: 'pair3', left: 'JS', right: 'Интерактивность' },
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
      content: 'Расположите этапы в правильном порядке:',
      orderingItems: ['Тестирование', 'Дизайн', 'Разработка', 'Анализ'],
      correctOrder: ['Анализ', 'Дизайн', 'Разработка', 'Тестирование'],
      createdAt: now,
      updatedAt: now,
    },
    // Slider
    {
      id: 'sample-slider',
      lessonId: 'sample',
      type: 'slider',
      order: 11,
      content: 'Сколько % кода должно покрываться тестами?',
      sliderMin: 0,
      sliderMax: 100,
      sliderCorrect: 80,
      sliderStep: 5,
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

  // Compute background style
  const bgStyle = config.backgroundType === 'gradient'
    ? `linear-gradient(${config.gradientAngle || 135}deg, hsl(${config.gradientFrom}), hsl(${config.gradientTo}))`
    : `hsl(${config.backgroundColor})`;

  return (
    <div className="h-full flex items-start justify-center p-6 overflow-y-auto">
      {/* Phone frame container */}
      <div 
        className="w-[390px] min-h-[844px] rounded-[2.5rem] border-[8px] border-foreground/10 shadow-2xl overflow-hidden flex flex-col"
        style={{ background: bgStyle }}
      >
        {/* Status bar */}
        <div className="h-12 flex items-center justify-center flex-shrink-0">
          <div className="w-24 h-6 bg-foreground/10 rounded-full" />
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: '100%',
                backgroundColor: `hsl(${config.primaryColor})`,
              }}
            />
          </div>
        </div>

        {/* Content area - all slides stacked */}
        <DesignSystemProvider config={config}>
          <div className="flex-1 overflow-y-auto">
            {sampleSlides.map((slide, index) => (
              <div 
                key={slide.id}
                className="border-b border-border/20 last:border-b-0"
              >
                {/* Block type indicator */}
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    {slide.type.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Slide content */}
                <div className="pointer-events-none">
                  <SlideRenderer
                    slide={slide}
                    designSystem={config}
                  />
                </div>
              </div>
            ))}
            
            {/* Bottom spacing */}
            <div className="h-24" />
          </div>
        </DesignSystemProvider>

        {/* Bottom button - fixed at bottom */}
        <div className="p-4 pb-8 flex-shrink-0" style={{ background: bgStyle }}>
          <div 
            className="w-full py-4 text-center font-semibold"
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
  );
};

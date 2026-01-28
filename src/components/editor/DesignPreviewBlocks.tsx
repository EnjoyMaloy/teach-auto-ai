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
    // Heading
    {
      id: 'sample-heading',
      lessonId: 'sample',
      type: 'heading',
      order: 1,
      content: 'Заголовок урока',
      createdAt: now,
      updatedAt: now,
    },
    // Text
    {
      id: 'sample-text',
      lessonId: 'sample',
      type: 'text',
      order: 2,
      content: 'Это пример текстового блока. Здесь может быть подробное описание материала урока с форматированием и акцентами.',
      createdAt: now,
      updatedAt: now,
    },
    // Image + Text
    {
      id: 'sample-image-text',
      lessonId: 'sample',
      type: 'image_text',
      order: 3,
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
      order: 4,
      content: 'Какой язык программирования самый популярный в 2024 году?',
      options: [
        { id: 'opt1', text: 'JavaScript', isCorrect: true },
        { id: 'opt2', text: 'Python', isCorrect: false },
        { id: 'opt3', text: 'Java', isCorrect: false },
        { id: 'opt4', text: 'C++', isCorrect: false },
      ],
      explanation: 'JavaScript остаётся самым используемым языком для веб-разработки.',
      explanationCorrect: 'Верно! JavaScript лидирует по популярности.',
      createdAt: now,
      updatedAt: now,
    },
    // Multiple choice
    {
      id: 'sample-multiple-choice',
      lessonId: 'sample',
      type: 'multiple_choice',
      order: 5,
      content: 'Выберите все фреймворки JavaScript:',
      options: [
        { id: 'opt1', text: 'React', isCorrect: true },
        { id: 'opt2', text: 'Vue', isCorrect: true },
        { id: 'opt3', text: 'Django', isCorrect: false },
        { id: 'opt4', text: 'Angular', isCorrect: true },
      ],
      explanation: 'Django — это Python фреймворк.',
      explanationCorrect: 'Отлично! React, Vue и Angular — JS фреймворки.',
      createdAt: now,
      updatedAt: now,
    },
    // True/False
    {
      id: 'sample-true-false',
      lessonId: 'sample',
      type: 'true_false',
      order: 6,
      content: 'TypeScript компилируется в JavaScript.',
      correctAnswer: true,
      explanation: 'TypeScript транспилируется в JavaScript для выполнения в браузере.',
      explanationCorrect: 'Правильно! TypeScript — надмножество JavaScript.',
      createdAt: now,
      updatedAt: now,
    },
    // Fill blank
    {
      id: 'sample-fill-blank',
      lessonId: 'sample',
      type: 'fill_blank',
      order: 7,
      content: 'React использует виртуальный ___ для оптимизации обновлений.',
      blankWord: 'DOM',
      explanation: 'Virtual DOM — ключевая концепция React.',
      explanationCorrect: 'Верно! Виртуальный DOM ускоряет рендеринг.',
      createdAt: now,
      updatedAt: now,
    },
    // Matching
    {
      id: 'sample-matching',
      lessonId: 'sample',
      type: 'matching',
      order: 8,
      content: 'Соедините технологии с их назначением:',
      matchingPairs: [
        { id: 'pair1', left: 'HTML', right: 'Структура' },
        { id: 'pair2', left: 'CSS', right: 'Стилизация' },
        { id: 'pair3', left: 'JavaScript', right: 'Интерактивность' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    // Ordering
    {
      id: 'sample-ordering',
      lessonId: 'sample',
      type: 'ordering',
      order: 9,
      content: 'Расположите этапы разработки в правильном порядке:',
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
      order: 10,
      content: 'Сколько процентов кода должно покрываться тестами?',
      sliderMin: 0,
      sliderMax: 100,
      sliderCorrect: 80,
      sliderStep: 5,
      explanation: 'Рекомендуется покрытие не менее 80%.',
      explanationCorrect: 'Отлично! 80% — хороший показатель.',
      createdAt: now,
      updatedAt: now,
    },
    // Design block
    {
      id: 'sample-design',
      lessonId: 'sample',
      type: 'design',
      order: 11,
      content: '',
      subBlocks: [
        {
          id: 'sub1',
          type: 'heading',
          order: 1,
          content: 'Дизайн-блок',
          textSize: 'xlarge',
          fontWeight: 'bold',
          textAlign: 'center',
        } as SubBlock,
        {
          id: 'sub2',
          type: 'text',
          order: 2,
          content: 'Составной блок с несколькими элементами для создания красивых слайдов.',
          textSize: 'medium',
          textAlign: 'center',
        } as SubBlock,
      ],
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

  return (
    <DesignSystemProvider config={config}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {sampleSlides.map((slide, index) => (
              <div 
                key={slide.id}
                className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
              >
                {/* Block type label */}
                <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-xs font-medium text-muted-foreground">
                  {slide.type.replace('_', ' ')}
                </div>
                
                {/* Phone frame preview */}
                <div 
                  className="aspect-[9/16] overflow-hidden"
                  style={{
                    background: config.backgroundType === 'gradient'
                      ? `linear-gradient(${config.gradientAngle || 135}deg, hsl(${config.gradientFrom}), hsl(${config.gradientTo}))`
                      : `hsl(${config.backgroundColor})`,
                  }}
                >
                  <div className="h-full flex flex-col">
                    {/* Status bar mock */}
                    <div className="h-6 flex items-center justify-center">
                      <div className="w-16 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    
                    {/* Progress bar mock */}
                    <div className="px-4 py-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${((index + 1) / sampleSlides.length) * 100}%`,
                            backgroundColor: `hsl(${config.primaryColor})`,
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-hidden pointer-events-none">
                      <SlideRenderer
                        slide={slide}
                        designSystem={config}
                      />
                    </div>
                    
                    {/* Bottom button mock */}
                    <div className="p-4 pb-6">
                      <div 
                        className="w-full py-3 rounded-xl text-center text-sm font-medium"
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
            ))}
          </div>
        </div>
      </div>
    </DesignSystemProvider>
  );
};

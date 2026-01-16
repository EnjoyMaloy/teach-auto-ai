import React from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { 
  Play, Volume2, Check, X,
  ChevronRight
} from 'lucide-react';

interface MobilePreviewFrameProps {
  block: Block | null;
  lessonTitle?: string;
  blockIndex?: number;
  totalBlocks?: number;
}

export const MobilePreviewFrame: React.FC<MobilePreviewFrameProps> = ({
  block,
  lessonTitle = 'Урок',
  blockIndex = 0,
  totalBlocks = 1,
}) => {
  if (!block) {
    return (
      <div className="relative w-full max-w-[375px] mx-auto">
        {/* Phone frame */}
        <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/16] flex items-center justify-center">
            <p className="text-muted-foreground text-center px-8">
              Выберите блок для предпросмотра
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = BLOCK_CONFIGS[block.type];

  const renderContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <h1 className="text-2xl font-bold text-center">
              {block.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text':
        return (
          <div className="flex-1 flex items-center p-6">
            <p className="text-base leading-relaxed">
              {block.content || 'Текст блока...'}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            {block.imageUrl ? (
              <img 
                src={block.imageUrl} 
                alt="" 
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center">
                <span className="text-muted-foreground">Нет изображения</span>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-12 h-12 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              {block.content || 'Аудио файл'}
            </p>
            {/* Fake waveform */}
            <div className="w-full h-12 flex items-center justify-center gap-0.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/30 rounded-full"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        );

      case 'image_text':
        return (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-muted flex items-center justify-center">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground">Изображение</span>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm">{block.content || 'Описание к картинке...'}</p>
            </div>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-medium mb-4 text-center">
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option, idx) => (
                <button
                  key={option.id}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all',
                    'border-2',
                    option.isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  )}
                >
                  <span className="font-medium">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-medium mb-6 text-center flex-1 flex items-center justify-center">
              {block.content || 'Утверждение верно?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className={cn(
                'p-4 rounded-xl flex flex-col items-center gap-2',
                block.correctAnswer === true
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-muted'
              )}>
                <Check className="w-8 h-8" />
                <span className="font-medium">Да</span>
              </button>
              <button className={cn(
                'p-4 rounded-xl flex flex-col items-center gap-2',
                block.correctAnswer === false
                  ? 'bg-red-100 border-2 border-red-500'
                  : 'bg-muted'
              )}>
                <X className="w-8 h-8" />
                <span className="font-medium">Нет</span>
              </button>
            </div>
          </div>
        );

      case 'fill_blank':
        const parts = (block.content || 'Вставьте ___ слово').split('___');
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <p className="text-lg text-center">
              {parts[0]}
              <span className="inline-block mx-1 px-4 py-1 bg-primary/10 border-b-2 border-primary rounded">
                {block.blankWord || '...'}
              </span>
              {parts[1]}
            </p>
          </div>
        );

      case 'slider':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <p className="text-lg font-medium text-center">
              {block.content || 'Выберите значение'}
            </p>
            <div className="w-full">
              <input
                type="range"
                min={block.sliderMin || 0}
                max={block.sliderMax || 100}
                value={block.sliderCorrect || 50}
                className="w-full"
                readOnly
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{block.sliderMin || 0}</span>
                <span className="font-bold text-foreground">{block.sliderCorrect || 50}</span>
                <span>{block.sliderMax || 100}</span>
              </div>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-medium mb-4 text-center">
              {block.content || 'Соедините пары'}
            </p>
            <div className="space-y-3">
              {(block.matchingPairs || []).map((pair) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-xl text-sm">
                    {pair.left}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 p-3 bg-primary/10 rounded-xl text-sm">
                    {pair.right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ordering':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-medium mb-4 text-center">
              {block.content || 'Расположите в порядке'}
            </p>
            <div className="space-y-2">
              {(block.orderingItems || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                >
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hotspot':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-medium mb-4 text-center">
              {block.content || 'Нажмите на правильные области'}
            </p>
            <div className="flex-1 relative bg-muted rounded-xl overflow-hidden">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">Загрузите изображение</span>
                </div>
              )}
              {/* Hotspot areas preview */}
              {(block.hotspotAreas || []).map((area) => (
                <div
                  key={area.id}
                  className="absolute border-2 border-primary bg-primary/20 rounded-lg"
                  style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`,
                    width: `${area.width}%`,
                    height: `${area.height}%`,
                  }}
                />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Предпросмотр недоступен</p>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-[375px] mx-auto">
      {/* Phone frame */}
      <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/16] flex flex-col">
          {/* Status bar */}
          <div className="h-12 flex items-end justify-center pb-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalBlocks }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    i === blockIndex
                      ? 'w-6 bg-primary'
                      : i < blockIndex
                        ? 'w-2 bg-primary/50'
                        : 'w-2 bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Bottom navigation */}
          <div className="h-16 border-t border-border flex items-center justify-center px-4">
            <button className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold">
              Продолжить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      <div className="w-full max-w-[320px] mx-auto">
        <div className="bg-card rounded-2xl overflow-hidden aspect-[9/16] flex items-center justify-center border border-border shadow-lg">
          <div className="text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
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
            <h1 className="text-2xl font-bold text-center text-foreground">
              {block.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text':
        return (
          <div className="flex-1 flex items-center p-6">
            <p className="text-base leading-relaxed text-foreground">
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
              <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                <span className="text-muted-foreground text-sm">Нет изображения</span>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full aspect-video bg-foreground rounded-2xl flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-primary" />
            </div>
            <p className="text-center text-foreground font-medium">
              {block.content || 'Аудио файл'}
            </p>
            {/* Fake waveform */}
            <div className="w-full h-10 flex items-center justify-center gap-0.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/40 rounded-full"
                  style={{ height: `${20 + Math.random() * 80}%` }}
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
            <div className="p-4 bg-card">
              <p className="text-sm text-foreground">{block.content || 'Описание к картинке...'}</p>
            </div>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option) => (
                <button
                  key={option.id}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-all text-sm',
                    'border-2',
                    option.isCorrect
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border bg-card text-foreground'
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
            <p className="text-lg font-semibold mb-6 text-center flex-1 flex items-center justify-center text-foreground">
              {block.content || 'Утверждение верно?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className={cn(
                'p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all',
                block.correctAnswer === true
                  ? 'bg-success/10 border-success text-success'
                  : 'bg-card border-border text-foreground'
              )}>
                <Check className="w-8 h-8" />
                <span className="font-semibold">Да</span>
              </button>
              <button className={cn(
                'p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all',
                block.correctAnswer === false
                  ? 'bg-destructive/10 border-destructive text-destructive'
                  : 'bg-card border-border text-foreground'
              )}>
                <X className="w-8 h-8" />
                <span className="font-semibold">Нет</span>
              </button>
            </div>
          </div>
        );

      case 'fill_blank':
        const parts = (block.content || 'Вставьте ___ слово').split('___');
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <p className="text-lg text-center text-foreground">
              {parts[0]}
              <span className="inline-block mx-1 px-4 py-1 bg-primary/10 border-b-2 border-primary rounded-lg text-primary font-medium">
                {block.blankWord || '...'}
              </span>
              {parts[1]}
            </p>
          </div>
        );

      case 'slider':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <p className="text-lg font-semibold text-center text-foreground">
              {block.content || 'Выберите значение'}
            </p>
            <div className="w-full">
              <input
                type="range"
                min={block.sliderMin || 0}
                max={block.sliderMax || 100}
                value={block.sliderCorrect || 50}
                className="w-full accent-primary"
                readOnly
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{block.sliderMin || 0}</span>
                <span className="font-bold text-primary">{block.sliderCorrect || 50}</span>
                <span>{block.sliderMax || 100}</span>
              </div>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Соедините пары'}
            </p>
            <div className="space-y-2">
              {(block.matchingPairs || []).map((pair) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 bg-muted rounded-xl text-xs font-medium text-foreground">
                    {pair.left}
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary" />
                  <div className="flex-1 p-2.5 bg-primary/10 rounded-xl text-xs font-medium text-primary">
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
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Расположите в порядке'}
            </p>
            <div className="space-y-2">
              {(block.orderingItems || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
                >
                  <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hotspot':
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Нажмите на правильные области'}
            </p>
            <div className="flex-1 relative bg-muted rounded-xl overflow-hidden border border-border">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Загрузите изображение</span>
                </div>
              )}
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
    <div className="w-full max-w-[320px] mx-auto">
      <div className="bg-card rounded-2xl overflow-hidden aspect-[9/16] flex flex-col border border-border shadow-lg">
        {/* Progress bar */}
        <div className="h-8 flex items-center justify-center bg-muted/30">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalBlocks }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all',
                  i === blockIndex
                    ? 'w-5 bg-primary'
                    : i < blockIndex
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-border'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Bottom navigation */}
        <div className="h-14 border-t border-border flex items-center justify-center px-4 bg-card">
          <button className="w-full h-10 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-sm">
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
};

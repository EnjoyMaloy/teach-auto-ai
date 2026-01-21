import React, { useState } from 'react';
import { Check, X, Lightbulb, ArrowRight } from 'lucide-react';
import { Slide } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlideRendererProps {
  slide: Slide;
  onAnswer?: (isCorrect: boolean) => void;
  onNext?: () => void;
  onCheck?: () => void;
  showResult?: boolean;
  hideActions?: boolean;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  onAnswer,
  onNext,
  showResult = false,
  hideActions = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (answered) return;
    
    if (slide.type === 'single_choice' || slide.type === 'true_false') {
      setSelectedOptions([optionId]);
    } else if (slide.type === 'multiple_choice') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const checkAnswer = () => {
    let correct = false;
    
    if (slide.type === 'single_choice') {
      correct = selectedOptions[0] === slide.correctAnswer;
    } else if (slide.type === 'multiple_choice') {
      const correctAnswers = slide.correctAnswer as string[];
      correct = selectedOptions.length === correctAnswers.length &&
        selectedOptions.every(id => correctAnswers.includes(id));
    } else if (slide.type === 'true_false') {
      const isTrue = selectedOptions[0] === 'true';
      correct = isTrue === slide.correctAnswer;
    } else if (slide.type === 'fill_blank') {
      correct = textAnswer.toLowerCase().trim() === (slide.correctAnswer as string).toLowerCase();
    }
    
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer?.(correct);
  };

  const renderContent = () => {
    switch (slide.type) {
      case 'heading':
        return (
          <div className="h-full flex items-center justify-center p-8">
            <h1 
              className="text-3xl font-bold text-center leading-tight"
              style={{ 
                color: `hsl(var(--ds-foreground, var(--foreground)))`,
                fontFamily: `var(--ds-heading-font-family, inherit)`,
              }}
            >
              {slide.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text':
        return (
          <div className="h-full flex items-center justify-center p-8">
            <p 
              className="text-base leading-relaxed text-center"
              style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
            >
              {slide.content}
            </p>
          </div>
        );

      case 'video':
        return (
          <div className="h-full w-full flex items-center justify-center overflow-hidden bg-black">
            {slide.videoUrl ? (
              <video src={slide.videoUrl} controls className="w-full h-full object-contain" playsInline />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                <span className="text-sm">Загрузите видео</span>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `hsl(var(--ds-muted, var(--muted)))` }}
            >
              <span className="text-2xl">🎵</span>
            </div>
            <p 
              className="text-center font-medium"
              style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
            >
              {slide.content || 'Аудио'}
            </p>
            {slide.audioUrl && (
              <audio src={slide.audioUrl} controls className="w-full max-w-xs" />
            )}
          </div>
        );

      case 'image_text':
        return (
          <div className="flex-1 flex flex-col h-full">
            {slide.imageUrl && (
              <div className="flex-1 bg-muted flex items-center justify-center overflow-hidden">
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div 
              className={`p-4 ${!slide.imageUrl ? 'flex-1 flex items-center' : ''}`}
              style={{ backgroundColor: `hsl(var(--ds-card, var(--card)))` }}
            >
              <p 
                className="text-sm"
                style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
              >
                {slide.content || 'Описание к картинке...'}
              </p>
            </div>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content}</p>
            <div className="space-y-2">
              {slide.options?.map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const showCorrect = answered && option.isCorrect;
                const showIncorrect = answered && isSelected && !option.isCorrect;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={answered}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left transition-all duration-200 flex items-center justify-between text-sm',
                      !answered && isSelected && 'border-primary bg-primary/10',
                      !answered && !isSelected && 'border-border hover:border-primary/50',
                      showCorrect && 'border-success bg-success/10',
                      showIncorrect && 'border-destructive bg-destructive/10'
                    )}
                  >
                    <span className="font-medium">{option.text}</span>
                    {showCorrect && <Check className="w-4 h-4 text-success" />}
                    {showIncorrect && <X className="w-4 h-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content}</p>
            <div className="flex gap-3 justify-center">
              {[
                { id: 'true', label: 'Верно' },
                { id: 'false', label: 'Неверно' },
              ].map(option => {
                const isSelected = selectedOptions.includes(option.id);
                const correctValue = slide.correctAnswer ? 'true' : 'false';
                const showCorrect = answered && option.id === correctValue;
                const showIncorrect = answered && isSelected && option.id !== correctValue;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={answered}
                    className={cn(
                      'flex-1 max-w-[140px] p-3 rounded-lg border-2 font-medium transition-all duration-200 text-sm',
                      !answered && isSelected && 'border-primary bg-primary/10',
                      !answered && !isSelected && 'border-border hover:border-primary/50',
                      showCorrect && 'border-success bg-success/10',
                      showIncorrect && 'border-destructive bg-destructive/10'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'fill_blank':
        const parts = slide.content.split('___');
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">
              {parts[0]}
              <span className="inline-block mx-1">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={answered}
                  className={cn(
                    'border-b-2 px-2 py-0.5 text-center outline-none bg-transparent min-w-[80px] text-sm',
                    !answered && 'border-primary',
                    answered && isCorrect && 'border-success text-success',
                    answered && !isCorrect && 'border-destructive text-destructive'
                  )}
                  placeholder="..."
                />
              </span>
              {parts[1]}
            </p>
            {answered && !isCorrect && (
              <p className="text-center text-xs text-muted-foreground">
                Правильный ответ: <strong className="text-success">{slide.blankWord || slide.correctAnswer as string}</strong>
              </p>
            )}
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4 py-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content || 'Выберите значение'}</p>
            <div className="w-full">
              <input
                type="range"
                min={slide.sliderMin || 0}
                max={slide.sliderMax || 100}
                step={slide.sliderStep || 1}
                value={textAnswer || slide.sliderMin || 0}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={answered}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{slide.sliderMin || 0}</span>
                <span className="font-bold text-primary">{textAnswer || slide.sliderMin || 0}</span>
                <span>{slide.sliderMax || 100}</span>
              </div>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content || 'Соедините пары'}</p>
            <div className="space-y-2 w-full">
              {slide.matchingPairs?.map((pair) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded-lg text-xs font-medium">
                    {pair.left}
                  </div>
                  <span className="text-primary text-xs">→</span>
                  <div className="flex-1 p-2 bg-primary/10 rounded-lg text-xs font-medium text-primary">
                    {pair.right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ordering':
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content || 'Расположите в порядке'}</p>
            <div className="space-y-1.5 w-full">
              {slide.orderingItems?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
                  <span className="w-5 h-5 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hotspot':
        return (
          <div className="space-y-4">
            <p className="text-base font-medium text-center text-foreground">{slide.content || 'Нажмите на области'}</p>
            <div className="relative bg-muted rounded-lg overflow-hidden max-h-[35vh] aspect-video mx-auto">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Нет изображения</span>
                </div>
              )}
              {slide.hotspotAreas?.map((area) => (
                <div
                  key={area.id}
                  className="absolute border-2 border-primary bg-primary/20 rounded cursor-pointer hover:bg-primary/40 transition-colors"
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
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">Тип блока не поддерживается</p>
          </div>
        );
    }
  };

  const needsCheck = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider'].includes(slide.type);
  const canCheck = (selectedOptions.length > 0 || textAnswer.trim() !== '') && !answered;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {renderContent()}

        {/* Explanation */}
        {answered && slide.explanation && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-primary/5 flex items-start gap-2 animate-fade-up">
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary text-xs mb-0.5">Объяснение</p>
              <p className="text-xs text-foreground">{slide.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions - only show if not hidden */}
      {!hideActions && (
        <div className="mt-4 flex justify-center gap-3">
          {needsCheck && !answered && (
            <Button onClick={checkAnswer} disabled={!canCheck} size="sm" className="font-bold uppercase tracking-wide">
              ПРОВЕРИТЬ
            </Button>
          )}
          {(answered || !needsCheck) && (
            <Button onClick={onNext} size="sm" className="animate-bounce-subtle font-bold uppercase tracking-wide">
              ДАЛЕЕ
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Export helper to check if slide needs checking
export const slideNeedsCheck = (slideType: string) => 
  ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider'].includes(slideType);

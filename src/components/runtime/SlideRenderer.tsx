import React, { useState } from 'react';
import { Check, X, Lightbulb, ArrowRight } from 'lucide-react';
import { Slide } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlideRendererProps {
  slide: Slide;
  onAnswer?: (isCorrect: boolean) => void;
  onNext?: () => void;
  showResult?: boolean;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  onAnswer,
  onNext,
  showResult = false,
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
      case 'text':
        return (
          <div className="text-center py-8">
            <p className="text-xl leading-relaxed text-foreground">{slide.content}</p>
          </div>
        );

      case 'image_text':
        return (
          <div className="space-y-6">
            <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center overflow-hidden">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground">Изображение</span>
              )}
            </div>
            <p className="text-lg text-center text-foreground">{slide.content}</p>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="space-y-6">
            <p className="text-xl font-medium text-center text-foreground">{slide.content}</p>
            <div className="space-y-3">
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
                      'w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between',
                      !answered && isSelected && 'border-primary bg-primary-light',
                      !answered && !isSelected && 'border-border hover:border-primary/50',
                      showCorrect && 'border-success bg-success-light',
                      showIncorrect && 'border-destructive bg-destructive-light'
                    )}
                  >
                    <span className="font-medium">{option.text}</span>
                    {showCorrect && <Check className="w-5 h-5 text-success" />}
                    {showIncorrect && <X className="w-5 h-5 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-6">
            <p className="text-xl font-medium text-center text-foreground">{slide.content}</p>
            <div className="flex gap-4 justify-center">
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
                      'flex-1 max-w-[200px] p-4 rounded-xl border-2 font-medium transition-all duration-200',
                      !answered && isSelected && 'border-primary bg-primary-light',
                      !answered && !isSelected && 'border-border hover:border-primary/50',
                      showCorrect && 'border-success bg-success-light',
                      showIncorrect && 'border-destructive bg-destructive-light'
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
          <div className="space-y-6">
            <p className="text-xl font-medium text-center text-foreground">
              {parts[0]}
              <span className="inline-block mx-2">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={answered}
                  className={cn(
                    'border-b-2 px-2 py-1 text-center outline-none bg-transparent min-w-[120px]',
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
              <p className="text-center text-sm text-muted-foreground">
                Правильный ответ: <strong className="text-success">{slide.correctAnswer as string}</strong>
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const needsCheck = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank'].includes(slide.type);
  const canCheck = (selectedOptions.length > 0 || textAnswer.trim()) && !answered;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="slide-card">
        {renderContent()}

        {/* Explanation */}
        {answered && slide.explanation && (
          <div className="mt-6 p-4 rounded-xl bg-ai-light flex items-start gap-3 animate-fade-up">
            <Lightbulb className="w-5 h-5 text-ai flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-ai text-sm mb-1">Объяснение</p>
              <p className="text-sm text-foreground">{slide.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-center gap-4">
        {needsCheck && !answered && (
          <Button onClick={checkAnswer} disabled={!canCheck} size="lg">
            Проверить
          </Button>
        )}
        {(answered || !needsCheck) && (
          <Button onClick={onNext} size="lg" className="animate-bounce-subtle">
            Далее
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

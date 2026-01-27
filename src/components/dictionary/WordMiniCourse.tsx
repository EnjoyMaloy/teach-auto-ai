import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordMiniCourseProps {
  word: {
    id: string;
    term: string;
    definition: string;
    image_url: string | null;
    difficulty_easy_content: any;
    difficulty_medium_content: any;
    difficulty_hard_content: any;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: () => void;
  onClose: () => void;
}

interface Slide {
  type: 'info' | 'quiz' | 'fill_blank';
  content?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | number;
  blankWord?: string;
}

const WordMiniCourse: React.FC<WordMiniCourseProps> = ({
  word,
  difficulty,
  onComplete,
  onClose
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Get slides based on difficulty
  const getSlides = (): Slide[] => {
    const content = difficulty === 'easy' 
      ? word.difficulty_easy_content 
      : difficulty === 'medium' 
        ? word.difficulty_medium_content 
        : word.difficulty_hard_content;
    
    if (content?.slides && Array.isArray(content.slides)) {
      return content.slides;
    }
    
    // Fallback content if no slides
    return [
      {
        type: 'info' as const,
        content: `**${word.term}** — ${word.definition}`
      },
      {
        type: 'quiz' as const,
        content: '',
        question: `Что означает термин "${word.term}"?`,
        options: [word.definition, 'Другое определение', 'Неизвестный термин', 'Ни один из вариантов'],
        correctAnswer: 0
      },
      {
        type: 'fill_blank' as const,
        content: `Дополните: ___ — ${word.definition.slice(0, 50)}...`,
        blankWord: word.term.toLowerCase()
      }
    ];
  };

  const slides = getSlides();
  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const handleQuizSubmit = () => {
    if (slide.type === 'quiz' && selectedAnswer !== null) {
      const correct = parseInt(selectedAnswer) === slide.correctAnswer;
      setIsCorrect(correct);
      setShowResult(true);
    } else if (slide.type === 'fill_blank') {
      const correct = fillAnswer.toLowerCase().trim() === slide.blankWord?.toLowerCase();
      setIsCorrect(correct);
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setSelectedAnswer(null);
      setFillAnswer('');
      setShowResult(false);
    } else {
      setCompleted(true);
      onComplete();
    }
  };

  const handleContinue = () => {
    if (showResult) {
      handleNext();
    } else if (slide.type === 'info') {
      handleNext();
    } else {
      handleQuizSubmit();
    }
  };

  if (completed) {
    return (
      <div className="p-8 text-center relative overflow-hidden">
        {/* Background celebration */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 animate-scale-in">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            Отлично!
          </h3>
          <p className="text-muted-foreground mb-8">
            Вы успешно прошли уровень <span className="font-semibold text-foreground">"{difficulty === 'easy' ? 'Лёгкий' : difficulty === 'medium' ? 'Средний' : 'Сложный'}"</span>
          </p>
          <Button 
            onClick={onClose} 
            className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            Продолжить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Progress */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground min-w-[40px] text-right">
            {currentSlide + 1}/{slides.length}
          </span>
        </div>
      </div>

      {/* Background Image */}
      {word.image_url && (
        <div 
          className="h-36 mx-5 rounded-2xl overflow-hidden relative group"
        >
          <div 
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `url(${word.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {slide.type === 'info' && slide.content && (
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-base leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ 
                __html: slide.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
        )}

        {slide.type === 'quiz' && (
          <div className="space-y-5">
            <h4 className="font-display font-semibold text-lg">{slide.question}</h4>
            
            <RadioGroup 
              value={selectedAnswer || ''} 
              onValueChange={setSelectedAnswer}
              disabled={showResult}
              className="space-y-3"
            >
              {slide.options?.map((option, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                    showResult && idx === slide.correctAnswer && "bg-green-50 border-green-500 dark:bg-green-500/10",
                    showResult && selectedAnswer === String(idx) && idx !== slide.correctAnswer && "bg-red-50 border-red-500 dark:bg-red-500/10",
                    !showResult && selectedAnswer === String(idx) && "bg-primary/5 border-primary shadow-md shadow-primary/10",
                    !showResult && selectedAnswer !== String(idx) && "hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <RadioGroupItem value={String(idx)} id={`option-${idx}`} className="border-2" />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 cursor-pointer text-sm font-medium"
                  >
                    {option}
                  </Label>
                  {showResult && idx === slide.correctAnswer && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {showResult && selectedAnswer === String(idx) && idx !== slide.correctAnswer && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {slide.type === 'fill_blank' && (
          <div className="space-y-5">
            {slide.content && (
              <div 
                className="text-base leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: slide.content.replace(/___/g, '<span class="inline-block w-28 border-b-2 border-primary/50 mx-1"></span>')
                }}
              />
            )}
            
            <div className="relative">
              <Input
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="Введите ответ..."
                disabled={showResult}
                className={cn(
                  "h-12 rounded-xl border-2 text-base px-4 transition-all",
                  showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-500/10",
                  showResult && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-500/10",
                  !showResult && "focus:border-primary focus:shadow-md focus:shadow-primary/10"
                )}
              />
              {showResult && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCorrect ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {showResult && !isCorrect && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Правильный ответ: <strong className="text-foreground">{slide.blankWord}</strong>
              </p>
            )}
          </div>
        )}

        {/* Result Feedback */}
        {showResult && (
          <div className={cn(
            "mt-5 p-4 rounded-xl text-center animate-scale-in",
            isCorrect ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10" : "bg-gradient-to-r from-red-500/10 to-rose-500/10"
          )}>
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-semibold text-green-600 dark:text-green-400">Правильно!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-semibold text-red-600 dark:text-red-400">Неправильно</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-5 border-t border-border/50 bg-gradient-to-t from-muted/20 to-transparent">
        <Button 
          onClick={handleContinue}
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          disabled={
            (slide.type === 'quiz' && !selectedAnswer && !showResult) ||
            (slide.type === 'fill_blank' && !fillAnswer.trim() && !showResult)
          }
        >
          {showResult || slide.type === 'info' ? (
            <>
              {currentSlide < slides.length - 1 ? 'Далее' : 'Завершить'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            'Проверить'
          )}
        </Button>
      </div>
    </div>
  );
};

export default WordMiniCourse;

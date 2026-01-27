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
      <div className="p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Отлично!</h3>
        <p className="text-muted-foreground mb-6">
          Вы успешно прошли уровень "{difficulty === 'easy' ? 'Лёгкий' : difficulty === 'medium' ? 'Средний' : 'Сложный'}"
        </p>
        <Button onClick={onClose} className="w-full">
          Продолжить
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Progress */}
      <div className="px-4 py-2">
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-muted-foreground text-center mt-1">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Background Image */}
      {word.image_url && (
        <div 
          className="h-32 mx-4 rounded-lg overflow-hidden"
          style={{
            backgroundImage: `url(${word.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {slide.type === 'info' && (
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-base leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: slide.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
        )}

        {slide.type === 'quiz' && (
          <div className="space-y-4">
            <h4 className="font-medium text-base">{slide.question}</h4>
            
            <RadioGroup 
              value={selectedAnswer || ''} 
              onValueChange={setSelectedAnswer}
              disabled={showResult}
            >
              {slide.options?.map((option, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                    showResult && idx === slide.correctAnswer && "bg-green-50 border-green-500",
                    showResult && selectedAnswer === String(idx) && idx !== slide.correctAnswer && "bg-red-50 border-red-500",
                    !showResult && selectedAnswer === String(idx) && "bg-primary/10 border-primary"
                  )}
                >
                  <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {option}
                  </Label>
                  {showResult && idx === slide.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && selectedAnswer === String(idx) && idx !== slide.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {slide.type === 'fill_blank' && (
          <div className="space-y-4">
            <div 
              className="text-base leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: slide.content.replace(/___/g, '<span class="inline-block w-24 border-b-2 border-primary mx-1"></span>')
              }}
            />
            
            <div className="relative">
              <Input
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="Введите ответ..."
                disabled={showResult}
                className={cn(
                  showResult && isCorrect && "border-green-500 bg-green-50",
                  showResult && !isCorrect && "border-red-500 bg-red-50"
                )}
              />
              {showResult && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {showResult && !isCorrect && (
              <p className="text-sm text-muted-foreground">
                Правильный ответ: <strong>{slide.blankWord}</strong>
              </p>
            )}
          </div>
        )}

        {/* Result Feedback */}
        {showResult && (
          <div className={cn(
            "mt-4 p-4 rounded-lg text-center",
            isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            {isCorrect ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Правильно!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Неправильно</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-4 border-t">
        <Button 
          onClick={handleContinue}
          className="w-full"
          disabled={
            (slide.type === 'quiz' && !selectedAnswer && !showResult) ||
            (slide.type === 'fill_blank' && !fillAnswer.trim() && !showResult)
          }
        >
          {showResult || slide.type === 'info' ? (
            <>
              {currentSlide < slides.length - 1 ? 'Далее' : 'Завершить'}
              <ArrowRight className="w-4 h-4 ml-2" />
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

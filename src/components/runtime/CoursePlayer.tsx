import React, { useState, useCallback, useEffect } from 'react';
import { X, Trophy, Star, Clock } from 'lucide-react';
import { Course } from '@/types/course';
import { SlideRenderer, slideNeedsCheck } from './SlideRenderer';
import { DesignSystemProvider } from './DesignSystemProvider';
import { cn } from '@/lib/utils';
import { playSound, initAudioContext } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';

interface CoursePlayerProps {
  course: Course;
  onClose: () => void;
  /** If true, renders fullscreen without phone frame (for public/telegram view) */
  fullscreen?: boolean;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  onClose,
  fullscreen = false,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioInitialized) {
        initAudioContext();
        setAudioInitialized(true);
      }
    };
    
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioInitialized]);
  const allSlides = course.lessons.flatMap(lesson => lesson.slides);
  const totalSlides = allSlides.length;
  
  const currentLesson = course.lessons[currentLessonIndex];
  const currentSlide = currentLesson?.slides[currentSlideIndex];

  // Sound settings helper
  const soundConfig = {
    enabled: course.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  // Button depth and animation
  const isRaised = course.designSystem?.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  
  const getRaisedButtonStyle = () => {
    if (!isRaised) return {};
    const primaryColor = course.designSystem?.primaryColor || '262 83% 58%';
    return {
      boxShadow: `0 4px 0 0 hsl(${primaryColor} / 0.4), 0 6px 12px -2px hsl(${primaryColor} / 0.25)`,
    };
  };

  // Calculate progress
  const completedSlides = course.lessons
    .slice(0, currentLessonIndex)
    .reduce((acc, lesson) => acc + lesson.slides.length, 0) + currentSlideIndex;

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setTotalAnswers(prev => prev + 1);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      playSound('correct', soundConfig);
    } else {
      playSound('incorrect', soundConfig);
    }
    setAnswered(true);
  }, [soundConfig]);

  const handleNext = useCallback(() => {
    setAnswered(false);
    playSound('swipe', soundConfig);
    
    if (currentSlideIndex < currentLesson.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else if (currentLessonIndex < course.lessons.length - 1) {
      playSound('levelUp', soundConfig);
      setCurrentLessonIndex(prev => prev + 1);
      setCurrentSlideIndex(0);
    } else {
      playSound('complete', soundConfig);
      setIsCompleted(true);
    }
  }, [currentSlideIndex, currentLesson?.slides.length, currentLessonIndex, course.lessons.length, soundConfig]);

  const needsCheck = currentSlide ? slideNeedsCheck(currentSlide.type) : false;
  const showContinue = !needsCheck || answered;

  // Completion screen content
  const renderCompletionContent = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    
    return (
      <div className="text-center animate-scale-in max-w-sm w-full">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `hsl(var(--ds-success, var(--success)) / 0.1)` }}
        >
          <Trophy className="w-10 h-10" style={{ color: `hsl(var(--ds-success, var(--success)))` }} />
        </div>
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ 
            color: `hsl(var(--ds-foreground, var(--foreground)))`,
            fontFamily: `var(--ds-heading-font-family, inherit)`,
          }}
        >
          Курс пройден! 🎉
        </h1>
        <p className="text-sm mb-6" style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}>
          {course.title}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div 
            className="p-3 rounded-xl border"
            style={{ 
              backgroundColor: `hsl(var(--ds-muted, var(--muted)) / 0.5)`,
              borderColor: `hsl(var(--ds-muted, var(--border)))`,
            }}
          >
            <Star className="w-5 h-5 mx-auto mb-1" style={{ color: `hsl(var(--ds-primary, var(--primary)))` }} />
            <p className="text-xl font-bold" style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}>{accuracy}%</p>
            <p className="text-xs" style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}>Точность</p>
          </div>
          <div 
            className="p-3 rounded-xl border"
            style={{ 
              backgroundColor: `hsl(var(--ds-muted, var(--muted)) / 0.5)`,
              borderColor: `hsl(var(--ds-muted, var(--border)))`,
            }}
          >
            <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: `hsl(var(--ds-primary, var(--primary)))` }} />
            <p className="text-xl font-bold" style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}>{course.estimatedMinutes}</p>
            <p className="text-xs" style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}>Минут</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className={cn("w-full h-11 font-bold uppercase tracking-wide", pressAnimationClass)}
          style={{
            backgroundColor: `hsl(var(--ds-primary, var(--primary)))`,
            color: `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
            borderRadius: `var(--ds-button-radius, var(--radius))`,
            ...getRaisedButtonStyle(),
          }}
        >
          ЗАВЕРШИТЬ
        </button>
      </div>
    );
  };

  // Completion screen - fullscreen mode
  if (isCompleted && fullscreen) {
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
            fontFamily: `var(--ds-font-family, inherit)`,
          }}
        >
          {renderCompletionContent()}
        </div>
      </DesignSystemProvider>
    );
  }

  // Completion screen - preview mode (with phone frame)
  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-muted/50 z-50 flex items-center justify-center p-4">
        <DesignSystemProvider config={course.designSystem}>
          <div 
            className="h-[calc(100vh-64px)] w-[calc((100vh-64px)*9/16)] max-w-full rounded-xl overflow-hidden flex flex-col items-center justify-center border shadow-2xl p-6"
            style={{
              backgroundColor: `hsl(var(--ds-card, var(--card)))`,
              borderColor: `hsl(var(--ds-muted, var(--border)))`,
              fontFamily: `var(--ds-font-family, inherit)`,
            }}
          >
            {renderCompletionContent()}
          </div>
        </DesignSystemProvider>
      </div>
    );
  }

  // Main player content
  const playerContent = (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: `hsl(var(--ds-background, var(--background)))`,
        fontFamily: `var(--ds-font-family, inherit)`,
        borderRadius: 0,
      }}
    >
      {/* Progress bar - same style as editor */}
      <div 
        className="h-10 flex items-center justify-between px-4 border-b shrink-0"
        style={{
          backgroundColor: `hsl(var(--ds-muted, var(--muted)) / 0.3)`,
          borderColor: `hsl(var(--ds-muted, var(--border)))`,
        }}
      >
        <span 
          className="text-xs truncate max-w-[100px]"
          style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
        >
          {currentLesson?.title}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalSlides, 20) }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                height: '6px',
                width: i === completedSlides ? '24px' : '8px',
                backgroundColor: i <= completedSlides 
                  ? `hsl(var(--ds-primary, var(--primary))${i < completedSlides ? ' / 0.5' : ''})` 
                  : `hsl(var(--ds-muted, var(--muted)))`,
              }}
            />
          ))}
          {totalSlides > 20 && (
            <span 
              className="text-xs ml-1" 
              style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
            >
              +{totalSlides - 20}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {correctAnswers > 0 && (
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `hsl(var(--ds-success, var(--success)) / 0.1)`,
                color: `hsl(var(--ds-success, var(--success)))`,
              }}
            >
              <Star className="w-3 h-3" />
              {correctAnswers}
            </div>
          )}
          <span 
            className="text-xs"
            style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
          >
            {completedSlides + 1} / {totalSlides}
          </span>
        </div>
      </div>

      {/* Content */}
      <main 
        className="flex-1 overflow-hidden"
        style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
      >
        {currentSlide && (
          <SlideRenderer
            key={currentSlide.id}
            slide={currentSlide}
            onAnswer={handleAnswer}
            onNext={handleNext}
            hideActions={true}
          />
        )}
      </main>

      {/* Bottom action button */}
      <div 
        className="h-16 border-t flex items-center justify-center gap-3 px-4 shrink-0"
        style={{
          backgroundColor: `hsl(var(--ds-card, var(--card)))`,
          borderColor: `hsl(var(--ds-muted, var(--border)))`,
        }}
      >
        <button
          onClick={handleNext}
          disabled={needsCheck && !answered}
          className={cn(
            "flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50",
            pressAnimationClass
          )}
          style={{
            backgroundColor: `hsl(var(--ds-primary, var(--primary)))`,
            color: `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
            borderRadius: `var(--ds-button-radius, var(--radius))`,
            ...getRaisedButtonStyle(),
          }}
        >
          {showContinue ? 'ПРОДОЛЖИТЬ' : 'ПРОВЕРИТЬ'}
        </button>
      </div>
    </div>
  );

  // Fullscreen mode - no frame, just content (for Telegram/public view)
  if (fullscreen) {
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="fixed inset-0 z-50"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
          }}
        >
          {playerContent}
        </div>
      </DesignSystemProvider>
    );
  }

  // Preview mode - with phone frame
  return (
    <div className="fixed inset-0 bg-muted/50 z-50 flex items-center justify-center p-4">
      {/* Close button outside phone */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors shadow-lg z-10"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-[calc(100vh-64px)] w-[calc((100vh-64px)*9/16)] max-w-full rounded-xl overflow-hidden flex flex-col border shadow-2xl"
          style={{
            borderColor: `hsl(var(--ds-muted, var(--border)))`,
          }}
        >
          {playerContent}
        </div>
      </DesignSystemProvider>
    </div>
  );
};
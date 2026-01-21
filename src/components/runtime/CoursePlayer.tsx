import React, { useState, useCallback } from 'react';
import { X, Trophy, Star, Clock } from 'lucide-react';
import { Course, Slide } from '@/types/course';
import { DesignSystemProvider } from './DesignSystemProvider';
import { LessonMap } from './LessonMap';
import { MobilePreviewFrame } from '@/components/editor/blocks/MobilePreviewFrame';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';
import { Block, BlockType } from '@/types/blocks';

interface CoursePlayerProps {
  course: Course;
  onClose: () => void;
  /** If true, renders fullscreen without phone frame (for public/telegram view) */
  fullscreen?: boolean;
}

type PlayerView = 'map' | 'lesson';

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  onClose,
  fullscreen = false,
}) => {
  // View state: map or lesson
  const [currentView, setCurrentView] = useState<PlayerView>('map');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const currentLesson = course.lessons[currentLessonIndex];
  const currentSlide = currentLesson?.slides[currentSlideIndex];
  const totalSlidesInLesson = currentLesson?.slides.length || 0;

  // Sound settings helper
  const soundConfig = {
    enabled: course.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  // Button depth for completion screen
  const isRaised = course.designSystem?.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  
  const getRaisedButtonStyle = () => {
    if (!isRaised) return {};
    const primaryColor = course.designSystem?.primaryColor || '262 83% 58%';
    return {
      boxShadow: `0 4px 0 0 hsl(${primaryColor} / 0.4), 0 6px 12px -2px hsl(${primaryColor} / 0.25)`,
    };
  };

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
      // Next slide in current lesson
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Lesson completed
      playSound('levelUp', soundConfig);
      setCompletedLessons(prev => [...prev, currentLesson.id]);
      
      // Check if all lessons are completed
      const allCompleted = course.lessons.every(
        l => l.id === currentLesson.id || completedLessons.includes(l.id)
      );
      
      if (allCompleted) {
        playSound('complete', soundConfig);
        setIsCompleted(true);
      } else {
        // Go back to map
        setCurrentView('map');
        setCurrentSlideIndex(0);
      }
    }
  }, [currentSlideIndex, currentLesson, course.lessons, completedLessons, soundConfig]);

  const handleSelectLesson = useCallback((lessonId: string, lessonIndex: number) => {
    playSound('swipe', soundConfig);
    setCurrentLessonIndex(lessonIndex);
    setCurrentSlideIndex(0);
    setCurrentView('lesson');
  }, [soundConfig]);

  const handleBackToMap = useCallback(() => {
    playSound('swipe', soundConfig);
    setCurrentView('map');
    setCurrentSlideIndex(0);
  }, [soundConfig]);

  // Check if slide type requires checking (quiz types)
  const isInteractiveSlide = (type: string) => 
    ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering'].includes(type);
  
  const needsCheck = currentSlide ? isInteractiveSlide(currentSlide.type) : false;
  const showContinue = !needsCheck || answered;
  
  // Adapter: Convert Slide to Block for MobilePreviewFrame
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
    blankWord: slide.blankWord,
    matchingPairs: slide.matchingPairs,
    sliderMin: slide.sliderMin,
    sliderMax: slide.sliderMax,
    sliderCorrect: slide.sliderCorrect,
    sliderStep: slide.sliderStep,
    orderingItems: slide.orderingItems,
    correctOrder: slide.correctOrder,
    backgroundColor: slide.backgroundColor,
    textColor: slide.textColor,
    createdAt: slide.createdAt,
    updatedAt: slide.updatedAt,
  });

  // Reset course to start over
  const handleRestart = useCallback(() => {
    setCurrentLessonIndex(0);
    setCurrentSlideIndex(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setIsCompleted(false);
    setAnswered(false);
    setCompletedLessons([]);
    setCurrentView('map');
    playSound('swipe', soundConfig);
  }, [soundConfig]);

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

        {/* For fullscreen/Telegram mode - show restart button */}
        {fullscreen ? (
          <button 
            onClick={handleRestart} 
            className={cn("w-full h-11 font-bold uppercase tracking-wide", pressAnimationClass)}
            style={{
              backgroundColor: `hsl(var(--ds-primary, var(--primary)))`,
              color: `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
              borderRadius: `var(--ds-button-radius, var(--radius))`,
              ...getRaisedButtonStyle(),
            }}
          >
            ПРОЙТИ ЗАНОВО
          </button>
        ) : (
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
        )}
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

  // Check if running in Telegram
  const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp;

  // Lesson Map content
  const mapContent = (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: `hsl(var(--ds-background, var(--background)))`,
        fontFamily: `var(--ds-font-family, inherit)`,
      }}
    >
      {/* Top spacer with gray background for Telegram */}
      {fullscreen && isTelegram && (
        <div 
          className="shrink-0"
          style={{
            height: 'calc(env(safe-area-inset-top, 0px) + 8vh)',
            backgroundColor: `hsl(var(--ds-muted, var(--muted)) / 0.3)`,
          }}
        />
      )}
      
      {/* Header */}
      <div 
        className="h-14 flex items-center justify-center px-4 border-b shrink-0"
        style={{
          backgroundColor: `hsl(var(--ds-muted, var(--muted)) / 0.3)`,
          borderColor: `hsl(var(--ds-muted, var(--border)))`,
        }}
      >
        <h1 
          className="font-bold text-center truncate"
          style={{ 
            color: `hsl(var(--ds-foreground, var(--foreground)))`,
            fontFamily: `var(--ds-heading-font-family, inherit)`,
          }}
        >
          {course.title}
        </h1>
      </div>

      {/* Lesson Map */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingBottom: fullscreen && isTelegram ? 'calc(env(safe-area-inset-bottom, 0px) + 10%)' : undefined,
        }}
      >
        <LessonMap
          lessons={course.lessons}
          displayType={course.lessonsDisplayType || 'circle_map'}
          completedLessons={completedLessons}
          onSelectLesson={handleSelectLesson}
        />
      </div>
    </div>
  );

  // Lesson player content - use MobilePreviewFrame which works perfectly in editor preview
  const lessonContent = currentSlide ? (
    <MobilePreviewFrame
      key={currentSlide.id}
      block={slideToBlock(currentSlide)}
      lessonTitle={currentLesson?.title}
      blockIndex={currentSlideIndex}
      totalBlocks={totalSlidesInLesson}
      onContinue={handleNext}
      designSystem={course.designSystem}
      isMuted={false}
      isReadOnly={true}
      fillContainer={true}
      hideHeader={false}
    />
  ) : null;

  const playerContent = currentView === 'map' ? mapContent : lessonContent;

  // Fullscreen mode - fills parent container (for Telegram/public view)
  if (fullscreen) {
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-full w-full"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
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

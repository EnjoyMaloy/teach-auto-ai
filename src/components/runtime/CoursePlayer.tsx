import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Clock } from 'lucide-react';
import { Course, Slide } from '@/types/course';
import { DesignSystemProvider } from './DesignSystemProvider';
import { LessonMap } from './LessonMap';
import { MobilePreviewFrame } from '@/components/editor/blocks/MobilePreviewFrame';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';
import { Block, BlockType } from '@/types/blocks';
import { Button } from '@/components/ui/button';

interface CoursePlayerProps {
  course: Course;
  onClose: () => void;
  /** If true, renders fullscreen without phone frame (for public/telegram view) */
  fullscreen?: boolean;
}

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

type ViewMode = 'lesson' | 'map' | 'completed';

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  onClose,
  fullscreen = false,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  const currentLesson = course.lessons[currentLessonIndex];
  const blocks = currentLesson?.slides?.map(slideToBlock) || [];
  const currentBlock = blocks[currentBlockIndex] || null;

  // Sound settings
  const soundConfig = {
    enabled: course.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  // Button styling for completion screen
  const isRaised = course.designSystem?.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  
  const getRaisedButtonStyle = () => {
    if (!isRaised) return {};
    const primaryColor = course.designSystem?.primaryColor || '262 83% 58%';
    return {
      boxShadow: `0 4px 0 0 hsl(${primaryColor} / 0.4), 0 6px 12px -2px hsl(${primaryColor} / 0.25)`,
    };
  };

  const handleContinue = () => {
    playSound('swipe', soundConfig);
    
    if (currentBlockIndex < blocks.length - 1) {
      // Next block in current lesson
      setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      // Lesson completed - mark as completed and show map
      if (currentLesson && !completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
        playSound('levelUp', soundConfig);
      }
      
      // Check if all lessons completed
      const allCompleted = course.lessons.every(
        l => l.id === currentLesson.id || completedLessons.includes(l.id)
      );
      
      if (allCompleted) {
        playSound('complete', soundConfig);
        setViewMode('completed');
      } else {
        setViewMode('map');
      }
    }
  };

  const handleSelectLesson = (lessonId: string, lessonIndex: number) => {
    playSound('swipe', soundConfig);
    setCurrentLessonIndex(lessonIndex);
    setCurrentBlockIndex(0);
    setViewMode('lesson');
  };

  const handleRestart = () => {
    setCurrentLessonIndex(0);
    setCurrentBlockIndex(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setCompletedLessons([]);
    setViewMode('map');
    playSound('swipe', soundConfig);
  };

  const displayType = course.lessonsDisplayType || 'circle_map';

  // Completion screen
  const renderCompletionContent = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    const ds = course.designSystem;
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6">
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
              <p className="text-xl font-bold" style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}>{course.estimatedMinutes || 5}</p>
              <p className="text-xs" style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}>Минут</p>
            </div>
          </div>

          <button 
            onClick={fullscreen ? handleRestart : onClose} 
            className={cn("w-full h-11 font-bold uppercase tracking-wide", pressAnimationClass)}
            style={{
              backgroundColor: `hsl(var(--ds-primary, var(--primary)))`,
              color: `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
              borderRadius: `var(--ds-button-radius, var(--radius))`,
              ...getRaisedButtonStyle(),
            }}
          >
            {fullscreen ? 'ПРОЙТИ ЗАНОВО' : 'ЗАВЕРШИТЬ'}
          </button>
        </div>
      </div>
    );
  };

  // Main content based on view mode
  const renderContent = () => {
    if (viewMode === 'completed') {
      return renderCompletionContent();
    }
    
    if (viewMode === 'lesson') {
      return (
        <MobilePreviewFrame
          block={currentBlock}
          lessonTitle={currentLesson?.title}
          blockIndex={currentBlockIndex}
          totalBlocks={blocks.length}
          onContinue={handleContinue}
          designSystem={course.designSystem}
          isMuted={false}
          isReadOnly={true}
        />
      );
    }
    
    // Map view
    return (
      <div className="h-full overflow-auto">
        <LessonMap
          lessons={course.lessons}
          displayType={displayType}
          completedLessons={completedLessons}
          currentLessonId={currentLesson?.id}
          onSelectLesson={handleSelectLesson}
        />
      </div>
    );
  };

  // Fullscreen mode (Telegram / public link)
  if (fullscreen) {
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-full w-full"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
          }}
        >
          {renderContent()}
        </div>
      </DesignSystemProvider>
    );
  }

  // Preview mode - with phone frame (same as FullscreenPreview)
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-card/90 hover:bg-card border border-border shadow-lg"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Phone frame */}
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-[calc(100vh-80px)] w-[calc((100vh-80px)*9/16)] max-w-full rounded-[2.5rem] overflow-hidden flex flex-col border-4 border-foreground/20 shadow-2xl"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
          }}
        >
          {renderContent()}
        </div>
      </DesignSystemProvider>
    </div>
  );
};

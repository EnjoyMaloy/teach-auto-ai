import React, { useState } from 'react';
import { Lesson, LessonsDisplayType } from '@/types/course';
import { Check, Lock, Clock, BookOpen, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LessonMapProps {
  lessons: Lesson[];
  displayType: LessonsDisplayType;
  completedLessons: string[];
  currentLessonId?: string;
  onSelectLesson: (lessonId: string, lessonIndex: number) => void;
}

interface LessonPopupProps {
  lesson: Lesson;
  index: number;
  status: 'completed' | 'current' | 'locked';
  onStart: () => void;
  onClose: () => void;
}

const LessonPopup: React.FC<LessonPopupProps & { isFirstLesson?: boolean }> = ({ lesson, index, status, onStart, onClose, isFirstLesson }) => {
  // For first lesson, show popup below the circle instead of above
  const showBelow = isFirstLesson;
  
  return (
    <div 
      className="absolute w-64 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      style={{
        backgroundColor: `hsl(var(--ds-card, var(--card)))`,
        border: `2px solid hsl(var(--ds-muted, var(--border)))`,
        ...(showBelow ? {
          top: '100%',
          marginTop: '12px',
        } : {
          bottom: '100%',
          marginBottom: '12px',
        }),
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
    >
      {/* Arrow pointer */}
      <div 
        className="absolute w-4 h-4 rotate-45"
        style={{
          backgroundColor: `hsl(var(--ds-card, var(--card)))`,
          ...(showBelow ? {
            borderLeft: `2px solid hsl(var(--ds-muted, var(--border)))`,
            borderTop: `2px solid hsl(var(--ds-muted, var(--border)))`,
            top: '-9px',
          } : {
            borderRight: `2px solid hsl(var(--ds-muted, var(--border)))`,
            borderBottom: `2px solid hsl(var(--ds-muted, var(--border)))`,
            bottom: '-9px',
          }),
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
        style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.5)` }}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="text-center">
        <p 
          className="text-xs font-medium mb-1"
          style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
        >
          Урок {index + 1}
        </p>
        <h3 
          className="font-bold text-lg mb-2"
          style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
        >
          {lesson.title}
        </h3>
        <div 
          className="flex items-center justify-center gap-3 text-xs mb-4"
          style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
        >
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {lesson.slides.length} слайдов
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lesson.estimatedMinutes} мин
          </span>
        </div>
        
        <Button
          onClick={onStart}
          className="w-full gap-2"
          style={{
            backgroundColor: status === 'completed' 
              ? `hsl(var(--ds-success, var(--success)))` 
              : `hsl(var(--ds-primary, var(--primary)))`,
            color: `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
          }}
        >
          <Play className="w-4 h-4" />
          {status === 'completed' ? 'Повторить' : 'Начать'}
        </Button>
      </div>
    </div>
  );
};

export const LessonMap: React.FC<LessonMapProps> = ({
  lessons,
  displayType,
  completedLessons,
  currentLessonId,
  onSelectLesson,
}) => {
  const [selectedPopupId, setSelectedPopupId] = useState<string | null>(null);
  
  const getLessonStatus = (lesson: Lesson, index: number): 'completed' | 'current' | 'locked' => {
    if (completedLessons.includes(lesson.id)) {
      return 'completed';
    }
    // First lesson is always unlocked, others need previous to be completed
    if (index === 0 || completedLessons.includes(lessons[index - 1]?.id)) {
      return 'current';
    }
    return 'locked';
  };

  const handleCircleClick = (lesson: Lesson, index: number) => {
    const status = getLessonStatus(lesson, index);
    if (status === 'locked') return;
    
    // Directly start the lesson
    onSelectLesson(lesson.id, index);
  };

  const handleStartLesson = (lessonId: string, index: number) => {
    setSelectedPopupId(null);
    onSelectLesson(lessonId, index);
  };

  if (displayType === 'list') {
    return (
      <div className="flex flex-col gap-3 p-4 w-full max-w-md mx-auto">
        <h2 
          className="text-lg font-bold mb-2 text-center"
          style={{ 
            color: `hsl(var(--ds-foreground, var(--foreground)))`,
            fontFamily: `var(--ds-heading-font-family, inherit)`,
          }}
        >
          Выберите урок
        </h2>
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson, index);
          const isLocked = status === 'locked';
          
          return (
            <button
              key={lesson.id}
              onClick={() => !isLocked && onSelectLesson(lesson.id, index)}
              disabled={isLocked}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                isLocked ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
              )}
              style={{
                backgroundColor: status === 'completed' 
                  ? `hsl(var(--ds-success, var(--success)) / 0.1)`
                  : `hsl(var(--ds-card, var(--card)))`,
                borderColor: status === 'completed'
                  ? `hsl(var(--ds-success, var(--success)) / 0.3)`
                  : `hsl(var(--ds-muted, var(--border)))`,
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                style={{
                  backgroundColor: status === 'completed'
                    ? `hsl(var(--ds-success, var(--success)) / 0.2)`
                    : `hsl(var(--ds-muted, var(--muted)))`,
                }}
              >
                {status === 'completed' ? (
                  <Check className="w-6 h-6" style={{ color: `hsl(var(--ds-success, var(--success)))` }} />
                ) : status === 'locked' ? (
                  <Lock className="w-5 h-5" style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.5)` }} />
                ) : (
                  <span className="font-bold" style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}>
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-semibold truncate"
                  style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
                >
                  {lesson.title}
                </p>
                <div 
                  className="flex items-center gap-3 text-xs mt-1"
                  style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
                >
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {lesson.slides.length} слайдов
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lesson.estimatedMinutes} мин
                  </span>
                </div>
              </div>
              {!isLocked && status !== 'completed' && (
                <Play 
                  className="w-5 h-5 shrink-0" 
                  style={{ color: `hsl(var(--ds-primary, var(--primary)))` }} 
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Circle map (Duolingo style) - clean circles with numbers only
  return (
    <div className="flex flex-col items-center py-8 px-4 w-full">
      <h2 
        className="text-lg font-bold mb-8 text-center"
        style={{ 
          color: `hsl(var(--ds-foreground, var(--foreground)))`,
          fontFamily: `var(--ds-heading-font-family, inherit)`,
        }}
      >
        Выберите урок
      </h2>
      
      <div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson, index);
          const isLocked = status === 'locked';
          const isPopupOpen = selectedPopupId === lesson.id;
          // Zigzag pattern
          const offset = index % 2 === 0 ? -50 : 50;
          
          return (
            <div 
              key={lesson.id}
              className="relative flex flex-col items-center"
              style={{ 
                marginLeft: `${offset}px`,
                zIndex: isPopupOpen ? 100 : 10,
              }}
            >
              <button
                onClick={() => handleCircleClick(lesson, index)}
                disabled={isLocked}
                className={cn(
                  "relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all",
                  isLocked ? "opacity-60 cursor-not-allowed" : "hover:scale-110 active:scale-95",
                  isPopupOpen && "scale-110"
                )}
                style={{
                  backgroundColor: status === 'completed'
                    ? `hsl(var(--ds-success, var(--success)))`
                    : status === 'current'
                      ? `hsl(var(--ds-primary, var(--primary)))`
                      : `hsl(var(--ds-muted, var(--muted)))`,
                  color: status === 'locked' 
                    ? `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.5)`
                    : `hsl(var(--ds-primary-foreground, var(--primary-foreground)))`,
                  boxShadow: !isLocked 
                    ? `0 4px 0 0 hsl(${status === 'completed' ? 'var(--ds-success, var(--success))' : 'var(--ds-primary, var(--primary))'} / 0.4)`
                    : undefined,
                  outline: isPopupOpen ? `4px solid hsl(var(--ds-primary, var(--primary)) / 0.3)` : undefined,
                  outlineOffset: isPopupOpen ? '4px' : undefined,
                }}
              >
                {status === 'completed' ? (
                  <Check className="w-7 h-7" />
                ) : status === 'locked' ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  index + 1
                )}
              </button>
              
              {/* Popup on click */}
              {isPopupOpen && (
                <LessonPopup
                  lesson={lesson}
                  index={index}
                  status={status}
                  onStart={() => handleStartLesson(lesson.id, index)}
                  onClose={() => setSelectedPopupId(null)}
                  isFirstLesson={index === 0}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

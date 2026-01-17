import React from 'react';
import { Lesson, LessonsDisplayType } from '@/types/course';
import { Check, Lock, Play, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonMapProps {
  lessons: Lesson[];
  displayType: LessonsDisplayType;
  completedLessons: string[];
  currentLessonId?: string;
  onSelectLesson: (lessonId: string, lessonIndex: number) => void;
}

export const LessonMap: React.FC<LessonMapProps> = ({
  lessons,
  displayType,
  completedLessons,
  currentLessonId,
  onSelectLesson,
}) => {
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
                  lesson.icon || '📚'
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

  // Circle map (Duolingo style)
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
      
      <div className="relative flex flex-col items-center gap-6 w-full max-w-xs">
        {/* Connecting line */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 rounded-full"
          style={{ 
            backgroundColor: `hsl(var(--ds-muted, var(--muted)))`,
            zIndex: 0,
          }}
        />
        
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(lesson, index);
          const isLocked = status === 'locked';
          // Zigzag pattern
          const offset = index % 2 === 0 ? -40 : 40;
          
          return (
            <div 
              key={lesson.id}
              className="relative z-10 flex flex-col items-center"
              style={{ marginLeft: `${offset}px` }}
            >
              <button
                onClick={() => !isLocked && onSelectLesson(lesson.id, index)}
                disabled={isLocked}
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all",
                  isLocked ? "opacity-60 cursor-not-allowed" : "hover:scale-110 active:scale-95"
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
                  // Ring styling via box-shadow for current state
                  outline: status === 'current' ? `4px solid hsl(var(--ds-primary, var(--primary)) / 0.3)` : undefined,
                  outlineOffset: status === 'current' ? '4px' : undefined,
                }}
              >
                {status === 'completed' ? (
                  <Check className="w-8 h-8" />
                ) : status === 'locked' ? (
                  <Lock className="w-7 h-7" />
                ) : (
                  lesson.icon || '📚'
                )}
                
                {/* Lesson number badge */}
                <span 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(var(--ds-card, var(--card)))`,
                    color: `hsl(var(--ds-foreground, var(--foreground)))`,
                    border: `2px solid hsl(var(--ds-muted, var(--border)))`,
                  }}
                >
                  {index + 1}
                </span>
              </button>
              
              <p 
                className={cn(
                  "mt-2 text-sm font-medium text-center max-w-[100px] truncate",
                  isLocked && "opacity-50"
                )}
                style={{ color: `hsl(var(--ds-foreground, var(--foreground)))` }}
              >
                {lesson.title}
              </p>
              <p 
                className="text-xs"
                style={{ color: `hsl(var(--ds-foreground, var(--muted-foreground)) / 0.6)` }}
              >
                {lesson.estimatedMinutes} мин
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

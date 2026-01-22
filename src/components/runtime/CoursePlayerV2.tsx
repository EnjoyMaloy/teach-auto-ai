/**
 * CoursePlayerV2 - чистая реализация плеера курса
 * Использует useCourseData для загрузки и SlideRenderer для рендеринга
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useCourseData, CourseDataMode } from '@/hooks/useCourseData';
import { SlideRenderer } from './SlideRenderer';
import { LessonMap } from './LessonMap';
import { playSound } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';
import { cn } from '@/lib/utils';

interface CoursePlayerV2Props {
  courseId: string;
  mode: CourseDataMode; // 'draft' for editor preview, 'published' for public
  onClose?: () => void;
  /** Skip lesson map and start directly with first lesson */
  skipMap?: boolean;
}

type ViewMode = 'map' | 'lesson' | 'completed';

export const CoursePlayerV2: React.FC<CoursePlayerV2Props> = ({
  courseId,
  mode,
  onClose,
  skipMap = false,
}) => {
  const { course, isLoading, error, loadCourse } = useCourseData();
  
  const [viewMode, setViewMode] = useState<ViewMode>(skipMap ? 'lesson' : 'map');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Загрузка курса
  useEffect(() => {
    console.log('[CoursePlayerV2] Loading course:', courseId, 'mode:', mode);
    loadCourse(courseId, mode);
  }, [courseId, mode, loadCourse]);

  // Звуковые настройки
  const soundConfig = {
    enabled: course?.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course?.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course?.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  const currentLesson = course?.lessons[currentLessonIndex];
  const currentSlide = currentLesson?.slides[currentSlideIndex] || null;
  const totalSlides = currentLesson?.slides?.length || 0;

  // Переход к следующему слайду
  const handleContinue = () => {
    playSound('swipe', soundConfig);
    
    if (currentSlideIndex < totalSlides - 1) {
      // Следующий слайд
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Урок завершён
      if (currentLesson && !completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
        playSound('levelUp', soundConfig);
      }
      
      // Проверяем, все ли уроки завершены
      const allCompleted = course?.lessons.every(
        l => l.id === currentLesson?.id || completedLessons.includes(l.id)
      );
      
      if (allCompleted) {
        playSound('complete', soundConfig);
        setViewMode('completed');
      } else {
        setViewMode('map');
      }
    }
  };

  // Выбор урока на карте
  const handleSelectLesson = (lessonId: string, lessonIndex: number) => {
    playSound('swipe', soundConfig);
    setCurrentLessonIndex(lessonIndex);
    setCurrentSlideIndex(0);
    setViewMode('lesson');
  };

  // Рестарт курса
  const handleRestart = () => {
    setCurrentLessonIndex(0);
    setCurrentSlideIndex(0);
    setCompletedLessons([]);
    setViewMode(skipMap ? 'lesson' : 'map');
    playSound('swipe', soundConfig);
  };

  // Стили кнопок
  const ds = course?.designSystem || {};
  const primaryColor = ds.primaryColor || '262 83% 58%';
  const isRaised = ds.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  
  const getRaisedButtonStyle = () => {
    if (!isRaised) return {};
    return {
      boxShadow: `0 4px 0 0 hsl(${primaryColor} / 0.4), 0 6px 12px -2px hsl(${primaryColor} / 0.25)`,
    };
  };

  // === LOADING ===
  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Загрузка курса...</p>
      </div>
    );
  }

  // === ERROR ===
  if (error || !course) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-4 bg-background">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground text-center">{error || 'Курс не найден'}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Возможно, курс ещё не опубликован или ссылка недействительна
        </p>
      </div>
    );
  }

  // === EMPTY COURSE ===
  if (course.lessons.length === 0 || course.lessons.every(l => l.slides.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Курс пуст</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Этот курс пока не содержит уроков
        </p>
      </div>
    );
  }

  // === COMPLETED ===
  if (viewMode === 'completed') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm w-full">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-500/10"
          >
            <Trophy className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            Курс пройден! 🎉
          </h1>
          <p className="text-sm mb-6 text-muted-foreground">
            {course.title}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl border bg-muted/50">
              <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground">Точность</p>
            </div>
            <div className="p-3 rounded-xl border bg-muted/50">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{course.estimatedMinutes || 5}</p>
              <p className="text-xs text-muted-foreground">Минут</p>
            </div>
          </div>

          <button 
            onClick={onClose || handleRestart} 
            className={cn("w-full h-11 font-bold uppercase tracking-wide", pressAnimationClass)}
            style={{
              backgroundColor: `hsl(${primaryColor})`,
              color: 'white',
              borderRadius: ds.borderRadius || '0.75rem',
              ...getRaisedButtonStyle(),
            }}
          >
            {onClose ? 'ЗАВЕРШИТЬ' : 'ПРОЙТИ ЗАНОВО'}
          </button>
        </div>
      </div>
    );
  }

  // === MAP VIEW ===
  if (viewMode === 'map') {
    return (
      <LessonMap
        lessons={course.lessons}
        completedLessons={completedLessons}
        currentLessonId={currentLesson?.id}
        onSelectLesson={handleSelectLesson}
        displayType={course.lessonsDisplayType}
      />
    );
  }

  // === LESSON VIEW ===
  return (
    <SlideRenderer
      slide={currentSlide}
      designSystem={course.designSystem}
      onContinue={handleContinue}
      isMuted={false}
      showProgress={true}
      currentIndex={currentSlideIndex}
      totalCount={totalSlides}
    />
  );
};

import React, { useState, useEffect } from 'react';
import { X, Trophy, Star, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Course, Lesson, Slide } from '@/types/course';
import { DesignSystemProvider } from './DesignSystemProvider';
import { LessonMap } from './LessonMap';
import { MobilePreviewFrame } from '@/components/editor/blocks/MobilePreviewFrame';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';
import { Block, BlockType } from '@/types/blocks';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface CoursePlayerProps {
  /** Course ID to load from database */
  courseId: string;
  /** Mode: 'preview' for editor preview, 'public' for published course */
  mode: 'preview' | 'public';
  /** Callback when player is closed (only used in preview mode) */
  onClose?: () => void;
  /** If true, renders fullscreen without phone frame (for Telegram) */
  fullscreen?: boolean;
  /** Initial lesson to start from */
  initialLessonId?: string;
  /** Initial block index within the lesson */
  initialBlockIndex?: number;
}

// Adapter: Convert DB slide to Block for MobilePreviewFrame
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
  courseId,
  mode,
  onClose,
  fullscreen = false,
  initialLessonId,
  initialBlockIndex = 0,
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialBlockIndex);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  // Load course from database
  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('CoursePlayer: Loading course', courseId, 'mode:', mode);
      
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      if (!courseData) {
        setError('Курс не найден');
        return;
      }

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch slides for all lessons
      const lessonIds = lessonsData?.map(l => l.id) || [];
      const { data: slidesData, error: slidesError } = await supabase
        .from('slides')
        .select('*')
        .in('lesson_id', lessonIds.length > 0 ? lessonIds : [''])
        .order('order', { ascending: true });

      if (slidesError) throw slidesError;

      // Build lessons with slides
      const lessonsWithSlides: Lesson[] = (lessonsData || []).map(lesson => ({
        id: lesson.id,
        courseId: lesson.course_id,
        title: lesson.title,
        description: lesson.description || '',
        order: lesson.order,
        estimatedMinutes: lesson.estimated_minutes || 3,
        icon: lesson.icon || '📚',
        coverImage: lesson.cover_image || undefined,
        slides: (slidesData || [])
          .filter(s => s.lesson_id === lesson.id)
          .map(s => ({
            id: s.id,
            lessonId: s.lesson_id,
            type: s.type as Slide['type'],
            order: s.order,
            content: s.content,
            imageUrl: s.image_url || undefined,
            videoUrl: s.video_url || undefined,
            audioUrl: s.audio_url || undefined,
            options: s.options as unknown as Slide['options'],
            correctAnswer: s.correct_answer as Slide['correctAnswer'],
            explanation: s.explanation || undefined,
            blankWord: s.blank_word || undefined,
            matchingPairs: s.matching_pairs as Slide['matchingPairs'],
            sliderMin: s.slider_min || undefined,
            sliderMax: s.slider_max || undefined,
            sliderCorrect: s.slider_correct || undefined,
            sliderStep: s.slider_step || undefined,
            orderingItems: s.ordering_items as Slide['orderingItems'],
            correctOrder: s.correct_order as Slide['correctOrder'],
            backgroundColor: s.background_color || undefined,
            textColor: s.text_color || undefined,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
          })),
        createdAt: new Date(lesson.created_at),
        updatedAt: new Date(lesson.updated_at),
      }));

      const fullCourse: Course = {
        id: courseData.id,
        authorId: courseData.author_id,
        title: courseData.title,
        description: courseData.description || '',
        coverImage: courseData.cover_image || undefined,
        tags: courseData.tags || [],
        targetAudience: courseData.target_audience || '',
        estimatedMinutes: courseData.estimated_minutes || 10,
        lessons: lessonsWithSlides,
        lessonsDisplayType: (courseData.lessons_display_type as Course['lessonsDisplayType']) || 'circle_map',
        isPublished: courseData.is_published || false,
        publishedAt: courseData.published_at ? new Date(courseData.published_at) : undefined,
        currentVersion: courseData.current_version || 1,
        versions: [],
        designSystem: courseData.design_system as Course['designSystem'],
        createdAt: new Date(courseData.created_at),
        updatedAt: new Date(courseData.updated_at),
      };

      setCourse(fullCourse);

      // Initialize lesson if specified
      if (initialLessonId) {
        const lessonIdx = fullCourse.lessons.findIndex(l => l.id === initialLessonId);
        if (lessonIdx >= 0) {
          setCurrentLessonIndex(lessonIdx);
          setViewMode('lesson');
        }
      }
      
      console.log('CoursePlayer: Course loaded successfully');
    } catch (err) {
      console.error('CoursePlayer: Error loading course:', err);
      setError('Не удалось загрузить курс');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const currentLesson = course?.lessons[currentLessonIndex];
  const blocks = currentLesson?.slides?.map(slideToBlock) || [];
  const currentBlock = blocks[currentBlockIndex] || null;

  // Sound settings
  const soundConfig = {
    enabled: course?.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course?.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course?.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  // Button styling for completion screen
  const isRaised = course?.designSystem?.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  
  const getRaisedButtonStyle = () => {
    if (!isRaised) return {};
    const primaryColor = course?.designSystem?.primaryColor || '262 83% 58%';
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

  const handleClose = () => {
    onClose?.();
  };

  // Loading state
  if (isLoading) {
    const loadingMessage = mode === 'preview' ? 'Загрузка сохранённой версии...' : 'Загрузка курса...';
    
    if (mode === 'preview') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm">{loadingMessage}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    if (mode === 'preview') {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white bg-card/90 p-8 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-lg font-medium">{error || 'Курс не найден'}</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Убедитесь, что курс сохранён перед предпросмотром
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={handleClose}>
                Закрыть
              </Button>
              <Button onClick={loadCourse}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Повторить
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground text-center">{error || 'Курс не найден'}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Возможно, курс был удалён или ссылка недействительна
        </p>
      </div>
    );
  }

  // Empty course check
  if (course.lessons.length === 0 || course.lessons.every(l => l.slides.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
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

  const displayType = course.lessonsDisplayType || 'circle_map';

  // Completion screen
  const renderCompletionContent = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    
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
            onClick={fullscreen ? handleRestart : handleClose} 
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
          embedded={fullscreen} // Use embedded mode for fullscreen to fill container
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

  // Preview mode (editor) - with phone frame and control buttons
  if (mode === 'preview') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 bg-card/90 hover:bg-card border border-border shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Refresh button - reload from DB */}
        <Button
          variant="ghost"
          size="icon"
          onClick={loadCourse}
          className="absolute top-4 right-16 z-20 bg-card/90 hover:bg-card border border-border shadow-lg"
          title="Обновить из базы данных"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Info badge */}
        <div className="absolute top-4 left-4 z-20 bg-card/90 border border-border shadow-lg rounded-full px-3 py-1.5 text-xs text-muted-foreground">
          Сохранённая версия
        </div>

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
  }

  // Public mode on desktop - phone frame without control buttons
  return (
    <div className="fixed inset-0 bg-muted/80 flex items-center justify-center p-4">
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-[calc(100vh-80px)] w-[calc((100vh-80px)*9/16)] max-w-[420px] rounded-[2.5rem] overflow-hidden flex flex-col border-4 border-foreground/10 shadow-2xl"
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

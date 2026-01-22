import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide } from '@/types/course';
import { Block } from '@/types/blocks';
import { MobilePreviewFrame } from '@/components/editor/blocks/MobilePreviewFrame';
import { DesignSystemProvider } from './DesignSystemProvider';
import { LessonMap } from './LessonMap';
import { Loader2, AlertCircle, Trophy, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playSound } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';

// Convert Slide to Block for MobilePreviewFrame
const slideToBlock = (slide: Slide): Block => ({
  id: slide.id,
  lessonId: slide.lessonId,
  type: slide.type,
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

interface SimplePlayerProps {
  courseId: string;
  onClose?: () => void;
}

type ViewMode = 'map' | 'lesson' | 'completed';

/**
 * SimplePlayer - A simplified course player that uses the same MobilePreviewFrame
 * as the editor's Fast View. This ensures 1:1 parity between preview and public versions.
 */
export const SimplePlayer: React.FC<SimplePlayerProps> = ({ courseId, onClose }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Load course from database
  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (courseError) throw courseError;
        if (!courseData) {
          setError('Курс не найден');
          setIsLoading(false);
          return;
        }

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Fetch slides
        const lessonIds = lessonsData?.map(l => l.id) || [];
        const { data: slidesData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .in('lesson_id', lessonIds.length > 0 ? lessonIds : [''])
          .order('order', { ascending: true });

        if (slidesError) throw slidesError;

        // Build course object
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
          isPublished: courseData.is_published || false,
          lessonsDisplayType: (courseData.lessons_display_type as 'circle_map' | 'list') || 'circle_map',
          designSystem: courseData.design_system as Course['designSystem'],
          lessons: lessonsWithSlides,
          currentVersion: courseData.current_version || 1,
          versions: [],
          createdAt: new Date(courseData.created_at),
          updatedAt: new Date(courseData.updated_at),
        };

        setCourse(fullCourse);
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Ошибка загрузки курса');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Derived state
  const currentLesson = course?.lessons[currentLessonIndex];
  const blocks = currentLesson?.slides?.map(slideToBlock) || [];
  const currentBlock = blocks[currentBlockIndex] || null;
  
  const soundConfig = {
    enabled: course?.designSystem?.sound?.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
    theme: course?.designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: course?.designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  const displayType = course?.lessonsDisplayType || 'circle_map';

  // Handlers
  const handleSelectLesson = (lessonId: string, lessonIndex: number) => {
    playSound('swipe', soundConfig);
    setCurrentLessonIndex(lessonIndex);
    setCurrentBlockIndex(0);
    setViewMode('lesson');
  };

  const handleContinue = () => {
    playSound('swipe', soundConfig);
    
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      // Lesson completed
      if (currentLesson && !completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
        playSound('levelUp', soundConfig);
      }
      
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

  const handleRestart = () => {
    setCurrentLessonIndex(0);
    setCurrentBlockIndex(0);
    setCompletedLessons([]);
    setViewMode('map');
    playSound('swipe', soundConfig);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">{error || 'Курс не найден'}</h1>
          <p className="text-muted-foreground mb-4">Возможно, курс был удалён или ссылка недействительна</p>
        </div>
      </div>
    );
  }

  // Empty course
  if (course.lessons.length === 0 || course.lessons.every(l => l.slides.length === 0)) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-semibold">Курс пуст</h1>
          <p className="text-muted-foreground">Этот курс пока не содержит уроков</p>
        </div>
      </div>
    );
  }

  // Completion screen
  if (viewMode === 'completed') {
    const ds = course.designSystem || {};
    const primaryColor = ds.primaryColor || '262 83% 58%';
    const bgColor = ds.backgroundColor || '0 0% 100%';
    const fgColor = ds.foregroundColor || '240 10% 4%';
    
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-full w-full flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: `hsl(${bgColor})` }}
        >
          <div 
            className="w-24 h-24 rounded-full mb-6 flex items-center justify-center"
            style={{ backgroundColor: `hsl(${primaryColor} / 0.15)` }}
          >
            <Trophy className="w-12 h-12" style={{ color: `hsl(${primaryColor})` }} />
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: `hsl(${fgColor})` }}
          >
            Курс завершён!
          </h1>
          <div className="flex items-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <Button onClick={handleRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Пройти заново
          </Button>
        </div>
      </DesignSystemProvider>
    );
  }

  // Map view
  if (viewMode === 'map') {
    return (
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-full w-full overflow-auto"
          style={{ 
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
          }}
        >
          <LessonMap
            lessons={course.lessons}
            displayType={displayType}
            completedLessons={completedLessons}
            currentLessonId={currentLesson?.id}
            onSelectLesson={handleSelectLesson}
          />
        </div>
      </DesignSystemProvider>
    );
  }

  // Lesson view - USE MOBILEPREVIEWFRAME EXACTLY LIKE FAST VIEW IN EDITOR
  return (
    <DesignSystemProvider config={course.designSystem}>
      <div className="h-full w-full overflow-hidden">
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
      </div>
    </DesignSystemProvider>
  );
};

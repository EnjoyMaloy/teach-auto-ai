import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Course, Lesson, Slide } from '@/types/course';
import { Block, BlockType } from '@/types/blocks';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';
import { LessonMap } from '@/components/runtime/LessonMap';
import { DesignSystemProvider } from '@/components/runtime/DesignSystemProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FullscreenPreviewProps {
  courseId: string;
  onClose: () => void;
  initialLessonId?: string;
  initialBlockIndex?: number;
}

// Adapter: Convert Slide to Block for preview
const slideToBlock = (slide: any): Block => ({
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
  sliderCorrectMax: slide.sliderCorrectMax,
  sliderStep: slide.sliderStep,
  orderingItems: slide.orderingItems,
  correctOrder: slide.correctOrder,
  subBlocks: slide.subBlocks,
  backgroundColor: slide.backgroundColor,
  textColor: slide.textColor,
  textSize: slide.textSize,
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt,
});

type ViewMode = 'lesson' | 'map';

export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  courseId,
  onClose,
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

  // Load course from database (saved draft)
  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
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
    } catch (err) {
      console.error('Error loading course for preview:', err);
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

  const handleContinue = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      if (currentLesson && !completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
      }
      setViewMode('map');
    }
  };

  const handleSelectLesson = (lessonId: string, lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setCurrentBlockIndex(0);
    setViewMode('lesson');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm">Загрузка сохранённой версии...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white bg-card/90 p-8 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-medium">{error || 'Курс не найден'}</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Убедитесь, что курс сохранён перед предпросмотром
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={onClose}>
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

  const displayType = course.lessonsDisplayType || 'circle_map';

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
          {viewMode === 'lesson' ? (
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
          ) : (
            <div className="h-full overflow-auto">
              <LessonMap
                lessons={course.lessons}
                displayType={displayType}
                completedLessons={completedLessons}
                currentLessonId={currentLesson?.id}
                onSelectLesson={handleSelectLesson}
              />
            </div>
          )}
        </div>
      </DesignSystemProvider>
    </div>
  );
};

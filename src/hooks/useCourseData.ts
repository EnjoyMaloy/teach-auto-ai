/**
 * useCourseData - единый хук для загрузки курса
 * Поддерживает два режима:
 * - draft: черновик из таблиц lessons/slides (для редактора)
 * - published: опубликованная версия из published_lessons/published_slides
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide, CourseDesignSystem } from '@/types/course';

export type CourseDataMode = 'draft' | 'published';

interface UseCourseDataResult {
  course: Course | null;
  isLoading: boolean;
  error: string | null;
  loadCourse: (courseId: string, mode: CourseDataMode) => Promise<Course | null>;
  refetch: () => Promise<void>;
}

// Маппинг строки из БД в Slide
const mapDbRowToSlide = (row: any, lessonId: string): Slide => ({
  id: row.original_slide_id || row.id,
  lessonId,
  type: row.type,
  order: row.order,
  content: row.content || '',
  imageUrl: row.image_url || undefined,
  videoUrl: row.video_url || undefined,
  audioUrl: row.audio_url || undefined,
  options: row.options || undefined,
  correctAnswer: row.correct_answer,
  explanation: row.explanation || undefined,
  explanationCorrect: row.explanation_correct || undefined,
  explanationPartial: row.explanation_partial || undefined,
  hints: row.hints || undefined,
  blankWord: row.blank_word || undefined,
  matchingPairs: row.matching_pairs || undefined,
  sliderMin: row.slider_min,
  sliderMax: row.slider_max,
  sliderCorrect: row.slider_correct,
  sliderCorrectMax: row.slider_correct_max,
  sliderStep: row.slider_step,
  orderingItems: row.ordering_items || undefined,
  correctOrder: row.correct_order || undefined,
  subBlocks: row.sub_blocks || undefined,
  backgroundColor: row.background_color || undefined,
  textColor: row.text_color || undefined,
  textSize: row.text_size || undefined,
  articleId: row.article_id || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Маппинг строки из БД в Lesson
const mapDbRowToLesson = (row: any, slides: Slide[]): Lesson => ({
  id: row.original_lesson_id || row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description || '',
  order: row.order,
  estimatedMinutes: row.estimated_minutes || 3,
  icon: row.icon || '📚',
  coverImage: row.cover_image || undefined,
  slides,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const useCourseData = (): UseCourseDataResult => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<{ courseId: string; mode: CourseDataMode } | null>(null);

  const loadCourse = useCallback(async (courseId: string, mode: CourseDataMode): Promise<Course | null> => {
    console.log(`[useCourseData] Loading course: ${courseId}, mode: ${mode}`);
    
    setIsLoading(true);
    setError(null);
    setLastParams({ courseId, mode });

    try {
      // 1. Загружаем метаданные курса
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('[useCourseData] Course fetch error:', courseError);
        throw new Error('Курс не найден');
      }

      if (!courseData) {
        throw new Error('Курс не найден');
      }

      console.log(`[useCourseData] Course metadata loaded: ${courseData.title}`);

      let lessons: Lesson[] = [];

      if (mode === 'draft') {
        // === DRAFT MODE: загружаем из lessons/slides ===
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (lessonsError) {
          console.error('[useCourseData] Lessons fetch error:', lessonsError);
          throw new Error('Ошибка загрузки уроков');
        }

        console.log(`[useCourseData] Draft lessons loaded: ${lessonsData?.length || 0}`);

        if (lessonsData && lessonsData.length > 0) {
          const lessonIds = lessonsData.map(l => l.id);
          
          const { data: slidesData, error: slidesError } = await supabase
            .from('slides')
            .select('*')
            .in('lesson_id', lessonIds)
            .order('order', { ascending: true });

          if (slidesError) {
            console.error('[useCourseData] Slides fetch error:', slidesError);
            throw new Error('Ошибка загрузки слайдов');
          }

          console.log(`[useCourseData] Draft slides loaded: ${slidesData?.length || 0}`);

          // Группируем слайды по урокам
          lessons = lessonsData.map(lesson => {
            const lessonSlides = (slidesData || [])
              .filter(s => s.lesson_id === lesson.id)
              .map(s => mapDbRowToSlide(s, lesson.id));
            
            return mapDbRowToLesson(lesson, lessonSlides);
          });
        }
      } else {
        // === PUBLISHED MODE: загружаем из published_lessons/published_slides ===
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('published_lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (lessonsError) {
          console.error('[useCourseData] Published lessons fetch error:', lessonsError);
          throw new Error('Ошибка загрузки опубликованных уроков');
        }

        console.log(`[useCourseData] Published lessons loaded: ${lessonsData?.length || 0}`);

        if (!lessonsData || lessonsData.length === 0) {
          throw new Error('Курс ещё не опубликован');
        }

        const publishedLessonIds = lessonsData.map(l => l.id);
        
        const { data: slidesData, error: slidesError } = await supabase
          .from('published_slides')
          .select('*')
          .in('published_lesson_id', publishedLessonIds)
          .order('order', { ascending: true });

        if (slidesError) {
          console.error('[useCourseData] Published slides fetch error:', slidesError);
          throw new Error('Ошибка загрузки опубликованных слайдов');
        }

        console.log(`[useCourseData] Published slides loaded: ${slidesData?.length || 0}`);

        // Группируем слайды по урокам
        lessons = lessonsData.map(lesson => {
          const lessonSlides = (slidesData || [])
            .filter(s => s.published_lesson_id === lesson.id)
            .map(s => mapDbRowToSlide(s, lesson.original_lesson_id));
          
          return mapDbRowToLesson(lesson, lessonSlides);
        });
      }

      // Собираем итоговый объект курса
      const result: Course = {
        id: courseData.id,
        authorId: courseData.author_id,
        title: courseData.title,
        description: courseData.description || '',
        coverImage: courseData.cover_image || undefined,
        tags: courseData.tags || [],
        targetAudience: courseData.target_audience || '',
        estimatedMinutes: courseData.estimated_minutes || 10,
        lessons,
        lessonsDisplayType: (courseData.lessons_display_type as Course['lessonsDisplayType']) || 'circle_map',
        isPublished: courseData.is_published || false,
        publishedAt: courseData.published_at ? new Date(courseData.published_at) : undefined,
        currentVersion: courseData.current_version || 1,
        versions: [],
        designSystem: courseData.design_system as CourseDesignSystem | undefined,
        createdAt: new Date(courseData.created_at),
        updatedAt: new Date(courseData.updated_at),
      };

      console.log(`[useCourseData] Course built successfully with ${lessons.length} lessons`);
      
      setCourse(result);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('[useCourseData] Error:', message);
      setError(message);
      setCourse(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (lastParams) {
      await loadCourse(lastParams.courseId, lastParams.mode);
    }
  }, [lastParams, loadCourse]);

  return {
    course,
    isLoading,
    error,
    loadCourse,
    refetch,
  };
};

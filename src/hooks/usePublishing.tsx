import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide } from '@/types/course';
import { toast } from 'sonner';

export const usePublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);

  /**
   * Publish the current draft version of the course.
   * This copies all lessons and slides to the published_ tables.
   */
  const publishCourse = async (course: Course): Promise<boolean> => {
    setIsPublishing(true);
    
    try {
      // 1. Delete existing published content for this course
      await supabase
        .from('published_lessons')
        .delete()
        .eq('course_id', course.id);

      // 2. Insert published lessons
      for (const lesson of course.lessons) {
        const { data: publishedLesson, error: lessonError } = await supabase
          .from('published_lessons')
          .insert({
            course_id: course.id,
            original_lesson_id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            estimated_minutes: lesson.estimatedMinutes,
            icon: lesson.icon,
            cover_image: lesson.coverImage,
          })
          .select()
          .single();

        if (lessonError) throw lessonError;

        // 3. Insert published slides for this lesson
        if (lesson.slides.length > 0) {
          const publishedSlides = lesson.slides.map(slide => ({
            published_lesson_id: publishedLesson.id,
            original_slide_id: slide.id,
            type: slide.type,
            order: slide.order,
            content: slide.content,
            image_url: slide.imageUrl,
            video_url: slide.videoUrl,
            audio_url: slide.audioUrl,
            options: slide.options as unknown as any,
            correct_answer: slide.correctAnswer as unknown as any,
            explanation: slide.explanation,
            explanation_correct: slide.explanationCorrect,
            explanation_partial: slide.explanationPartial,
            hints: slide.hints as unknown as any,
            blank_word: slide.blankWord,
            matching_pairs: slide.matchingPairs as unknown as any,
            slider_min: slide.sliderMin,
            slider_max: slide.sliderMax,
            slider_correct: slide.sliderCorrect,
            slider_step: slide.sliderStep,
            ordering_items: slide.orderingItems as unknown as any,
            correct_order: slide.correctOrder as unknown as any,
            sub_blocks: slide.subBlocks as unknown as any,
            background_color: slide.backgroundColor,
            text_color: slide.textColor,
            text_size: slide.textSize,
          }));

          const { error: slidesError } = await supabase
            .from('published_slides')
            .insert(publishedSlides);

          if (slidesError) throw slidesError;
        }
      }

      // 4. Update course published_at timestamp
      await supabase
        .from('courses')
        .update({ 
          published_at: new Date().toISOString(),
          is_link_accessible: true,
        })
        .eq('id', course.id);

      toast.success('Курс опубликован!');
      return true;
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Ошибка публикации курса');
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Check if a course has a published version
   */
  const hasPublishedVersion = async (courseId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('published_lessons')
      .select('id')
      .eq('course_id', courseId)
      .limit(1);

    if (error) {
      console.error('Error checking published version:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  };

  /**
   * Fetch published version of a course
   */
  const fetchPublishedCourse = async (courseId: string): Promise<Course | null> => {
    try {
      console.log('fetchPublishedCourse: Starting fetch for', courseId);
      
      // Fetch course metadata
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('fetchPublishedCourse: Course error', courseError);
        throw courseError;
      }
      if (!courseData) {
        console.log('fetchPublishedCourse: No course data');
        return null;
      }

      console.log('fetchPublishedCourse: Course loaded, fetching published lessons');

      // Fetch published lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('published_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (lessonsError) {
        console.error('fetchPublishedCourse: Lessons error', lessonsError);
        throw lessonsError;
      }

      // If no published lessons, return null (not published yet)
      if (!lessonsData || lessonsData.length === 0) {
        console.log('fetchPublishedCourse: No published lessons');
        return null;
      }

      console.log('fetchPublishedCourse: Found', lessonsData.length, 'published lessons');

      // Fetch published slides
      const lessonIds = lessonsData.map(l => l.id);
      const { data: slidesData, error: slidesError } = await supabase
        .from('published_slides')
        .select('*')
        .in('published_lesson_id', lessonIds)
        .order('order', { ascending: true });

      if (slidesError) {
        console.error('fetchPublishedCourse: Slides error', slidesError);
        throw slidesError;
      }

      console.log('fetchPublishedCourse: Found', slidesData?.length || 0, 'published slides');

      // Build lessons with slides
      const lessons: Lesson[] = lessonsData.map(lesson => ({
        id: lesson.original_lesson_id,
        courseId: lesson.course_id,
        title: lesson.title,
        description: lesson.description || '',
        order: lesson.order,
        estimatedMinutes: lesson.estimated_minutes || 3,
        icon: lesson.icon || '📚',
        coverImage: lesson.cover_image || undefined,
        slides: (slidesData || [])
          .filter(s => s.published_lesson_id === lesson.id)
          .map(s => ({
            id: s.original_slide_id,
            lessonId: lesson.original_lesson_id,
            type: s.type as Slide['type'],
            order: s.order,
            content: s.content,
            imageUrl: s.image_url || undefined,
            videoUrl: s.video_url || undefined,
            audioUrl: s.audio_url || undefined,
            options: s.options as unknown as Slide['options'],
            correctAnswer: s.correct_answer as Slide['correctAnswer'],
            explanation: s.explanation || undefined,
            explanationCorrect: s.explanation_correct || undefined,
            explanationPartial: s.explanation_partial || undefined,
            hints: s.hints as unknown as Slide['hints'],
            blankWord: s.blank_word || undefined,
            matchingPairs: s.matching_pairs as Slide['matchingPairs'],
            sliderMin: s.slider_min || undefined,
            sliderMax: s.slider_max || undefined,
            sliderCorrect: s.slider_correct || undefined,
            sliderStep: s.slider_step || undefined,
            orderingItems: s.ordering_items as Slide['orderingItems'],
            correctOrder: s.correct_order as Slide['correctOrder'],
            subBlocks: s.sub_blocks as unknown as Slide['subBlocks'],
            backgroundColor: s.background_color || undefined,
            textColor: s.text_color || undefined,
            textSize: s.text_size as Slide['textSize'],
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
          })),
        createdAt: new Date(lesson.created_at),
        updatedAt: new Date(lesson.updated_at),
      }));

      const course: Course = {
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
        designSystem: courseData.design_system as Course['designSystem'],
        createdAt: new Date(courseData.created_at),
        updatedAt: new Date(courseData.updated_at),
      };

      console.log('fetchPublishedCourse: Successfully built course with', lessons.length, 'lessons');
      return course;
    } catch (error) {
      console.error('fetchPublishedCourse: Error:', error);
      return null;
    }
  };

  return {
    isPublishing,
    publishCourse,
    hasPublishedVersion,
    fetchPublishedCourse,
  };
};

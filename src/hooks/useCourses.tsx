import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide, SlideOption, SlideHint, CourseDesignSystem } from '@/types/course';
import { useAuth } from './useAuth';
import { DesignSystemConfig } from '@/types/designSystem';
import { toast } from 'sonner';

// Convert database row to Slide type
const dbSlideToSlide = (row: any): Slide => ({
  id: row.id,
  lessonId: row.lesson_id,
  type: row.type,
  order: row.order,
  content: row.content,
  imageUrl: row.image_url,
  options: row.options as SlideOption[] | undefined,
  correctAnswer: row.correct_answer,
  explanation: row.explanation,
  hints: row.hints as SlideHint[] | undefined,
  blankWord: row.blank_word,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Convert database row to Lesson type
const dbLessonToLesson = (row: any, slides: Slide[]): Lesson => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description,
  order: row.order,
  slides: slides.filter(s => s.lessonId === row.id).sort((a, b) => a.order - b.order),
  estimatedMinutes: row.estimated_minutes,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Convert database row to Course type
const dbCourseToCourse = (row: any, lessons: Lesson[]): Course => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  authorId: row.author_id,
  coverImage: row.cover_image,
  targetAudience: row.target_audience || '',
  estimatedMinutes: row.estimated_minutes || 0,
  lessons: lessons.filter(l => l.courseId === row.id).sort((a, b) => a.order - b.order),
  currentVersion: row.current_version || 1,
  versions: [],
  isPublished: row.is_published || false,
  publishedAt: row.published_at ? new Date(row.published_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  tags: row.tags || [],
  designSystem: row.design_system as CourseDesignSystem | undefined,
  category: row.category || undefined,
} as Course & { category?: string });

export const useCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all courses for the current user
  const fetchCourses = useCallback(async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false });

      if (coursesError) throw coursesError;
      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        return [];
      }

      // Fetch lessons for all courses
      const courseIds = coursesData.map(c => c.id);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('course_id', courseIds);

      if (lessonsError) throw lessonsError;

      // Fetch slides for all lessons
      const lessonIds = lessonsData?.map(l => l.id) || [];
      let slidesData: any[] = [];
      if (lessonIds.length > 0) {
        const { data, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .in('lesson_id', lessonIds);

        if (slidesError) throw slidesError;
        slidesData = data || [];
      }

      // Convert to app types
      const slides = slidesData.map(dbSlideToSlide);
      const lessons = (lessonsData || []).map(l => dbLessonToLesson(l, slides));
      const courses = coursesData.map(c => dbCourseToCourse(c, lessons));

      setCourses(courses);
      return courses;
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Ошибка загрузки курсов');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch a single course by ID
  const fetchCourse = useCallback(async (courseId: string): Promise<Course | null> => {
    if (!user) return null;

    setIsLoading(true);
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') return null;
        throw courseError;
      }

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      // Fetch slides
      const lessonIds = lessonsData?.map(l => l.id) || [];
      let slidesData: any[] = [];
      if (lessonIds.length > 0) {
        const { data, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .in('lesson_id', lessonIds);

        if (slidesError) throw slidesError;
        slidesData = data || [];
      }

      // Convert to app types
      const slides = slidesData.map(dbSlideToSlide);
      const lessons = (lessonsData || []).map(l => dbLessonToLesson(l, slides));
      const course = dbCourseToCourse(courseData, lessons);

      return course;
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Ошибка загрузки курса');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new course
  const createCourse = useCallback(async (title: string = 'Новый курс'): Promise<Course | null> => {
    if (!user) return null;

    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          author_id: user.id,
          title,
          description: '',
        })
        .select()
        .single();

      if (courseError) throw courseError;

      const course = dbCourseToCourse(courseData, []);
      setCourses(prev => [course, ...prev]);
      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Ошибка создания курса');
      return null;
    }
  }, [user]);

  // Save entire course (including lessons and slides)
  const saveCourse = useCallback(async (course: Course): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          cover_image: course.coverImage,
          target_audience: course.targetAudience,
          estimated_minutes: course.estimatedMinutes,
          is_published: course.isPublished,
          published_at: course.publishedAt?.toISOString(),
          tags: course.tags,
          design_system: course.designSystem as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Get existing lessons
      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', course.id);

      const existingLessonIds = existingLessons?.map(l => l.id) || [];
      const currentLessonIds = course.lessons.map(l => l.id);

      // Delete removed lessons
      const lessonsToDelete = existingLessonIds.filter(id => !currentLessonIds.includes(id));
      if (lessonsToDelete.length > 0) {
        await supabase.from('lessons').delete().in('id', lessonsToDelete);
      }

      // Upsert lessons
      for (const lesson of course.lessons) {
        const lessonExists = existingLessonIds.includes(lesson.id);
        
        if (lessonExists) {
          await supabase
            .from('lessons')
            .update({
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              estimated_minutes: lesson.estimatedMinutes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lesson.id);
        } else {
          await supabase
            .from('lessons')
            .insert({
              id: lesson.id,
              course_id: course.id,
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              estimated_minutes: lesson.estimatedMinutes,
            });
        }

        // Get existing slides for this lesson
        const { data: existingSlides } = await supabase
          .from('slides')
          .select('id')
          .eq('lesson_id', lesson.id);

        const existingSlideIds = existingSlides?.map(s => s.id) || [];
        const currentSlideIds = lesson.slides.map(s => s.id);

        // Delete removed slides
        const slidesToDelete = existingSlideIds.filter(id => !currentSlideIds.includes(id));
        if (slidesToDelete.length > 0) {
          await supabase.from('slides').delete().in('id', slidesToDelete);
        }

        // Upsert slides
        for (const slide of lesson.slides) {
          const slideExists = existingSlideIds.includes(slide.id);
          const slideData = {
            lesson_id: lesson.id,
            type: slide.type,
            order: slide.order,
            content: slide.content,
            image_url: slide.imageUrl,
            options: slide.options as any,
            correct_answer: slide.correctAnswer as any,
            explanation: slide.explanation,
            hints: slide.hints as any,
            blank_word: slide.blankWord,
            updated_at: new Date().toISOString(),
          };

          if (slideExists) {
            await supabase.from('slides').update(slideData).eq('id', slide.id);
          } else {
            await supabase.from('slides').insert({ id: slide.id, ...slideData });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Ошибка сохранения курса');
      return false;
    }
  }, [user]);

  // Delete a course
  const deleteCourse = useCallback(async (courseId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== courseId));
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Ошибка удаления курса');
      return false;
    }
  }, [user]);

  // Fetch all published courses (for catalog)
  const fetchPublishedCourses = useCallback(async (): Promise<Course[]> => {
    setIsLoading(true);
    try {
      // Fetch all published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (coursesError) throw coursesError;
      if (!coursesData || coursesData.length === 0) {
        return [];
      }

      // Fetch lessons for all courses
      const courseIds = coursesData.map(c => c.id);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('course_id', courseIds);

      if (lessonsError) throw lessonsError;

      // Fetch slides for all lessons
      const lessonIds = lessonsData?.map(l => l.id) || [];
      let slidesData: any[] = [];
      if (lessonIds.length > 0) {
        const { data, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .in('lesson_id', lessonIds);

        if (slidesError) throw slidesError;
        slidesData = data || [];
      }

      // Convert to app types
      const slides = slidesData.map(dbSlideToSlide);
      const lessons = (lessonsData || []).map(l => dbLessonToLesson(l, slides));
      const courses = coursesData.map(c => dbCourseToCourse(c, lessons));

      return courses;
    } catch (error) {
      console.error('Error fetching published courses:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    courses,
    isLoading,
    fetchCourses,
    fetchCourse,
    fetchPublishedCourses,
    createCourse,
    saveCourse,
    deleteCourse,
  };
};

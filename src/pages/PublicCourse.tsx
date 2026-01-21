import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide } from '@/types/course';
import { CoursePlayer } from '@/components/runtime/CoursePlayer';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        isExpanded?: boolean;
        initData?: string;
        initDataUnsafe?: {
          start_param?: string;
        };
        requestFullscreen?: () => void;
        disableVerticalSwipes?: () => void;
      };
    };
  }
}

const PublicCourse: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Telegram WebApp - just signal ready, no fullscreen
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      
      // Disable vertical swipes to prevent accidental closing
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
      }
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      // Log for debugging in Telegram
      console.log('PublicCourse: Starting fetch, courseId:', courseId);
      console.log('PublicCourse: URL:', window.location.href);
      console.log('PublicCourse: Telegram WebApp:', !!window.Telegram?.WebApp);
      
      if (!courseId) {
        console.error('PublicCourse: No courseId in URL');
        setError('ID курса не указан');
        setIsLoading(false);
        return;
      }

      // Validate courseId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        console.error('PublicCourse: Invalid courseId format:', courseId);
        setError('Неверный формат ID курса');
        setIsLoading(false);
        return;
      }

      try {
        console.log('PublicCourse: Fetching course from Supabase...');
        
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        console.log('PublicCourse: Course response:', { data: !!courseData, error: courseError });

        if (courseError) {
          console.error('PublicCourse: Course fetch error:', courseError);
          throw courseError;
        }
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

        console.log('PublicCourse: Lessons response:', { count: lessonsData?.length, error: lessonsError });

        if (lessonsError) {
          console.error('PublicCourse: Lessons fetch error:', lessonsError);
          throw lessonsError;
        }

        // Fetch slides for all lessons
        const lessonIds = lessonsData?.map(l => l.id) || [];
        const { data: slidesData, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .in('lesson_id', lessonIds.length > 0 ? lessonIds : [''])
          .order('order', { ascending: true });

        console.log('PublicCourse: Slides response:', { count: slidesData?.length, error: slidesError });

        if (slidesError) {
          console.error('PublicCourse: Slides fetch error:', slidesError);
          throw slidesError;
        }

        // Build lessons with slides
        const lessonsWithSlides: Lesson[] = (lessonsData || []).map(lesson => ({
          id: lesson.id,
          courseId: lesson.course_id,
          title: lesson.title,
          description: lesson.description || '',
          order: lesson.order,
          estimatedMinutes: lesson.estimated_minutes || 3,
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
          isPublished: courseData.is_published || false,
          publishedAt: courseData.published_at ? new Date(courseData.published_at) : undefined,
          currentVersion: courseData.current_version || 1,
          versions: [],
          designSystem: courseData.design_system as Course['designSystem'],
          createdAt: new Date(courseData.created_at),
          updatedAt: new Date(courseData.updated_at),
        };

        console.log('PublicCourse: Course loaded successfully');
        setCourse(fullCourse);
      } catch (err) {
        console.error('PublicCourse: Error fetching course:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Не удалось загрузить курс: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Загрузка курса...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground text-center">{error || 'Курс не найден'}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Возможно, курс был удалён или ссылка недействительна
        </p>
        
        {/* Debug info for Telegram */}
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground max-w-sm w-full">
          <p><strong>Debug:</strong></p>
          <p>URL: {window.location.href}</p>
          <p>courseId: {courseId || 'undefined'}</p>
          <p>Telegram: {window.Telegram?.WebApp ? 'да' : 'нет'}</p>
        </div>
        
        <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>
      </div>
    );
  }

  if (course.lessons.length === 0 || course.lessons.every(l => l.slides.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
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

  // Universal mobile-like container for all platforms (Telegram, mobile web, desktop)
  return (
    <div className="fixed inset-0 bg-muted/80 flex items-center justify-center">
      <div 
        className="w-full h-full max-w-[420px] md:h-[min(90vh,750px)] md:rounded-2xl md:shadow-2xl overflow-hidden"
        style={{ background: 'white' }}
      >
        <CoursePlayer course={course} onClose={() => navigate('/')} fullscreen />
      </div>
    </div>
  );
};

export default PublicCourse;

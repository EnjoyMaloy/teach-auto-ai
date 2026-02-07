import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import { getCategoryById } from '@/lib/categories';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteCourses = async () => {
      if (!user || favorites.length === 0) {
        setCourses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          cover_image,
          estimated_minutes,
          category,
          is_published,
          lessons:published_lessons(id)
        `)
        .in('id', favorites)
        .or('is_published.eq.true,is_link_accessible.eq.true');

      if (error) {
        console.error('Error fetching favorite courses:', error);
        setCourses([]);
      } else {
        const mappedCourses = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          coverImage: c.cover_image,
          estimatedMinutes: c.estimated_minutes || 0,
          category: c.category,
          isPublished: c.is_published,
          lessons: c.lessons || [],
          authorId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          targetAudience: '',
          currentVersion: 1,
          versions: [],
          tags: [],
        })) as Course[];
        setCourses(mappedCourses);
      }
      setIsLoading(false);
    };

    if (!favoritesLoading) {
      fetchFavoriteCourses();
    }
  }, [user, favorites, favoritesLoading]);

  const loading = isLoading || favoritesLoading;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0f0f12]">
      <AnimatedBackground />
      <div 
        className="relative z-10 p-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1.5rem)' }}
      >
      {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-muted-foreground dark:text-white/20 text-[13px] mb-2">
            Нет сохранённых курсов
          </div>
          <button 
            onClick={() => navigate('/catalog')}
            className="text-[13px] text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60 transition-colors"
          >
            Исследовать курсы →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {courses.map(course => (
            <CourseCardOverlay
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              coverImage={course.coverImage}
              lessonsCount={course.lessons.length}
              categoryName={getCategoryById((course as any).category)?.name}
              isFavorite={true}
              onToggleFavorite={() => toggleFavorite(course.id)}
              variant="favorites"
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────────────────────── */

const CourseCardSkeleton: React.FC = () => (
  <div className="bg-muted/50 dark:bg-white/[0.02] rounded-xl border border-border dark:border-white/[0.06] overflow-hidden">
    <Skeleton className="aspect-[4/5] rounded-none" />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function getLessonWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) return 'уроков';
  if (lastOne === 1) return 'урок';
  if (lastOne >= 2 && lastOne <= 4) return 'урока';
  return 'уроков';
}

function getCoursesWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) return 'курсов';
  if (lastOne === 1) return 'курс';
  if (lastOne >= 2 && lastOne <= 4) return 'курса';
  return 'курсов';
}

export default Favorites;

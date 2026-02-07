import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import { getCategoryById } from '@/lib/categories';
import AnimatedBackground from '@/components/layout/AnimatedBackground';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {courses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course}
              onRemove={() => toggleFavorite(course.id)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Course Card
───────────────────────────────────────────────────────────────────────────── */

interface CourseCardProps {
  course: Course & { category?: string };
  onRemove: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onRemove }) => {
  const navigate = useNavigate();
  const category = getCategoryById(course.category || '');

  return (
    <div 
      className="group relative bg-muted/50 dark:bg-white/[0.02] rounded-lg border border-border dark:border-white/[0.04] hover:border-border dark:hover:border-white/10 transition-colors cursor-pointer overflow-hidden"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-muted dark:bg-white/[0.02] relative">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-white/[0.03] flex items-center justify-center">
              <span className="text-muted-foreground dark:text-white/10 text-lg font-medium">
                {course.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-foreground/10 text-foreground/60 dark:bg-white/10 dark:text-white/60">
              {category.name}
            </span>
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center bg-foreground/20 text-foreground dark:bg-white/20 dark:text-white transition-colors hover:bg-foreground/30 dark:hover:bg-white/30"
        >
          <Star className="w-3 h-3" fill="currentColor" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-[13px] font-medium text-foreground dark:text-white/90 truncate mb-1">
          {course.title}
        </h3>
        <div className="text-[11px] text-muted-foreground dark:text-white/30">
          {course.lessons.length} {getLessonWord(course.lessons.length)}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────────────────────── */

const CourseCardSkeleton: React.FC = () => (
  <div className="bg-muted/50 dark:bg-white/[0.02] rounded-lg border border-border dark:border-white/[0.04] overflow-hidden">
    <Skeleton className="aspect-[16/10] rounded-none" />
    <div className="p-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
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

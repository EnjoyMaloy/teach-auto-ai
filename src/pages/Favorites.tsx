import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, BookOpen, Clock, Layers, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { getCategoryById } from '@/lib/categories';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Избранное</h1>
          <p className="text-sm text-white/40">
            {courses.length > 0 
              ? `${courses.length} сохранённых курсов` 
              : 'Твои сохранённые курсы'}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState onExplore={() => navigate('/catalog')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  );
};

// Course Card
interface CourseCardProps {
  course: Course & { category?: string };
  onRemove: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onRemove }) => {
  const navigate = useNavigate();
  const category = getCategoryById(course.category || '');

  return (
    <div 
      className="group bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors cursor-pointer"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Cover */}
      <div className="h-32 relative">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Category */}
        {category && (
          <span 
            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ 
              backgroundColor: `${category.color}30`,
              color: category.color
            }}
          >
            {category.name}
          </span>
        )}

        {/* Remove from favorites */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-yellow-400 transition-colors"
        >
          <Star className="w-3.5 h-3.5" fill="currentColor" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-white text-sm line-clamp-1 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-white/40 line-clamp-2 mb-2 min-h-[2rem]">
          {course.description || 'Без описания'}
        </p>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {course.lessons.length}
          </span>
          {course.estimatedMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.estimatedMinutes} мин
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State
const EmptyState: React.FC<{ onExplore: () => void }> = ({ onExplore }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white/[0.02] rounded-xl border border-white/5">
    <div className="relative mb-6">
      <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
        <Star className="w-8 h-8 text-yellow-500/40" />
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
        <Star className="w-3 h-3 text-primary" fill="currentColor" />
      </div>
    </div>
    
    <h3 className="text-white font-medium mb-1">Пока ничего не сохранено</h3>
    <p className="text-white/40 text-sm text-center max-w-xs mb-5">
      Добавляй понравившиеся курсы в избранное, нажимая на звёздочку
    </p>
    
    <Button onClick={onExplore} className="bg-primary hover:bg-primary/90">
      Исследовать курсы
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

export default Favorites;

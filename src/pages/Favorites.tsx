import React, { useEffect, useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import CourseCard from '@/components/catalog/CourseCard';
import { Button } from '@/components/ui/button';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's first name for personalization
  const userName = user?.user_metadata?.name?.split(' ')[0] || 'друг';

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
    <div className="min-h-screen bg-[hsl(0,0%,4%)] -m-6 p-6">
      {/* Hero Section */}
      <div className="relative mb-10">
        <div className="hero-gradient absolute inset-0 -top-6 h-[250px] pointer-events-none" />
        
        <div className="relative pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-warning" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Избранное</h1>
              <p className="text-white/50 text-sm">
                Твои сохранённые курсы, {userName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-glow animate-pulse">
              <div className="h-36 bg-white/5 rounded-t-2xl" />
              <div className="p-4">
                <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/5 rounded w-full mb-4" />
                <div className="flex gap-2">
                  <div className="h-4 bg-white/5 rounded w-16" />
                  <div className="h-4 bg-white/5 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card-glow">
          <div className="flex flex-col items-center justify-center py-20">
            {/* Empty state illustration */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-warning/10 rounded-3xl flex items-center justify-center">
                <Star className="w-12 h-12 text-warning/50" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-primary" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              Пока ничего не сохранено
            </h3>
            <p className="text-white/50 text-center max-w-sm mb-6">
              Исследуй курсы и добавляй понравившиеся в избранное, нажав на звёздочку
            </p>
            
            <Button 
              onClick={() => navigate('/catalog')}
              className="bg-primary hover:bg-primary/90"
            >
              Исследовать курсы
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6">
            <p className="text-white/40 text-sm">
              {courses.length} {courses.length === 1 ? 'курс' : courses.length < 5 ? 'курса' : 'курсов'} в избранном
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course as Course & { category?: string }}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Favorites;

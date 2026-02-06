import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import CourseCard from '@/components/catalog/CourseCard';

const Favorites: React.FC = () => {
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
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Избранное</h1>
        </div>
        <p className="text-muted-foreground">
          Сохранённые курсы для быстрого доступа
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse border-border">
              <div className="h-36 bg-muted rounded-t-lg" />
              <CardContent className="pt-4">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Пока ничего не сохранено
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Нажмите на звёздочку на карточке курса, чтобы добавить его в избранное
            </p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default Favorites;

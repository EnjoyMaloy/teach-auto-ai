import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCourses } from '@/hooks/useCourses';
import { useFavorites } from '@/hooks/useFavorites';
import { Course } from '@/types/course';
import { getCategoryById } from '@/lib/categories';
import CategoryFilter from '@/components/catalog/CategoryFilter';
import CourseCard from '@/components/catalog/CourseCard';

const Catalog: React.FC = () => {
  const { fetchPublishedCourses, isLoading } = useCourses();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  // Filter courses by category and search
  const filteredCourses = courses.filter(course => {
    const matchesCategory = !selectedCategory || (course as any).category === selectedCategory;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Исследовать</h1>
        <p className="text-muted-foreground mt-1">
          Открывай новые знания и развивайся вместе с нами
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск курсов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
          Категории
        </h2>
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedCategory 
            ? getCategoryById(selectedCategory)?.name 
            : 'Все курсы'}
        </h2>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-primary hover:underline"
          >
            Показать все
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
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
      ) : filteredCourses.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {selectedCategory || searchQuery 
                ? 'Курсы не найдены' 
                : 'Пока нет опубликованных курсов'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {selectedCategory || searchQuery
                ? 'Попробуйте изменить параметры поиска' 
                : 'Здесь появятся опубликованные курсы от всех авторов'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course as Course & { category?: string }}
              isFavorite={isFavorite(course.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;

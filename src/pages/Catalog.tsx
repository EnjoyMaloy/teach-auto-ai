import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Layers } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { COURSE_CATEGORIES, getCategoryById } from '@/lib/categories';

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPublishedCourses, isLoading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  // Filter courses by category
  const filteredCourses = selectedCategory
    ? courses.filter(course => (course as any).category === selectedCategory)
    : courses;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Каталог курсов</h1>
        <p className="text-muted-foreground mt-1">
          Выбери категорию и подбери подходящие курсы для твоих интересов
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {COURSE_CATEGORIES.map(category => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              className={`
                relative p-6 rounded-xl transition-all duration-200
                flex flex-col items-center justify-center gap-3 text-center
                hover:scale-105 hover:shadow-lg
                ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
              `}
              style={{ backgroundColor: category.color }}
            >
              <Icon className="w-8 h-8 text-gray-800" />
              <span className="text-sm font-medium text-gray-800">{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {selectedCategory 
            ? `Курсы: ${getCategoryById(selectedCategory)?.name}` 
            : 'Все курсы'}
        </h2>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-primary hover:underline mt-1"
          >
            Показать все курсы
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
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
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {selectedCategory ? 'Курсы в этой категории не найдены' : 'Пока нет опубликованных курсов'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {selectedCategory 
                ? 'Попробуйте выбрать другую категорию' 
                : 'Здесь появятся опубликованные курсы от всех авторов платформы'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map(course => {
            const category = getCategoryById((course as any).category);
            return (
              <Card 
                key={course.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="h-36 bg-gradient-to-br from-primary/20 to-accent/30 relative overflow-hidden">
                  {course.coverImage ? (
                    <img 
                      src={course.coverImage} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  {category && (
                    <div 
                      className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium text-gray-800"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {course.description || 'Описание отсутствует'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      <span>{course.lessons.length} уроков</span>
                    </div>
                    {course.estimatedMinutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.estimatedMinutes} мин</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Catalog;
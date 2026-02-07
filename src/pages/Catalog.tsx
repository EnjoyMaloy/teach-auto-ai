import React, { useEffect, useState } from 'react';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
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

  // Get featured course (first one with cover image)
  const featuredCourse = courses.find(c => c.coverImage);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] -m-6 p-6">
      {/* Hero Section */}
      <div className="relative mb-10">
        {/* Hero gradient background */}
        <div className="hero-gradient absolute inset-0 -top-6 h-[300px] pointer-events-none" />
        
        <div className="relative pt-4">
          {/* Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Исследуй</h1>
              <p className="text-white/50 text-sm">Открывай новые знания</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <Input
              placeholder="Поиск курсов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-white/40 mb-4 uppercase tracking-wider">
          Категории
        </h2>
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Featured Course */}
      {featuredCourse && !selectedCategory && !searchQuery && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium text-white/70">Популярное</h2>
          </div>
          <div 
            className="card-glow overflow-hidden cursor-pointer group"
            onClick={() => window.location.href = `/course/${featuredCourse.id}`}
          >
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-1/2 h-48 md:h-64 relative overflow-hidden">
                {featuredCourse.coverImage && (
                  <img 
                    src={featuredCourse.coverImage} 
                    alt={featuredCourse.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[hsl(0,0%,10%)] hidden md:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,10%)] to-transparent md:hidden" />
              </div>
              {/* Content */}
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <div className="text-xs text-primary font-medium mb-2 uppercase tracking-wider">
                  Рекомендуем
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {featuredCourse.title}
                </h3>
                <p className="text-white/50 text-sm line-clamp-2 mb-4">
                  {featuredCourse.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-white/40">
                  <span>{featuredCourse.lessons.length} уроков</span>
                  {featuredCourse.estimatedMinutes > 0 && (
                    <span>{featuredCourse.estimatedMinutes} мин</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          {selectedCategory 
            ? getCategoryById(selectedCategory)?.name 
            : 'Все курсы'}
          <span className="text-white/30 ml-2 text-base font-normal">
            ({filteredCourses.length})
          </span>
        </h2>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Показать все
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
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
      ) : filteredCourses.length === 0 ? (
        <div className="card-glow">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {selectedCategory || searchQuery 
                ? 'Курсы не найдены' 
                : 'Пока нет опубликованных курсов'}
            </h3>
            <p className="text-white/50 text-center max-w-md">
              {selectedCategory || searchQuery
                ? 'Попробуйте изменить параметры поиска' 
                : 'Здесь появятся опубликованные курсы от всех авторов'}
            </p>
          </div>
        </div>
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

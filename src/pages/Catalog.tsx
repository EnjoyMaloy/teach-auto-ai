import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, BookOpen, Clock, Layers, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCourses } from '@/hooks/useCourses';
import { useFavorites } from '@/hooks/useFavorites';
import { Course } from '@/types/course';
import { COURSE_CATEGORIES, getCategoryById } from '@/lib/categories';
import { cn } from '@/lib/utils';

const Catalog: React.FC = () => {
  const navigate = useNavigate();
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

  const filteredCourses = courses.filter(course => {
    const matchesCategory = !selectedCategory || (course as any).category === selectedCategory;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Исследовать</h1>
            <p className="text-sm text-white/40">Открывай новые знания</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          placeholder="Поиск курсов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            !selectedCategory 
              ? "bg-primary text-white" 
              : "bg-white/5 text-white/50 hover:text-white/70"
          )}
        >
          Все
        </button>
        {COURSE_CATEGORIES.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === category.id
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/50 hover:text-white/70"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-white/50">
          {selectedCategory 
            ? getCategoryById(selectedCategory)?.name 
            : 'Все курсы'}
          <span className="ml-1.5 text-white/30">({filteredCourses.length})</span>
        </h2>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-primary hover:text-primary/80"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState hasFilters={!!selectedCategory || !!searchQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id}
              course={course}
              isFavorite={isFavorite(course.id)}
              onToggleFavorite={() => toggleFavorite(course.id)}
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
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isFavorite, onToggleFavorite }) => {
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

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
            "bg-black/30 hover:bg-black/50",
            isFavorite ? "text-yellow-400" : "text-white/50 hover:text-white/70"
          )}
        >
          <Star className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} />
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
const EmptyState: React.FC<{ hasFilters: boolean }> = ({ hasFilters }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white/[0.02] rounded-xl border border-white/5">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
      <Compass className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-white font-medium mb-1">
      {hasFilters ? 'Ничего не найдено' : 'Пока нет курсов'}
    </h3>
    <p className="text-white/40 text-sm">
      {hasFilters ? 'Попробуйте изменить параметры поиска' : 'Здесь появятся опубликованные курсы'}
    </p>
  </div>
);

export default Catalog;

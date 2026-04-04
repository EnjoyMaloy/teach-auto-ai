import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import emptyCatalogImage from '@/assets/empty-catalog.png';

// Eagerly preload the empty state image so it's instant when needed
const preloadImg = new Image();
preloadImg.src = emptyCatalogImage;
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { usePublishedCourses } from '@/hooks/useCachedCourses';
import { useCachedFavorites } from '@/hooks/useCachedFavorites';
import { COURSE_CATEGORIES, getCategoryById } from '@/lib/categories';
import { getCoursesWord } from '@/lib/pluralize';

import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';

type FilterType = 'all' | string;

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading } = usePublishedCourses();
  const { isFavorite, toggleFavorite } = useCachedFavorites();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filter === 'all' || course.category === filter;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="relative z-10 p-4 md:p-6 transition-all duration-200"
        style={{ paddingLeft: '1rem' }}
      >
      {/* Top spacer for mobile header */}
      <div className="h-16 md:h-14" />
      
      {/* Desktop Search - aligned with sidebar trigger */}
      <div className="hidden md:block fixed top-4 right-6 z-20">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-white/20" />
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 bg-muted dark:bg-white/[0.03] border-border dark:border-white/[0.06] text-foreground dark:text-white text-[13px] placeholder:text-muted-foreground dark:placeholder:text-white/30"
          />
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="md:hidden mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-white/20" />
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted dark:bg-white/[0.03] border-border dark:border-white/[0.06] text-foreground dark:text-white text-[13px] placeholder:text-muted-foreground dark:placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1 mb-4 md:mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`
            px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap
            ${filter === 'all' 
              ? 'bg-foreground/10 text-foreground dark:bg-white/10 dark:text-white' 
              : 'text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
            }
          `}
        >
          Все
        </button>
        {COURSE_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setFilter(category.id)}
            className={`
              px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap
              ${filter === category.id 
                ? 'bg-foreground/10 text-foreground dark:bg-white/10 dark:text-white' 
                : 'text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results count - only show if there are results */}
      {filteredCourses.length > 0 && (
        <div className="text-[12px] text-muted-foreground dark:text-white/30 mb-4">
          {filter !== 'all' && (
            <span>
              {getCategoryById(filter)?.name} · 
            </span>
          )}
          {' '}{filteredCourses.length} {getCoursesWord(filteredCourses.length)}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
          {[...Array(10)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <img 
            src={emptyCatalogImage} 
            alt="No courses" 
            className="w-32 h-32 mb-6 object-contain"
          />
          <h3 className="text-lg font-medium text-foreground dark:text-white/80 mb-2">
            На платформе ещё нет публичных курсов
          </h3>
          <p className="text-sm text-muted-foreground dark:text-white/40 max-w-sm">
            Скоро здесь появятся интересные курсы от авторов
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
          {filteredCourses.map(course => (
            <CourseCardOverlay
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              coverImage={course.coverImage}
              lessonsCount={course.lessonsCount}
              categoryName={getCategoryById(course.category)?.name}
              isFavorite={isFavorite(course.id)}
              onToggleFavorite={() => toggleFavorite(course.id)}
              variant="catalog"
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


export default Catalog;

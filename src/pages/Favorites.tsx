import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCachedFavorites } from '@/hooks/useCachedFavorites';
import { getCategoryById } from '@/lib/categories';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';

type FilterType = 'all' | 'mine' | 'public';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteCourses, toggleFavorite, isLoadingCourses } = useCachedFavorites();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredCourses = favoriteCourses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'mine') return course.authorId === user?.id;
    return course.authorId !== user?.id;
  });

  const counts = {
    all: favoriteCourses.length,
    mine: favoriteCourses.filter(c => c.authorId === user?.id).length,
    public: favoriteCourses.filter(c => c.authorId !== user?.id).length,
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'mine', label: 'Мои' },
    { id: 'public', label: 'Публичные' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0f0f12]">
      <AnimatedBackground />
      <div 
        className="relative z-10 p-4 md:p-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1rem)' }}
      >
        {/* Top spacer for mobile header */}
        <div className="h-16 md:h-14" />

        {/* Filters */}
        {favoriteCourses.length > 0 && (
          <div className="flex items-center gap-1 mb-4 md:mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`
                  px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap
                  ${filter === f.id 
                    ? 'bg-foreground/10 text-foreground dark:bg-white/10 dark:text-white' 
                    : 'text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
                  }
                `}
              >
                {f.label}
                <span className="ml-1.5 text-muted-foreground dark:text-white/30">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        )}

        {isLoadingCourses ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : favoriteCourses.length === 0 ? (
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
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-muted-foreground dark:text-white/20 text-[13px]">
              {filter === 'mine' ? 'Нет ваших курсов в избранном' : 'Нет публичных курсов в избранном'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
            {filteredCourses.map(course => (
              <CourseCardOverlay
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                coverImage={course.coverImage}
                lessonsCount={course.lessonsCount}
                categoryName={getCategoryById(course.category)?.name}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(course.id)}
                isPublished={course.isPublished}
                variant={course.authorId === user?.id ? 'workshop' : 'favorites'}
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


export default Favorites;

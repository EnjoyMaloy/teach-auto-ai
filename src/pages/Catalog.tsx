import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useCourses } from '@/hooks/useCourses';
import { useFavorites } from '@/hooks/useFavorites';
import { Course } from '@/types/course';
import { COURSE_CATEGORIES, getCategoryById } from '@/lib/categories';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';

type FilterType = 'all' | string;

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPublishedCourses, isLoading } = useCourses();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filter === 'all' || (course as any).category === filter;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0f0f12]">
      <AnimatedBackground />
      <div 
        className="relative z-10 p-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1.5rem)' }}
      >
      {/* Search */}
      <div className="relative max-w-sm mb-6 ml-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-white/20" />
        <Input
          placeholder="Поиск курсов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-muted dark:bg-white/[0.03] border-border dark:border-white/[0.06] text-foreground dark:text-white text-[13px] placeholder:text-muted-foreground dark:placeholder:text-white/30"
        />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
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

      {/* Results count */}
      <div className="text-[12px] text-muted-foreground dark:text-white/30 mb-4">
        {filter !== 'all' && (
          <span>
            {getCategoryById(filter)?.name} · 
          </span>
        )}
        {' '}{filteredCourses.length} {getCoursesWord(filteredCourses.length)}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {[...Array(10)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-muted-foreground dark:text-white/20 text-[13px]">
            {searchQuery || filter !== 'all'
              ? 'Ничего не найдено' 
              : 'Пока нет курсов'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredCourses.map(course => (
            <CourseCardOverlay
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              coverImage={course.coverImage}
              lessonsCount={course.lessons.length}
              categoryName={getCategoryById((course as any).category)?.name}
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

export default Catalog;

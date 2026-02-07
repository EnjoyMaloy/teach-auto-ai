import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCourses } from '@/hooks/useCourses';
import { useFavorites } from '@/hooks/useFavorites';
import { Course } from '@/types/course';
import { COURSE_CATEGORIES, getCategoryById } from '@/lib/categories';

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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[15px] font-semibold text-white">Исследовать</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <Input
          placeholder="Поиск курсов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-white/[0.03] border-white/[0.06] text-white text-[13px] placeholder:text-white/30"
        />
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`
            px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap
            ${filter === 'all' 
              ? 'bg-white/10 text-white' 
              : 'text-white/40 hover:text-white/60'
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
                ? 'bg-white/10 text-white' 
                : 'text-white/40 hover:text-white/60'
              }
            `}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-[12px] text-white/30 mb-4">
        {filter !== 'all' && (
          <span>
            {getCategoryById(filter)?.name} · 
          </span>
        )}
        {' '}{filteredCourses.length} {getCoursesWord(filteredCourses.length)}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-white/20 text-[13px]">
            {searchQuery || filter !== 'all'
              ? 'Ничего не найдено' 
              : 'Пока нет курсов'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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

/* ─────────────────────────────────────────────────────────────────────────────
   Course Card
───────────────────────────────────────────────────────────────────────────── */

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
      className="group relative bg-white/[0.02] rounded-lg border border-white/[0.04] hover:border-white/10 transition-colors cursor-pointer overflow-hidden"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-white/[0.02] relative">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
              <span className="text-white/10 text-lg font-medium">
                {course.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60">
              {category.name}
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`
            absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center transition-colors
            ${isFavorite 
              ? 'bg-white/20 text-white' 
              : 'bg-black/40 text-white/40 opacity-0 group-hover:opacity-100 hover:text-white/70'
            }
          `}
        >
          <Star className="w-3 h-3" fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-[13px] font-medium text-white/90 truncate mb-1">
          {course.title}
        </h3>
        <div className="text-[11px] text-white/30">
          {course.lessons.length} {getLessonWord(course.lessons.length)}
        </div>
      </div>
    </div>
  );
};

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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Layers, Star } from 'lucide-react';
import { Course } from '@/types/course';
import { getCategoryById } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course & { category?: string };
  isFavorite?: boolean;
  onToggleFavorite?: (courseId: string) => void;
  showFavoriteButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isFavorite = false, 
  onToggleFavorite,
  showFavoriteButton = true 
}) => {
  const navigate = useNavigate();
  const category = getCategoryById(course.category || '');

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(course.id);
  };

  return (
    <div 
      className="card-glow cursor-pointer overflow-hidden group"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Cover Image */}
      <div className="h-36 bg-gradient-to-br from-primary/20 to-accent/10 relative overflow-hidden">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[hsl(0,0%,8%)]">
            <BookOpen className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        {category && (
          <div 
            className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm"
            style={{ 
              backgroundColor: `${category.color}20`,
              color: category.color.replace('92%', '80%')
            }}
          >
            {category.name}
          </div>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "backdrop-blur-sm bg-black/30 hover:bg-black/50",
              isFavorite 
                ? "text-warning" 
                : "text-white/60 hover:text-warning"
            )}
          >
            <Star 
              className="w-4 h-4" 
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-white/50 mb-3 line-clamp-2 min-h-[2.5rem]">
          {course.description || 'Описание отсутствует'}
        </p>
        <div className="flex items-center gap-4 text-sm text-white/40">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{course.lessons.length} уроков</span>
          </div>
          {course.estimatedMinutes > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{course.estimatedMinutes} мин</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;

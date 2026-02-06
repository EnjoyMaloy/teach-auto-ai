import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-border bg-card hover:border-primary/30"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      {/* Cover Image */}
      <div className="h-36 bg-gradient-to-br from-primary/10 to-accent/20 relative overflow-hidden">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-primary/30" />
          </div>
        )}
        
        {/* Category Badge */}
        {category && (
          <div 
            className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium text-foreground/80 backdrop-blur-sm"
            style={{ backgroundColor: category.color }}
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
              "backdrop-blur-sm bg-card/80 hover:bg-card",
              isFavorite 
                ? "text-warning" 
                : "text-muted-foreground hover:text-warning"
            )}
          >
            <Star 
              className="w-4 h-4" 
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        )}
      </div>

      <CardContent className="pt-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
          {course.description || 'Описание отсутствует'}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
};

export default CourseCard;

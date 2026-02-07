import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MoreHorizontal, Trash2, Settings, Eye, BarChart3, BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CourseCardOverlayProps {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  lessonsCount: number;
  completedCount?: number;
  categoryName?: string;
  isPublished?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  variant?: 'catalog' | 'favorites' | 'workshop';
  className?: string;
}

const CourseCardOverlay: React.FC<CourseCardOverlayProps> = ({
  id,
  title,
  description,
  coverImage,
  lessonsCount,
  completedCount = 0,
  categoryName,
  isPublished,
  isFavorite,
  onToggleFavorite,
  onDelete,
  variant = 'catalog',
  className,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (variant === 'workshop') {
      navigate(`/editor/${id}`);
    } else {
      navigate(`/course/${id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variant === 'workshop') {
      navigate(`/editor/${id}`);
    } else {
      navigate(`/course/${id}`);
    }
  };

  const getLessonWord = (count: number): string => {
    const lastTwo = count % 100;
    const lastOne = count % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return 'уроков';
    if (lastOne === 1) return 'урок';
    if (lastOne >= 2 && lastOne <= 4) return 'урока';
    return 'уроков';
  };

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl cursor-pointer shadow-lg transition-transform duration-300 hover:scale-[1.02]',
        className
      )}
      onClick={handleClick}
    >
      {/* Full background image */}
      {coverImage ? (
        <img
          src={coverImage}
          alt={title}
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <div className="aspect-[2/3] w-full bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30 flex items-center justify-center">
          <span className="text-6xl font-bold text-white/30">
            {title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Top action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {/* Favorite button */}
        {(variant === 'catalog' || variant === 'favorites') && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
              isFavorite
                ? 'bg-white/30 backdrop-blur-sm text-white'
                : 'bg-white/20 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/30'
            )}
          >
            <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Workshop menu */}
        {variant === 'workshop' && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="min-w-[140px] bg-card dark:bg-[#1a1a1b] border-border dark:border-white/10 p-1"
              >
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/course/${id}/settings`);
                  }}
                  className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
                >
                  <Settings className="w-3.5 h-3.5 mr-2" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/course/${id}/stats`);
                  }}
                  className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-2" />
                  Статистика
                </DropdownMenuItem>
                {isPublished && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/course/${id}`, '_blank');
                    }}
                    className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    Открыть
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-border dark:bg-white/5" />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-[13px] text-red-400 focus:text-red-400 focus:bg-red-500/10 rounded px-2 py-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-white line-clamp-2">{description}</p>
          )}
        </div>

        {/* Stats and action button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {completedCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {lessonsCount}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleButtonClick}
            className="gap-1.5 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border-0"
          >
            {variant === 'workshop' ? 'Открыть' : 'Смотреть'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCardOverlay;

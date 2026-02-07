import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MoreHorizontal, Trash2, Settings, Eye, BarChart3, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  categoryName?: string;
  isPublished?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  variant?: 'catalog' | 'favorites' | 'workshop';
}

const CourseCardOverlay: React.FC<CourseCardOverlayProps> = ({
  id,
  title,
  description,
  coverImage,
  lessonsCount,
  categoryName,
  isPublished,
  isFavorite,
  onToggleFavorite,
  onDelete,
  variant = 'catalog',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
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
        'group relative w-full overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]',
        'bg-card dark:bg-[#141417] border border-border dark:border-white/[0.06]'
      )}
      onClick={handleClick}
    >
      {/* Image section */}
      <div className="aspect-[4/3] w-full relative overflow-hidden rounded-t-2xl">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 dark:from-primary/20 dark:via-primary/10 dark:to-accent/10 flex items-center justify-center">
            <span className="text-5xl font-bold text-primary/40 dark:text-white/20">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Status/Category badge */}
          <div>
            {variant === 'workshop' ? (
              isPublished ? (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/90 text-white shadow-sm">
                  Опубликован
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-black/40 text-white backdrop-blur-sm">
                  Черновик
                </span>
              )
            ) : categoryName ? (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-black/40 text-white backdrop-blur-sm">
                {categoryName}
              </span>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Favorite button */}
            {(variant === 'catalog' || variant === 'favorites') && onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm',
                  isFavorite
                    ? 'bg-white/30 backdrop-blur-sm text-white'
                    : 'bg-black/40 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:text-white'
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
                    <button className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-colors shadow-sm">
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
        </div>
      </div>

      {/* Content section */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold leading-tight line-clamp-2 text-foreground dark:text-white mb-1.5">
          {title}
        </h3>
        {description && (
          <p className="text-[13px] text-muted-foreground dark:text-white/50 line-clamp-2 leading-relaxed mb-3">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground dark:text-white/40">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{lessonsCount} {getLessonWord(lessonsCount)}</span>
        </div>
      </div>
    </div>
  );
};

export default CourseCardOverlay;

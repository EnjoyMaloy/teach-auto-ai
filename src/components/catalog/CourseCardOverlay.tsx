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
        'group relative w-full overflow-hidden rounded-xl cursor-pointer transition-transform hover:scale-[1.02]',
        'bg-muted dark:bg-white/[0.02] border border-border dark:border-white/[0.06]'
      )}
      onClick={handleClick}
    >
      {/* Background image or placeholder */}
      <div className="aspect-[4/5] w-full relative">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-white/[0.03] dark:to-white/[0.01] flex items-center justify-center">
            <span className="text-4xl font-bold text-primary/30 dark:text-white/10">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* Status/Category badge */}
          <div>
            {variant === 'workshop' ? (
              isPublished ? (
                <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/90 text-white">
                  Опубликован
                </span>
              ) : (
                <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/20 text-white backdrop-blur-sm">
                  Черновик
                </span>
              )
            ) : categoryName ? (
              <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/20 text-white backdrop-blur-sm">
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
                  'w-7 h-7 rounded-md flex items-center justify-center transition-all',
                  isFavorite
                    ? 'bg-white/30 text-white'
                    : 'bg-black/30 text-white/60 opacity-0 group-hover:opacity-100 hover:text-white'
                )}
              >
                <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}

            {/* Workshop menu */}
            {variant === 'workshop' && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="w-7 h-7 rounded-md bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-colors">
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

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-[15px] font-semibold leading-tight line-clamp-2 mb-2">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-[12px] text-white/70">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lessonsCount} {getLessonWord(lessonsCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCardOverlay;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, MoreHorizontal, Trash2, Settings, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AnimatedBackground from '@/components/layout/AnimatedBackground';

type FilterType = 'all' | 'drafts' | 'published';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, fetchCourses, createCourse, deleteCourse } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'drafts') return !course.isPublished;
    return course.isPublished;
  });

  const counts = {
    all: courses.length,
    drafts: courses.filter(c => !c.isPublished).length,
    published: courses.filter(c => c.isPublished).length,
  };

  const handleCreate = async () => {
    setIsCreating(true);
    const course = await createCourse('Новый курс');
    setIsCreating(false);
    if (course) navigate(`/editor/${course.id}`);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    const success = await deleteCourse(courseToDelete.id);
    if (success) toast.success('Курс удалён');
    setCourseToDelete(null);
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'drafts', label: 'Черновики' },
    { id: 'published', label: 'Опубликованные' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background dark:bg-[#0f0f12]">
      <AnimatedBackground />
      <div 
        className="relative z-10 p-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1.5rem)' }}
      >
      {/* Top Bar */}
      <div className="flex items-center justify-end mb-6">
        <Button 
          onClick={handleCreate} 
          disabled={isCreating}
          size="sm"
          className="h-8 px-3 bg-primary hover:bg-primary/90 text-[13px]"
        >
          {isCreating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Новый курс
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-muted-foreground dark:text-white/20 text-[13px] mb-4">
            {filter === 'all' 
              ? 'У вас пока нет курсов' 
              : filter === 'drafts'
                ? 'Нет черновиков'
                : 'Нет опубликованных курсов'
            }
          </div>
          {filter === 'all' && (
            <Button 
              onClick={handleCreate} 
              disabled={isCreating}
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:border-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Создать первый курс
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course}
              onDelete={() => setCourseToDelete(course)}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent className="bg-card dark:bg-[#1a1a1b] border-border dark:border-white/10 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] text-foreground dark:text-white">Удалить курс?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground dark:text-white/50">
              «{courseToDelete?.title}» будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 px-3 text-[13px] bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:border-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="h-8 px-3 text-[13px] bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Course Card
───────────────────────────────────────────────────────────────────────────── */

interface CourseCardProps {
  course: Course;
  onDelete: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group relative bg-muted/50 dark:bg-white/[0.02] rounded-lg border border-border dark:border-white/[0.04] hover:border-border dark:hover:border-white/10 transition-colors cursor-pointer overflow-hidden"
      onClick={() => navigate(`/editor/${course.id}`)}
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-muted dark:bg-white/[0.02] relative">
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-white/[0.03] flex items-center justify-center">
              <span className="text-muted-foreground dark:text-white/10 text-lg font-medium">
                {course.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {course.isPublished ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
              Опубликован
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-foreground/10 text-foreground/50 dark:bg-white/10 dark:text-white/50">
              Черновик
            </span>
          )}
        </div>

        {/* Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="w-6 h-6 rounded bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="min-w-[140px] bg-card dark:bg-[#1a1a1b] border-border dark:border-white/10 p-1"
            >
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/course/${course.id}/settings`);
                }}
                className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
              >
                <Settings className="w-3.5 h-3.5 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/course/${course.id}/stats`);
                }}
                className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-2" />
                Статистика
              </DropdownMenuItem>
              {course.isPublished && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/course/${course.id}`, '_blank');
                  }}
                  className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
                >
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  Открыть
                </DropdownMenuItem>
              )}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-[13px] font-medium text-foreground dark:text-white/90 truncate mb-1">
          {course.title}
        </h3>
        <div className="text-[11px] text-muted-foreground dark:text-white/30">
          {course.lessons.length} {getLessonWord(course.lessons.length)}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────────────────────── */

const CourseCardSkeleton: React.FC = () => (
  <div className="bg-muted/50 dark:bg-white/[0.02] rounded-lg border border-border dark:border-white/[0.04] overflow-hidden">
    <Skeleton className="aspect-[16/10] rounded-none" />
    <div className="p-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
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

export default Dashboard;

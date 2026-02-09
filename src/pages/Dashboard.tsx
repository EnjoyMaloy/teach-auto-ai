import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2 } from 'lucide-react';
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
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';
import { useUserCourses, CourseListItem } from '@/hooks/useCachedCourses';
import { useCachedFavorites } from '@/hooks/useCachedFavorites';

type FilterType = 'all' | 'drafts' | 'published';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, createCourse, deleteCourse, isCreating } = useUserCourses();
  const { isFavorite, toggleFavorite } = useCachedFavorites();
  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

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
    try {
      const course = await createCourse('Новый курс');
      if (course) navigate(`/editor/${course.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete.id);
      toast.success('Курс удалён');
    } catch {
      // Error handled by mutation
    }
    setCourseToDelete(null);
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'drafts', label: 'Черновики' },
    { id: 'published', label: 'Опубликованные' },
  ];

  return (
    <div className="min-h-screen relative overflow-auto bg-background dark:bg-[#0f0f12]">
      <AnimatedBackground />
      
      {/* Mobile header with Create button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-end px-4">
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
              Создать
            </>
          )}
        </Button>
      </div>
      
      <div 
        className="relative z-10 p-4 md:p-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1rem)' }}
      >
      {/* Top spacer for mobile header */}
      <div className="h-16 md:h-0" />
      
      {/* Desktop Top Bar */}
      <div className="hidden md:flex items-center justify-end mb-4 md:mb-6">
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

      {isLoading ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
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
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
          {filteredCourses.map(course => (
            <CourseCardOverlay
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              coverImage={course.coverImage}
              lessonsCount={course.lessonsCount}
              isPublished={course.isPublished}
              variant="workshop"
              isFavorite={isFavorite(course.id)}
              onToggleFavorite={() => toggleFavorite(course.id)}
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
   Skeleton
───────────────────────────────────────────────────────────────────────────── */

const CourseCardSkeleton: React.FC = () => (
  <div className="bg-muted/50 dark:bg-white/[0.02] rounded-xl border border-border dark:border-white/[0.06] overflow-hidden">
    <Skeleton className="aspect-[4/5] rounded-none" />
  </div>
);


export default Dashboard;

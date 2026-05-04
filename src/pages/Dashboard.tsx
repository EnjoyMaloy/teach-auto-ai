import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Lock, Link2, Globe } from 'lucide-react';
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

import CourseCardOverlay from '@/components/catalog/CourseCardOverlay';
import { useUserCourses, CourseListItem } from '@/hooks/useCachedCourses';
import { useCachedFavorites } from '@/hooks/useCachedFavorites';
import { useSidebar } from '@/components/ui/sidebar';


type FilterType = 'all' | 'private' | 'link' | 'public';

const getAccessType = (c: CourseListItem): 'private' | 'link' | 'public' => {
  if (c.isPublished) return 'public';
  if (c.isLinkAccessible) return 'link';
  return 'private';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, deleteCourse } = useUserCourses();
  const { state: sidebarState } = useSidebar();
  const isSidebarCollapsed = sidebarState === 'collapsed';
  const { isFavorite, toggleFavorite } = useCachedFavorites();
  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !search.trim() || course.title?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    return getAccessType(course) === filter;
  });

  const counts = {
    all: courses.length,
    private: courses.filter(c => getAccessType(c) === 'private').length,
    link: courses.filter(c => getAccessType(c) === 'link').length,
    public: courses.filter(c => getAccessType(c) === 'public').length,
  };

  const handleCreate = () => {
    navigate('/editor/new', { state: { openAIGenerate: true } });
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

  const filters: { id: FilterType; label: string; icon: typeof Lock | null }[] = [
    { id: 'all', label: 'Все', icon: null },
    { id: 'private', label: 'Закрытый', icon: Lock },
    { id: 'link', label: 'По ссылке', icon: Link2 },
    { id: 'public', label: 'В каталоге', icon: Globe },
  ];

  return (
    <div className="min-h-screen relative overflow-auto">
      
      {/* Mobile header with Create button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-end px-4">
        <Button 
          onClick={handleCreate} 
          size="sm"
          className="h-8 px-3 bg-primary hover:bg-primary/90 text-[13px]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Создать
        </Button>
      </div>
      
      <div 
        className="relative z-10 p-4 md:p-6 transition-all duration-200"
        style={{ paddingLeft: '1rem' }}
      >
      {/* Top spacer for mobile header */}
      <div className="h-16 md:h-2" />
      
      {/* Desktop Top Bar */}
      <div className="hidden md:block relative z-20 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5">Мои курсы</h1>
            <p className="text-sm text-muted-foreground">Создавайте курсы, публикуйте их в Open Academy или делитесь с аудиторией через свой Telegram Mini App</p>
          </div>
          <Button 
            onClick={handleCreate} 
            size="sm"
            className="h-8 px-3 bg-primary hover:bg-primary/90 text-[13px] shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Создать курс
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {filters.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                    filter === f.id 
                      ? 'bg-foreground/10 text-foreground dark:bg-white/10 dark:text-white' 
                      : 'text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {f.label}
                  <span className="ml-1 text-muted-foreground dark:text-white/30">{counts[f.id]}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию"
              className="h-8 pl-8 text-[13px] bg-background/40 border-border"
            />
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden mb-4 space-y-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                filter === f.id 
                  ? 'bg-foreground/10 text-foreground dark:bg-white/10 dark:text-white' 
                  : 'text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-muted-foreground dark:text-white/30">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию"
            className="h-8 pl-8 text-[13px] bg-background/40 border-border"
          />
        </div>
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
            {filter === 'all' ? 'У вас пока нет курсов' : 'Ничего не найдено'}
          </div>
          {filter === 'all' && (
            <Button 
              onClick={handleCreate} 
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

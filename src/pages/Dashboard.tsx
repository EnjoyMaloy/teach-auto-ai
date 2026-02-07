import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Clock, 
  FileText, 
  Trash2, 
  Loader2,
  Sparkles,
  Settings,
  BarChart3,
  Eye,
  Edit3,
  MoreHorizontal,
  Globe,
  FileEdit,
  Search
} from 'lucide-react';
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


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, fetchCourses, createCourse, deleteCourse } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(course => {
    const matchesTab = activeTab === 'all' ? true :
      activeTab === 'drafts' ? !course.isPublished :
      course.isPublished;
    
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  const draftsCount = courses.filter(c => !c.isPublished).length;
  const publishedCount = courses.filter(c => c.isPublished).length;

  const handleCreateCourse = async () => {
    setIsCreating(true);
    const course = await createCourse('Новый курс');
    setIsCreating(false);
    
    if (course) {
      navigate(`/editor/${course.id}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    const success = await deleteCourse(courseToDelete.id);
    if (success) {
      toast.success('Курс удалён');
    }
    setCourseToDelete(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const CourseCard = ({ course }: { course: Course & { moderationStatus?: string } }) => (
    <div className="card-glow group cursor-pointer overflow-hidden">
      {/* Banner */}
      <div 
        className="h-36 relative overflow-hidden"
        style={course.coverImage ? { 
          backgroundImage: `url(${course.coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {!course.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,10%)] to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {course.moderationStatus === 'pending' ? (
            <Badge className="bg-yellow-500/90 text-white border-0 backdrop-blur-sm">
              <Clock className="w-3 h-3 mr-1" />
              На модерации
            </Badge>
          ) : course.isPublished ? (
            <Badge className="bg-emerald-500/90 text-white border-0 backdrop-blur-sm">
              <Globe className="w-3 h-3 mr-1" />
              Опубликован
            </Badge>
          ) : (
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
              <FileEdit className="w-3 h-3 mr-1" />
              Черновик
            </Badge>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setCourseToDelete(course);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Menu */}
        <div className="absolute bottom-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[hsl(0,0%,12%)] border-white/10">
              <DropdownMenuItem 
                onClick={() => navigate(`/editor/${course.id}`)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/course/${course.id}/settings`)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/course/${course.id}/stats`)}
                className="text-white/80 focus:text-white focus:bg-white/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Статистика
              </DropdownMenuItem>
              {course.isPublished && (
                <DropdownMenuItem 
                  onClick={() => window.open(`/course/${course.id}`, '_blank')}
                  className="text-white/80 focus:text-white focus:bg-white/10"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Открыть курс
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => setCourseToDelete(course)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4" onClick={() => navigate(`/editor/${course.id}`)}>
        <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-white/50 line-clamp-2 mb-3">
          {course.description || 'Без описания'}
        </p>

        <div className="flex items-center gap-4 text-sm text-white/40">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{course.lessons.length} уроков</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{course.estimatedMinutes || 0} мин</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/30">
          Изменён {formatDate(course.updatedAt)}
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="card-glow">
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {activeTab === 'drafts' ? 'Нет черновиков' : 
           activeTab === 'published' ? 'Нет опубликованных курсов' :
           'Создайте первый курс'}
        </h3>
        <p className="text-white/50 text-center max-w-md mb-6">
          {activeTab === 'drafts' ? 'Все ваши курсы опубликованы!' :
           activeTab === 'published' ? 'Опубликуйте курс, чтобы он стал доступен ученикам' :
           'Используйте ИИ-ассистента для быстрого создания интерактивных курсов'}
        </p>
        {activeTab !== 'published' && (
          <Button onClick={handleCreateCourse} disabled={isCreating} size="lg" className="bg-primary hover:bg-primary/90">
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Создать курс
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] -m-6 p-6">
      {/* Hero Section */}
      <div className="relative mb-8">
        <div className="hero-gradient absolute inset-0 -top-6 h-[200px] pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white">Мастерская авторов</h1>
            </div>

            <Button onClick={handleCreateCourse} disabled={isCreating} size="lg" className="bg-primary hover:bg-primary/90">
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Новый курс
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/60">
                  Все
                  <Badge variant="secondary" className="ml-1 bg-white/10 text-white/60">{courses.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/60">
                  Черновики
                  <Badge variant="secondary" className="ml-1 bg-white/10 text-white/60">{draftsCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="published" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/60">
                  Опубликованные
                  <Badge variant="secondary" className="ml-1 bg-white/10 text-white/60">{publishedCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent className="bg-[hsl(0,0%,10%)] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить курс?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Курс «{courseToDelete?.title}» и все его уроки будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

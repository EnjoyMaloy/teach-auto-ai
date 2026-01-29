import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden bg-card">
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {course.moderationStatus === 'pending' ? (
            <Badge className="bg-yellow-500/90 text-white border-0">
              <Clock className="w-3 h-3 mr-1" />
              На модерации
            </Badge>
          ) : course.isPublished ? (
            <Badge className="bg-emerald-500/90 text-white border-0">
              <Globe className="w-3 h-3 mr-1" />
              Опубликован
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-white/90 text-foreground border-0">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/editor/${course.id}`)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/course/${course.id}/settings`)}>
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/course/${course.id}/stats`)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Статистика
              </DropdownMenuItem>
              {course.isPublished && (
                <DropdownMenuItem onClick={() => window.open(`/course/${course.id}`, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Открыть курс
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setCourseToDelete(course)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader className="pb-2" onClick={() => navigate(`/editor/${course.id}`)}>
        <CardTitle className="text-base font-semibold line-clamp-1">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {course.description || 'Без описания'}
        </CardDescription>
      </CardHeader>

      <CardContent onClick={() => navigate(`/editor/${course.id}`)}>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{course.lessons.length} уроков</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{course.estimatedMinutes || 0} мин</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          Изменён {formatDate(course.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {activeTab === 'drafts' ? 'Нет черновиков' : 
           activeTab === 'published' ? 'Нет опубликованных курсов' :
           'Создайте первый курс'}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {activeTab === 'drafts' ? 'Все ваши курсы опубликованы!' :
           activeTab === 'published' ? 'Опубликуйте курс, чтобы он стал доступен ученикам' :
           'Используйте ИИ-ассистента для быстрого создания интерактивных курсов'}
        </p>
        {activeTab !== 'published' && (
          <Button onClick={handleCreateCourse} disabled={isCreating} size="lg">
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Создать курс
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Мастерская авторов</h1>
          </div>

          <Button onClick={handleCreateCourse} disabled={isCreating} size="lg">
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Новый курс
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск курсов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="bg-card">
              <TabsTrigger value="all" className="gap-2">
                Все
                <Badge variant="secondary" className="ml-1 bg-muted">{courses.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="drafts" className="gap-2">
                Черновики
                <Badge variant="secondary" className="ml-1 bg-muted">{draftsCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="published" className="gap-2">
                Опубликованные
                <Badge variant="secondary" className="ml-1 bg-muted">{publishedCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить курс?</AlertDialogTitle>
            <AlertDialogDescription>
              Курс «{courseToDelete?.title}» и все его уроки будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Dashboard;

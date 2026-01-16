import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  FileText, 
  Trash2, 
  LogOut,
  Loader2,
  Sparkles,
  Settings,
  BarChart3,
  Eye,
  Edit3,
  MoreHorizontal,
  Globe,
  FileEdit
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
  const { user, signOut } = useAuth();
  const { courses, isLoading, fetchCourses, createCourse, deleteCourse } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'published'>('all');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = courses.filter(course => {
    if (activeTab === 'drafts') return !course.isPublished;
    if (activeTab === 'published') return course.isPublished;
    return true;
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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Вы вышли из аккаунта');
    navigate('/auth');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 overflow-hidden"
    >
      {/* Banner */}
      <div 
        className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative"
        style={course.coverImage ? { 
          backgroundImage: `url(${course.coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute top-2 right-2 flex gap-1">
          {course.isPublished ? (
            <Badge className="bg-success/90 text-white">
              <Globe className="w-3 h-3 mr-1" />
              Опубликован
            </Badge>
          ) : (
            <Badge variant="secondary">
              <FileEdit className="w-3 h-3 mr-1" />
              Черновик
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => navigate(`/editor/${course.id}`)}>
            <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {course.description || 'Без описания'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
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
      </CardHeader>
      <CardContent onClick={() => navigate(`/editor/${course.id}`)}>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {course.lessons.length} {course.lessons.length === 1 ? 'урок' : 'уроков'}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {course.estimatedMinutes || 0} мин
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          Изменён {formatDate(course.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="border-dashed">
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
          <Button onClick={handleCreateCourse} disabled={isCreating}>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">LearnForge AI</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Выход
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Библиотека курсов</h2>
            <p className="text-muted-foreground mt-1">
              {courses.length > 0 
                ? `${courses.length} ${courses.length === 1 ? 'курс' : courses.length < 5 ? 'курса' : 'курсов'}`
                : 'У вас пока нет курсов'
              }
            </p>
          </div>

          <Button onClick={handleCreateCourse} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Новый курс
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Все курсы
              <Badge variant="secondary" className="ml-1">{courses.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              Черновики
              <Badge variant="secondary" className="ml-1">{draftsCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              Опубликованные
              <Badge variant="secondary" className="ml-1">{publishedCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>

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
    </div>
  );
};

export default Dashboard;

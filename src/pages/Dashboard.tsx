import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
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
  Search,
  Layers
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
import { cn } from '@/lib/utils';

type TabType = 'all' | 'drafts' | 'published';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, fetchCourses, createCourse, deleteCourse } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
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
    }).format(date);
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: courses.length },
    { id: 'drafts', label: 'Черновики', count: draftsCount },
    { id: 'published', label: 'Опубликованные', count: publishedCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Мои курсы</h1>
            <p className="text-sm text-white/40">Создавай и управляй курсами</p>
          </div>
        </div>

        <Button 
          onClick={handleCreateCourse} 
          disabled={isCreating}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Новый курс
        </Button>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
          />
        </div>

        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "bg-primary text-white" 
                  : "text-white/50 hover:text-white/70"
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState 
          activeTab={activeTab}
          onCreateCourse={handleCreateCourse}
          isCreating={isCreating}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map(course => (
            <CourseCard 
              key={course.id}
              course={course}
              onDelete={() => setCourseToDelete(course)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent className="bg-[hsl(0,0%,12%)] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить курс?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Курс «{courseToDelete?.title}» и все его уроки будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Course Card Component
interface CourseCardProps {
  course: Course & { moderationStatus?: string };
  onDelete: () => void;
  formatDate: (date: Date) => string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onDelete, formatDate }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    if (course.moderationStatus === 'pending') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
          <Clock className="w-3 h-3" />
          На модерации
        </span>
      );
    }
    if (course.isPublished) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
          <Globe className="w-3 h-3" />
          Опубликован
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs">
        <FileEdit className="w-3 h-3" />
        Черновик
      </span>
    );
  };

  return (
    <div className="group bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
      {/* Cover */}
      <div 
        className="h-32 relative cursor-pointer"
        onClick={() => navigate(`/editor/${course.id}`)}
      >
        {course.coverImage ? (
          <img 
            src={course.coverImage} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Status */}
        <div className="absolute top-2 left-2">
          {getStatusBadge()}
        </div>

        {/* Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[hsl(0,0%,12%)] border-white/10">
              <DropdownMenuItem 
                onClick={() => navigate(`/editor/${course.id}`)}
                className="text-white/70 focus:text-white focus:bg-white/10"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/course/${course.id}/settings`)}
                className="text-white/70 focus:text-white focus:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/course/${course.id}/stats`)}
                className="text-white/70 focus:text-white focus:bg-white/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Статистика
              </DropdownMenuItem>
              {course.isPublished && (
                <DropdownMenuItem 
                  onClick={() => window.open(`/course/${course.id}`, '_blank')}
                  className="text-white/70 focus:text-white focus:bg-white/10"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Открыть
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div 
        className="p-3 cursor-pointer"
        onClick={() => navigate(`/editor/${course.id}`)}
      >
        <h3 className="font-medium text-white text-sm line-clamp-1 mb-1">
          {course.title}
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {course.lessons.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.estimatedMinutes || 0} мин
          </span>
          <span className="ml-auto">
            {formatDate(course.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  activeTab: TabType;
  onCreateCourse: () => void;
  isCreating: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeTab, onCreateCourse, isCreating }) => {
  const getMessage = () => {
    switch (activeTab) {
      case 'drafts':
        return { title: 'Нет черновиков', desc: 'Все курсы опубликованы' };
      case 'published':
        return { title: 'Нет опубликованных', desc: 'Опубликуйте курс для учеников' };
      default:
        return { title: 'Создайте первый курс', desc: 'Начните с нажатия кнопки ниже' };
    }
  };

  const { title, desc } = getMessage();

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-white/40 text-sm mb-5">{desc}</p>
      
      {activeTab !== 'published' && (
        <Button onClick={onCreateCourse} disabled={isCreating} className="bg-primary hover:bg-primary/90">
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Создать курс
        </Button>
      )}
    </div>
  );
};

export default Dashboard;

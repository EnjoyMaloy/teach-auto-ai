import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  BookOpen,
  Layers,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getCategoryById } from '@/lib/categories';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingCourse {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  category: string | null;
  estimated_minutes: number;
  submitted_for_moderation_at: string;
  author_id: string;
  author_email?: string;
  author_name?: string;
  lessons_count: number;
}

const Moderation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
        toast.error('Нет доступа к модерации');
        navigate('/');
        return;
      }

      setUserRole(profile.role);
      await loadPendingCourses();
    };

    checkAccess();
  }, [user, navigate]);

  const loadPendingCourses = async () => {
    setIsLoading(true);
    try {
      // Fetch pending courses
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('id, title, description, cover_image, category, estimated_minutes, submitted_for_moderation_at, author_id')
        .eq('moderation_status', 'pending')
        .order('submitted_for_moderation_at', { ascending: true });

      if (error) throw error;

      // Get author info and lessons count
      const coursesWithDetails = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', course.author_id)
            .single();

          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            author_email: profile?.email,
            author_name: profile?.name,
            lessons_count: count || 0,
          };
        })
      );

      setCourses(coursesWithDetails);
    } catch (error) {
      console.error('Error loading pending courses:', error);
      toast.error('Ошибка загрузки курсов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (course: PendingCourse) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          moderation_status: 'approved',
          is_published: true,
          published_at: new Date().toISOString(),
          moderation_comment: null,
        })
        .eq('id', course.id);

      if (error) throw error;

      toast.success('Курс опубликован в каталог');
      setCourses(prev => prev.filter(c => c.id !== course.id));
    } catch (error) {
      console.error('Error approving course:', error);
      toast.error('Ошибка при одобрении курса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCourse || !rejectComment.trim()) {
      toast.error('Укажите комментарий для автора');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          moderation_status: 'rejected',
          moderation_comment: rejectComment,
        })
        .eq('id', selectedCourse.id);

      if (error) throw error;

      toast.success('Комментарий отправлен автору');
      setCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
      setShowRejectDialog(false);
      setSelectedCourse(null);
      setRejectComment('');
    } catch (error) {
      console.error('Error rejecting course:', error);
      toast.error('Ошибка при отклонении курса');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (course: PendingCourse) => {
    setSelectedCourse(course);
    setRejectComment('');
    setShowRejectDialog(true);
  };

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Модерация курсов</h1>
        <p className="text-muted-foreground mt-1">
          Курсы, ожидающие проверки для публикации в каталог
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Нет курсов на модерации
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Все курсы проверены. Новые заявки появятся здесь.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map(course => {
            const category = getCategoryById(course.category || '');
            return (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex">
                  {/* Cover Image */}
                  <div className="w-48 h-36 flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/30">
                    {course.cover_image ? (
                      <img 
                        src={course.cover_image} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          {category && (
                            <Badge 
                              variant="secondary"
                              style={{ backgroundColor: category.color }}
                              className="text-gray-800"
                            >
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {course.description || 'Без описания'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            {course.lessons_count} уроков
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {course.estimated_minutes || 0} мин
                          </span>
                          <span>
                            Автор: {course.author_name || course.author_email}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/course/${course.id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Просмотр
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectDialog(course)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Комментарий
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(course)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Одобрить
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить комментарий автору</DialogTitle>
            <DialogDescription>
              Укажите, что нужно исправить в курсе «{selectedCourse?.title}»
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Опишите, что нужно доработать..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isProcessing || !rejectComment.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Moderation;
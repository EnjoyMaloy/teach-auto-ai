import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Loader2, 
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Sparkles,
  Settings,
  Edit3,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Course } from '@/types/course';

interface SlideStats {
  slideId: string;
  lessonId: string;
  slideTitle: string;
  lessonTitle: string;
  views: number;
  completions: number;
  dropOffs: number;
  retentionRate: number;
  avgTimeSpent: number;
  correctRate?: number;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  aiRecommendation?: string;
  createdAt: Date;
}

interface AnalyticsSummary {
  totalViews: number;
  uniqueUsers: number;
  completionRate: number;
  avgTimeSpent: number;
  avgRating: number;
  totalReviews: number;
}

const CourseStats: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse } = useCourses();

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [slideStats, setSlideStats] = useState<SlideStats[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalViews: 0,
    uniqueUsers: 0,
    completionRate: 0,
    avgTimeSpent: 0,
    avgRating: 0,
    totalReviews: 0,
  });
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !user) return;
      
      setIsLoading(true);
      
      // Load course
      const loadedCourse = await fetchCourse(courseId);
      if (!loadedCourse) {
        toast.error('Курс не найден');
        navigate('/');
        return;
      }
      setCourse(loadedCourse);

      // Load analytics
      const { data: analyticsData } = await supabase
        .from('course_analytics')
        .select('*')
        .eq('course_id', courseId);

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      // Process analytics data
      if (analyticsData && analyticsData.length > 0) {
        const uniqueUsers = new Set(analyticsData.map(a => a.user_id)).size;
        const views = analyticsData.filter(a => a.event_type === 'view').length;
        const completions = analyticsData.filter(a => a.event_type === 'complete').length;
        const totalTime = analyticsData.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

        setSummary({
          totalViews: views,
          uniqueUsers,
          completionRate: views > 0 ? Math.round((completions / views) * 100) : 0,
          avgTimeSpent: uniqueUsers > 0 ? Math.round(totalTime / uniqueUsers / 60) : 0,
          avgRating: reviewsData?.length ? 
            reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length : 0,
          totalReviews: reviewsData?.length || 0,
        });

        // Calculate per-slide stats
        const slideStatsMap = new Map<string, SlideStats>();
        
        loadedCourse.lessons.forEach(lesson => {
          lesson.slides.forEach(slide => {
            const slideAnalytics = analyticsData.filter(a => a.slide_id === slide.id);
            const slideViews = slideAnalytics.filter(a => a.event_type === 'view').length;
            const slideCompletions = slideAnalytics.filter(a => a.event_type === 'complete').length;
            const slideDropOffs = slideAnalytics.filter(a => a.event_type === 'drop_off').length;
            const correctAnswers = slideAnalytics.filter(a => a.event_type === 'answer_correct').length;
            const incorrectAnswers = slideAnalytics.filter(a => a.event_type === 'answer_incorrect').length;
            const totalAnswers = correctAnswers + incorrectAnswers;

            slideStatsMap.set(slide.id, {
              slideId: slide.id,
              lessonId: lesson.id,
              slideTitle: slide.content.slice(0, 50) + (slide.content.length > 50 ? '...' : ''),
              lessonTitle: lesson.title,
              views: slideViews,
              completions: slideCompletions,
              dropOffs: slideDropOffs,
              retentionRate: slideViews > 0 ? Math.round((slideCompletions / slideViews) * 100) : 100,
              avgTimeSpent: slideAnalytics.length > 0 ? 
                Math.round(slideAnalytics.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / slideAnalytics.length) : 0,
              correctRate: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : undefined,
            });
          });
        });

        setSlideStats(Array.from(slideStatsMap.values()));
      }

      // Process reviews
      if (reviewsData) {
        setReviews(reviewsData.map(r => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name || 'Аноним',
          rating: r.rating,
          comment: r.comment || '',
          aiRecommendation: r.ai_recommendation || undefined,
          createdAt: new Date(r.created_at),
        })));
      }

      setIsLoading(false);
    };

    loadData();
  }, [courseId, user, fetchCourse, navigate]);

  const generateAIRecommendations = async () => {
    if (!course) return;
    
    setIsGeneratingAI(true);
    
    try {
      const context = {
        courseName: course.title,
        slideStats: slideStats.map(s => ({
          title: s.slideTitle,
          retentionRate: s.retentionRate,
          correctRate: s.correctRate,
        })),
        reviews: reviews.map(r => ({
          rating: r.rating,
          comment: r.comment,
        })),
        summary,
      };

      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          userMessage: `Проанализируй статистику курса и дай 3-5 конкретных рекомендаций по улучшению:
          
Курс: ${context.courseName}
Общая статистика:
- Просмотров: ${context.summary.totalViews}
- Уникальных пользователей: ${context.summary.uniqueUsers}
- Процент завершения: ${context.summary.completionRate}%
- Средний рейтинг: ${context.summary.avgRating.toFixed(1)}

Слайды с низким удержанием (< 70%):
${context.slideStats.filter(s => s.retentionRate < 70).map(s => `- "${s.title}": ${s.retentionRate}%`).join('\n') || 'Нет'}

Последние отзывы:
${context.reviews.slice(0, 5).map(r => `- ${r.rating}/5: "${r.comment}"`).join('\n') || 'Нет отзывов'}

Ответь кратко, список рекомендаций в формате JSON массива строк.`,
          mode: 'chat',
          agentRole: 'reviewer',
        },
      });

      if (error) throw error;

      // Parse AI response
      const content = data.content;
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          setAiRecommendations(recommendations);
        } else {
          // Fallback: split by newlines
          setAiRecommendations(content.split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.replace(/^-\s*/, '')));
        }
      } catch {
        setAiRecommendations([content]);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast.error('Ошибка генерации рекомендаций');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateReviewRecommendation = async (review: Review) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          userMessage: `Пользователь оставил отзыв о курсе:
Рейтинг: ${review.rating}/5
Комментарий: "${review.comment}"

Дай одну краткую конкретную рекомендацию как улучшить курс на основе этого отзыва. Ответ в одном предложении.`,
          mode: 'chat',
          agentRole: 'reviewer',
        },
      });

      if (error) throw error;

      // Update review with AI recommendation
      await supabase
        .from('course_reviews')
        .update({ ai_recommendation: data.content })
        .eq('id', review.id);

      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, aiRecommendation: data.content } : r
      ));

      toast.success('Рекомендация сгенерирована');
    } catch (error) {
      console.error('Error generating review recommendation:', error);
      toast.error('Ошибка генерации рекомендации');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getRetentionIcon = (rate: number) => {
    if (rate >= 80) return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (rate >= 50) return <AlertCircle className="w-4 h-4 text-warning" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{course?.title}</h1>
              <p className="text-sm text-muted-foreground">Статистика курса</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/editor/${courseId}`)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Редактор
            </Button>
            <Button variant="outline" onClick={() => navigate(`/course/${courseId}/settings`)}>
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Пользователи</span>
              </div>
              <p className="text-2xl font-bold">{summary.uniqueUsers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Просмотры</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalViews}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Завершение</span>
              </div>
              <p className="text-2xl font-bold">{summary.completionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Ср. время</span>
              </div>
              <p className="text-2xl font-bold">{summary.avgTimeSpent} мин</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="w-4 h-4" />
                <span className="text-sm">Рейтинг</span>
              </div>
              <p className="text-2xl font-bold">{summary.avgRating.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Отзывы</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalReviews}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slide Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Удержание по слайдам
              </CardTitle>
              <CardDescription>
                Процент пользователей, которые прошли каждый слайд
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {slideStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Пока нет данных. Статистика появится после прохождения курса пользователями.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slideStats.map((stat, index) => (
                      <div key={stat.slideId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getRetentionIcon(stat.retentionRate)}
                            <span className="text-sm truncate">
                              {index + 1}. {stat.slideTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-sm font-medium ${getRetentionColor(stat.retentionRate)}`}>
                              {stat.retentionRate}%
                            </span>
                            {stat.correctRate !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                {stat.correctRate}% верно
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={stat.retentionRate} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {stat.lessonTitle} • {stat.views} просм. • {stat.avgTimeSpent}с среднее
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Рекомендации
                  </CardTitle>
                  <CardDescription>
                    Автоматический анализ и советы по улучшению
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateAIRecommendations}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Нажмите кнопку для генерации рекомендаций на основе статистики
                  </p>
                  <Button onClick={generateAIRecommendations} disabled={isGeneratingAI}>
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Анализ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Сгенерировать
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {aiRecommendations.map((rec, index) => (
                    <li key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Отзывы учеников
            </CardTitle>
            <CardDescription>
              Отзывы с рекомендациями AI по улучшению курса
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Пока нет отзывов. Они появятся после прохождения курса учениками.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{review.userName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat('ru-RU').format(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-sm mb-3">{review.comment}</p>
                    )}

                    {review.aiRecommendation ? (
                      <div className="bg-ai/5 border border-ai/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-ai" />
                          <span className="text-xs font-medium text-ai">AI Рекомендация</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.aiRecommendation}</p>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => generateReviewRecommendation(review)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Сгенерировать рекомендацию
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CourseStats;

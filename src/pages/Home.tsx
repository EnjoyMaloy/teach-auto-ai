import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Layers, Sparkles, ArrowRight, Plus, Send } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';

const CourseCard: React.FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
  <Card 
    className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group flex-shrink-0 w-[260px] border-border/50"
    onClick={onClick}
  >
    <div className="h-28 bg-gradient-to-br from-primary/20 to-accent/30 relative overflow-hidden">
      {course.coverImage ? (
        <img 
          src={course.coverImage} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary/40" />
        </div>
      )}
    </div>
    <CardContent className="pt-3 pb-3">
      <h3 className="font-medium text-foreground mb-1 line-clamp-1 text-sm">
        {course.title}
      </h3>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>{course.lessons.length} уроков</span>
        </div>
        {course.estimatedMinutes > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{course.estimatedMinutes} мин</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchPublishedCourses, isLoading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'my' | 'templates'>('recent');

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Автор';

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  // Get recent courses
  const recentCourses = [...courses]
    .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))
    .slice(0, 8);

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col">
      {/* Hero Section with Gradient */}
      <div className="flex-1 flex flex-col items-center justify-center relative -mx-6 -mt-6 px-6 py-16 overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 80%, hsl(var(--primary) / 0.25), transparent 60%),
              radial-gradient(ellipse 60% 50% at 30% 70%, hsl(330 70% 55% / 0.2), transparent 50%),
              radial-gradient(ellipse 50% 40% at 70% 75%, hsl(260 70% 60% / 0.15), transparent 45%),
              linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)
            `
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* New Badge */}
          <div className="mb-6">
            <Badge 
              variant="secondary" 
              className="px-3 py-1.5 bg-primary/10 text-primary border-0 font-medium cursor-pointer hover:bg-primary/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Open Academy — платформа микрообучения
            </Badge>
          </div>

          {/* Welcome Text */}
          <h1 
            className="text-4xl md:text-5xl font-semibold mb-8 text-foreground"
            style={{ fontFamily: "'TT Commons', sans-serif" }}
          >
            Создайте курс, <span className="text-primary">{userName}</span>
          </h1>

          {/* Action Card */}
          <div 
            className="w-full max-w-xl bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-2 shadow-lg cursor-pointer hover:shadow-xl transition-all group"
            onClick={() => navigate('/workshop')}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground transition-colors">
                Опишите идею курса...
              </span>
              <Button size="sm" className="rounded-full w-9 h-9 p-0 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-4 mt-6 text-sm">
            <button 
              onClick={() => navigate('/catalog')}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Исследовать каталог
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-border">•</span>
            <button 
              onClick={() => navigate('/dictionary')}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Словарь терминов
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section - Course Collections */}
      <div className="border-t border-border/50 -mx-6 px-6 py-6 bg-card/30">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
            {[
              { id: 'recent' as const, label: 'Недавние' },
              { id: 'my' as const, label: 'Мои курсы' },
              { id: 'templates' as const, label: 'Шаблоны' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Смотреть все
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="w-[260px] flex-shrink-0 animate-pulse border-border/50">
                <div className="h-28 bg-muted/50 rounded-t-lg" />
                <CardContent className="pt-3 pb-3">
                  <div className="h-4 bg-muted/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentCourses.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
            {recentCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onClick={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Курсов пока нет. Создайте первый!</p>
          </div>
        )}

        {/* Tags */}
        {courses.some(c => c.tags && c.tags.length > 0) && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(courses.flatMap(c => c.tags || []))).filter(Boolean).slice(0, 10).map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                  onClick={() => navigate(`/catalog?tag=${encodeURIComponent(tag)}`)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

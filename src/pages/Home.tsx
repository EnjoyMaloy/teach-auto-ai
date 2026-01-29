import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Layers, TrendingUp, Sparkles, Zap, Target, ArrowRight } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';

// Predefined course categories/collections
const COURSE_COLLECTIONS = [
  { id: 'new', title: 'Новинки', icon: Sparkles, description: 'Недавно опубликованные курсы' },
  { id: 'popular', title: 'Популярное', icon: TrendingUp, description: 'Самые востребованные курсы' },
  { id: 'quick', title: 'Быстрый старт', icon: Zap, description: 'Курсы до 30 минут' },
  { id: 'deep', title: 'Глубокое погружение', icon: Target, description: 'Подробные курсы для экспертов' },
];

const CourseCard: React.FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
  <Card 
    className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group flex-shrink-0 w-[280px]"
    onClick={onClick}
  >
    <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/30 relative overflow-hidden">
      {course.coverImage ? (
        <img 
          src={course.coverImage} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary/40" />
        </div>
      )}
    </div>
    <CardContent className="pt-3 pb-4">
      <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-sm">
        {course.title}
      </h3>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {course.description || 'Описание отсутствует'}
      </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>{course.lessons.length}</span>
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

const CourseCollection: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  courses: Course[];
  onCourseClick: (id: string) => void;
  onViewAll: () => void;
}> = ({ title, description, icon: Icon, courses, onCourseClick, onViewAll }) => {
  if (courses.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <button 
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Все курсы
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {courses.map(course => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onClick={() => onCourseClick(course.id)}
          />
        ))}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPublishedCourses, isLoading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  // Categorize courses
  const newCourses = [...courses]
    .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))
    .slice(0, 6);

  const quickCourses = courses
    .filter(c => c.estimatedMinutes > 0 && c.estimatedMinutes <= 30)
    .slice(0, 6);

  const deepCourses = courses
    .filter(c => c.estimatedMinutes > 60)
    .slice(0, 6);

  // For popular, we'd need analytics, so we'll just show random ones for now
  const popularCourses = [...courses]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  const hasCourses = courses.length > 0;

  return (
    <>
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="flex gap-4">
                {[1, 2, 3].map(j => (
                  <Card key={j} className="w-[280px] flex-shrink-0 animate-pulse">
                    <div className="h-32 bg-muted rounded-t-lg" />
                    <CardContent className="pt-3">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !hasCourses ? (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
          <CardContent className="py-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Каталог курсов пуст
                </h2>
                <p className="text-muted-foreground max-w-lg">
                  Пока нет опубликованных курсов. Создайте свой первый курс в мастерской авторов
                  и опубликуйте его, чтобы он появился здесь.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* New Courses */}
          <CourseCollection
            title="Новинки"
            description="Недавно опубликованные курсы"
            icon={Sparkles}
            courses={newCourses}
            onCourseClick={(id) => navigate(`/course/${id}`)}
            onViewAll={() => navigate('/catalog')}
          />

          {/* Popular Courses */}
          {popularCourses.length > 0 && (
            <CourseCollection
              title="Популярное"
              description="Самые востребованные курсы"
              icon={TrendingUp}
              courses={popularCourses}
              onCourseClick={(id) => navigate(`/course/${id}`)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* Quick Start Courses */}
          {quickCourses.length > 0 && (
            <CourseCollection
              title="Быстрый старт"
              description="Курсы до 30 минут"
              icon={Zap}
              courses={quickCourses}
              onCourseClick={(id) => navigate(`/course/${id}`)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* Deep Dive Courses */}
          {deepCourses.length > 0 && (
            <CourseCollection
              title="Глубокое погружение"
              description="Подробные курсы для экспертов"
              icon={Target}
              courses={deepCourses}
              onCourseClick={(id) => navigate(`/course/${id}`)}
              onViewAll={() => navigate('/catalog')}
            />
          )}

          {/* Tags Cloud */}
          {courses.some(c => c.tags && c.tags.length > 0) && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Темы курсов</h2>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(courses.flatMap(c => c.tags || []))).filter(Boolean).map(tag => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => navigate(`/catalog?tag=${encodeURIComponent(tag)}`)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Home;
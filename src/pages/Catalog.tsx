import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Layers, Search } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types/course';

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { fetchPublishedCourses, isLoading } = useCourses();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      const data = await fetchPublishedCourses();
      setCourses(data);
    };
    loadCourses();
  }, [fetchPublishedCourses]);

  // Get all unique tags
  const allTags = Array.from(
    new Set(courses.flatMap(c => c.tags || []))
  ).filter(Boolean);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || course.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Каталог курсов</h1>
        <p className="text-muted-foreground mt-1">
          Все опубликованные курсы на платформе
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              Все
            </Badge>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardContent className="pt-4">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || selectedTag ? 'Курсы не найдены' : 'Пока нет опубликованных курсов'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || selectedTag 
                ? 'Попробуйте изменить параметры поиска' 
                : 'Здесь появятся опубликованные курсы от всех авторов платформы'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card 
              key={course.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/30 relative overflow-hidden">
                {course.coverImage ? (
                  <img 
                    src={course.coverImage} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary/40" />
                  </div>
                )}
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description || 'Описание отсутствует'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>{course.lessons.length} уроков</span>
                  </div>
                  {course.estimatedMinutes > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.estimatedMinutes} мин</span>
                    </div>
                  )}
                </div>
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {course.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{course.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Catalog;
import React from 'react';
import { GripVertical, Plus, BookOpen, MoreHorizontal, Trash2, Copy } from 'lucide-react';
import { Lesson } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LessonsListProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onAddLesson: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void;
}

export const LessonsList: React.FC<LessonsListProps> = ({
  lessons,
  selectedLessonId,
  onSelectLesson,
  onAddLesson,
  onDeleteLesson,
  onDuplicateLesson,
}) => {
  return (
    <div className="h-full flex flex-col bg-card rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Уроки</h3>
          <Button variant="ghost" size="icon-sm" onClick={onAddLesson}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className={cn(
              'group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200',
              selectedLessonId === lesson.id
                ? 'bg-primary-light border-2 border-primary'
                : 'hover:bg-muted border-2 border-transparent'
            )}
            onClick={() => onSelectLesson(lesson.id)}
          >
            <div className="cursor-grab opacity-0 group-hover:opacity-50 transition-opacity">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{index + 1}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{lesson.title}</p>
              <p className="text-xs text-muted-foreground">
                {lesson.slides.length} слайдов • {lesson.estimatedMinutes} мин
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateLesson(lesson.id);
                }}
                className="p-1.5 rounded-lg hover:bg-muted-foreground/10 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLesson(lesson.id);
                }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}

        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Нет уроков</p>
            <Button variant="soft" size="sm" className="mt-3" onClick={onAddLesson}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить урок
            </Button>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lessons.length} уроков</span>
          <span>{lessons.reduce((acc, l) => acc + l.estimatedMinutes, 0)} мин</span>
        </div>
      </div>
    </div>
  );
};

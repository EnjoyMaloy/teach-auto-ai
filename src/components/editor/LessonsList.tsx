import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, BookOpen, Circle, List } from 'lucide-react';
import { Lesson, LessonsDisplayType } from '@/types/course';
import { Button } from '@/components/ui/button';
import { SortableLessonItem } from './SortableLessonItem';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LessonsListProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onAddLesson: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void;
  onReorderLessons: (activeId: string, overId: string) => void;
  displayType?: LessonsDisplayType;
  onDisplayTypeChange?: (type: LessonsDisplayType) => void;
  onUpdateLessonIcon?: (lessonId: string, icon: string) => void;
}

export const LessonsList: React.FC<LessonsListProps> = ({
  lessons,
  selectedLessonId,
  onSelectLesson,
  onAddLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onReorderLessons,
  displayType = 'circle_map',
  onDisplayTypeChange,
  onUpdateLessonIcon,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderLessons(active.id as string, over.id as string);
    }
  };

  const totalMinutes = lessons.reduce((acc, l) => acc + l.estimatedMinutes, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-bold text-foreground">Уроки</h3>
          <p className="text-xs text-muted-foreground">{lessons.length} уроков • {totalMinutes} мин</p>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={onAddLesson}
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Добавить
        </Button>
      </div>

      {/* Display type toggle */}
      {onDisplayTypeChange && (
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Тип карты:</span>
          <TooltipProvider>
            <ToggleGroup 
              type="single" 
              value={displayType} 
              onValueChange={(v) => v && onDisplayTypeChange(v as LessonsDisplayType)}
              className="gap-1"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="circle_map" size="sm" className="h-8 w-8 p-0">
                    <Circle className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Кружки (Duolingo)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="list" size="sm" className="h-8 w-8 p-0">
                    <List className="w-4 h-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Список</p>
                </TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>
        </div>
      )}

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {lessons.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessons.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson, index) => (
                <SortableLessonItem
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  isSelected={selectedLessonId === lesson.id}
                  onSelect={() => onSelectLesson(lesson.id)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onDuplicate={() => onDuplicateLesson(lesson.id)}
                  onUpdateIcon={onUpdateLessonIcon ? (icon) => onUpdateLessonIcon(lesson.id, icon) : undefined}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
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
    </div>
  );
};

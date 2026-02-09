import React, { useState, useEffect } from 'react';
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
import { Plus, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lesson } from '@/types/course';
import { Block } from '@/types/blocks';
import { Button } from '@/components/ui/button';
import { LayerLessonItem } from './LayerLessonItem';
import { cn } from '@/lib/utils';

interface CourseLayerTreeProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  selectedBlockId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onSelectBlock: (blockId: string, lessonId: string) => void;
  onAddLesson: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onDuplicateLesson: (lessonId: string) => void;
  onReorderLessons: (activeId: string, overId: string) => void;
  onUpdateLessonTitle?: (lessonId: string, title: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onReorderBlocks: (lessonId: string, event: DragEndEvent) => void;
  onAddBlock: () => void;
  // Convert slides to blocks helper
  slideToBlock: (slide: any) => Block;
}

export const CourseLayerTree: React.FC<CourseLayerTreeProps> = ({
  lessons,
  selectedLessonId,
  selectedBlockId,
  onSelectLesson,
  onSelectBlock,
  onAddLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onReorderLessons,
  onUpdateLessonTitle,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlocks,
  onAddBlock,
  slideToBlock,
}) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-expand lesson when block is selected
  useEffect(() => {
    if (selectedLessonId && !expandedLessons.has(selectedLessonId)) {
      setExpandedLessons(prev => new Set([...prev, selectedLessonId]));
    }
  }, [selectedLessonId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderLessons(active.id as string, over.id as string);
    }
  };

  const toggleExpand = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const handleSelectBlock = (blockId: string, lessonId: string) => {
    onSelectBlock(blockId, lessonId);
  };

  // Calculate total duration
  const totalBlocks = lessons.reduce((sum, lesson) => sum + (lesson.slides?.length || 0), 0);
  const totalMinutes = Math.floor((totalBlocks * 30) / 60);

  if (isCollapsed) {
    return (
      <div className="w-12 flex flex-col border-r border-border bg-card/80 backdrop-blur-sm">
        <div className="flex-1 flex flex-col items-center py-4 gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(false)}
            className="mb-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground writing-mode-vertical">
            {lessons.length} уроков
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex flex-col border-r border-border bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(true)}
            className="hidden xl:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-bold text-foreground text-sm">Структура</h3>
            <p className="text-[10px] text-muted-foreground">{totalMinutes} мин • {lessons.length} уроков</p>
          </div>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={onAddLesson}
          className="rounded-lg h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Урок
        </Button>
      </div>

      {/* Lessons Tree */}
      <div className="flex-1 overflow-y-auto p-2">
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
              <div className="space-y-1">
                {lessons.map((lesson, index) => {
                  const blocks = lesson.slides?.map(slideToBlock) || [];
                  return (
                    <LayerLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      isExpanded={expandedLessons.has(lesson.id)}
                      selectedBlockId={selectedBlockId}
                      blocks={blocks}
                      onToggleExpand={() => toggleExpand(lesson.id)}
                      onSelectBlock={(blockId) => handleSelectBlock(blockId, lesson.id)}
                      onDeleteLesson={() => onDeleteLesson(lesson.id)}
                      onDuplicateLesson={() => onDuplicateLesson(lesson.id)}
                      onDeleteBlock={onDeleteBlock}
                      onDuplicateBlock={onDuplicateBlock}
                      onReorderBlocks={(event) => onReorderBlocks(lesson.id, event)}
                      onAddBlock={() => {
                        onSelectLesson(lesson.id);
                        onAddBlock();
                      }}
                      onUpdateTitle={onUpdateLessonTitle ? (title) => onUpdateLessonTitle(lesson.id, title) : undefined}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Нет уроков</p>
            <p className="text-xs text-muted-foreground mb-4">
              Добавьте первый урок курса
            </p>
            <Button variant="default" size="sm" onClick={onAddLesson} className="rounded-lg">
              <Plus className="w-4 h-4 mr-1" />
              Добавить урок
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

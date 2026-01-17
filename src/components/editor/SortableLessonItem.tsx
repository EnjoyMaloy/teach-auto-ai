import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Lesson } from '@/types/course';
import { cn } from '@/lib/utils';

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateIcon?: (icon: string) => void;
}

export const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-primary bg-primary-light shadow-sm'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-sm',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Lesson number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {lesson.slides.length} слайдов • {lesson.estimatedMinutes} мин
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 rounded-lg hover:bg-muted-foreground/10 transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
};

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
      className={cn(
        'group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-primary-light border-2 border-primary'
          : 'hover:bg-muted border-2 border-transparent',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
      onClick={onSelect}
    >
      <div
        className="cursor-grab opacity-50 hover:opacity-100 transition-opacity touch-none"
        {...attributes}
        {...listeners}
      >
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

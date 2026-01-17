import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Lesson } from '@/types/course';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Common lesson icons
const LESSON_ICONS = [
  '📚', '📖', '✏️', '💡', '🎯', '🔥', '⭐', '🚀',
  '💪', '🧠', '📝', '🎓', '📊', '🔬', '🎨', '🎵',
  '💻', '📱', '🌍', '🏆', '💎', '🔑', '⚡', '🌟',
];

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
  onUpdateIcon,
}) => {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  
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
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Icon */}
      <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdateIcon) {
                setIconPickerOpen(true);
              }
            }}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl",
              onUpdateIcon && "hover:bg-primary/20 transition-colors cursor-pointer"
            )}
          >
            {lesson.icon || '📚'}
          </button>
        </PopoverTrigger>
        {onUpdateIcon && (
          <PopoverContent 
            className="w-64 p-2" 
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-8 gap-1">
              {LESSON_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    onUpdateIcon(icon);
                    setIconPickerOpen(false);
                  }}
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center text-lg hover:bg-muted transition-colors",
                    lesson.icon === icon && "bg-primary/20"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

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

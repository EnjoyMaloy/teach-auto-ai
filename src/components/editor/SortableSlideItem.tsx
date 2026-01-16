import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Type, Image, CheckCircle2, ListChecks, ToggleLeft, PenLine, Layers } from 'lucide-react';
import { Slide, SlideType } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const slideTypeConfig: Record<SlideType, { icon: React.ElementType; label: string; color: string }> = {
  heading: { icon: Type, label: 'Заголовок', color: 'bg-slate-100 text-slate-600' },
  text: { icon: Type, label: 'Текст', color: 'bg-blue-100 text-blue-600' },
  image: { icon: Image, label: 'Картинка', color: 'bg-purple-100 text-purple-600' },
  video: { icon: Image, label: 'Видео', color: 'bg-red-100 text-red-600' },
  audio: { icon: Type, label: 'Аудио', color: 'bg-amber-100 text-amber-600' },
  image_text: { icon: Image, label: 'Картинка+Текст', color: 'bg-indigo-100 text-indigo-600' },
  design: { icon: Layers, label: 'Дизайн', color: 'bg-fuchsia-100 text-fuchsia-600' },
  single_choice: { icon: CheckCircle2, label: 'Один ответ', color: 'bg-green-100 text-green-600' },
  multiple_choice: { icon: ListChecks, label: 'Несколько', color: 'bg-orange-100 text-orange-600' },
  true_false: { icon: ToggleLeft, label: 'Да/Нет', color: 'bg-yellow-100 text-yellow-600' },
  fill_blank: { icon: PenLine, label: 'Заполни', color: 'bg-pink-100 text-pink-600' },
  matching: { icon: Type, label: 'Соответствие', color: 'bg-cyan-100 text-cyan-600' },
  ordering: { icon: Type, label: 'Порядок', color: 'bg-orange-100 text-orange-600' },
  slider: { icon: Type, label: 'Ползунок', color: 'bg-violet-100 text-violet-600' },
  hotspot: { icon: Image, label: 'Точки', color: 'bg-rose-100 text-rose-600' },
};

interface SortableSlideItemProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const SortableSlideItem: React.FC<SortableSlideItemProps> = ({
  slide,
  index,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = slideTypeConfig[slide.type];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group relative aspect-[4/3] rounded-xl border-2 cursor-pointer transition-all duration-200 p-3 flex flex-col',
        isSelected
          ? 'border-primary bg-primary-light shadow-primary'
          : 'border-border hover:border-primary/50 bg-background',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      {/* Drag handle */}
      <div
        className="absolute top-1 right-1 p-1 cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity touch-none z-10"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
          <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="14" cy="6" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="14" cy="10" r="1.5" />
            <circle cx="6" cy="14" r="1.5" />
            <circle cx="14" cy="14" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Slide number */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Type badge */}
      <div className={cn('self-start px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>

      {/* Content preview */}
      <div className="flex-1 mt-2 overflow-hidden">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {slide.content || 'Пустой слайд...'}
        </p>
      </div>

      {/* Actions on hover */}
      <div className="absolute inset-0 bg-foreground/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

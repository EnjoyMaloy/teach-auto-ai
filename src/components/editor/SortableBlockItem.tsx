import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2,
  GripVertical, Layers
} from 'lucide-react';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2, Layers
};

interface SortableBlockItemProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
  block,
  index,
  isSelected,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = BLOCK_CONFIGS[block.type];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];

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

      {/* Block number */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Icon */}
      <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', config.bgClass)}>
        {IconComponent && <IconComponent className={cn('w-5 h-5', config.colorClass)} />}
      </div>

      {/* Content preview */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{config.labelRu}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {block.type === 'design' 
            ? `${block.subBlocks?.length || 0} элементов`
            : block.content || 'Пустой блок...'}
        </p>
      </div>
    </div>
  );
};

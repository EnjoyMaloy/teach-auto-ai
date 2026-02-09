import React from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, Layers,
  GripVertical, Copy, Trash2
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, Layers
};

interface LayerBlockItemProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const LayerBlockItem: React.FC<LayerBlockItemProps> = ({
  block,
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
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = BLOCK_CONFIGS[block.type];
  if (!config) return null;

  const IconComponent = iconMap[config.icon as keyof typeof iconMap];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'group relative flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150',
        'ml-4 border',
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-transparent hover:bg-muted/50 hover:border-border',
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
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Block number */}
      <span className="flex-shrink-0 w-5 h-5 rounded text-[10px] font-medium flex items-center justify-center bg-muted text-muted-foreground">
        {index + 1}
      </span>

      {/* Icon */}
      <div className={cn('flex-shrink-0 w-6 h-6 rounded flex items-center justify-center', config.bgClass)}>
        {IconComponent && <IconComponent className={cn('w-3.5 h-3.5', config.colorClass)} />}
      </div>

      {/* Label */}
      <span className="flex-1 text-xs font-medium text-foreground truncate">
        {config.labelRu}
      </span>

      {/* Actions on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
};

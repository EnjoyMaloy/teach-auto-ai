import React from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2
} from 'lucide-react';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2
};

interface BlockPreviewProps {
  block: Block;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const BlockPreview: React.FC<BlockPreviewProps> = ({
  block,
  isSelected,
  onClick,
  compact = false,
}) => {
  const config = BLOCK_CONFIGS[block.type];
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
          'border-2',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-transparent hover:bg-muted'
        )}
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
          {IconComponent && <IconComponent className={cn('w-4 h-4', config.color)} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{config.labelRu}</p>
          <p className="text-xs text-muted-foreground truncate">
            {block.content || 'Пустой блок'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl overflow-hidden cursor-pointer transition-all',
        'border-2 aspect-[9/16] bg-background',
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Block type badge */}
      <div className={cn(
        'absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 z-10',
        config.bgColor, config.color
      )}>
        {IconComponent && <IconComponent className="w-3 h-3" />}
        {config.labelRu}
      </div>

      {/* Preview content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {block.imageUrl ? (
          <img 
            src={block.imageUrl} 
            alt="" 
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : block.videoUrl ? (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : block.audioUrl ? (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="text-center px-4">
            <div className={cn('w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center', config.bgColor)}>
              {IconComponent && <IconComponent className={cn('w-6 h-6', config.color)} />}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">
              {block.content || 'Нажмите для редактирования'}
            </p>
          </div>
        )}
      </div>

      {/* Options preview for quiz types */}
      {block.options && block.options.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 space-y-1">
          {block.options.slice(0, 3).map((option, idx) => (
            <div
              key={option.id}
              className={cn(
                'px-2 py-1 rounded-lg text-xs truncate',
                option.isCorrect
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {option.text}
            </div>
          ))}
          {block.options.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{block.options.length - 3} ещё
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { BlockType, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2
};

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const contentBlocks = Object.values(BLOCK_CONFIGS).filter(c => c.category === 'content');
  const interactiveBlocks = Object.values(BLOCK_CONFIGS).filter(c => c.category === 'interactive');

  const renderBlock = (config: typeof BLOCK_CONFIGS[BlockType]) => {
    const IconComponent = iconMap[config.icon as keyof typeof iconMap];
    
    return (
      <button
        key={config.type}
        onClick={() => onSelect(config.type)}
        className={cn(
          'flex flex-col items-center gap-2 p-4 rounded-xl',
          'border-2 border-transparent hover:border-primary/50',
          'bg-muted/50 hover:bg-muted transition-all',
          'text-center group'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
          config.bgColor
        )}>
          {IconComponent && <IconComponent className={cn('w-6 h-6', config.color)} />}
        </div>
        <div>
          <p className="text-sm font-medium">{config.labelRu}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {config.description}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">Добавить блок</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] space-y-6">
          {/* Content blocks */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Контент
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contentBlocks.map(renderBlock)}
            </div>
          </div>

          {/* Interactive blocks */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <CircleDot className="w-4 h-4" />
              Интерактивные
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {interactiveBlocks.map(renderBlock)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

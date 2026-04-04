import React from 'react';
import { BlockType, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2,
  X, Sparkles, FileText
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
          'flex flex-col items-center gap-3 p-4 rounded-2xl',
          'border-2 border-border hover:border-primary',
          'bg-card hover:bg-primary-light transition-all duration-200',
          'text-center group hover:shadow-md'
        )}
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200',
          'group-hover:scale-110',
          config.bgClass
        )}>
          {IconComponent && <IconComponent className={cn('w-6 h-6', config.colorClass)} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{config.labelRu}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {config.description}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up" 
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-border animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Добавить блок</h2>
              <p className="text-xs text-muted-foreground">Выберите тип контента</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)] space-y-8">
          {/* Content blocks */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              Контент
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contentBlocks.map(renderBlock)}
            </div>
          </div>

          {/* Interactive blocks */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-success" />
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

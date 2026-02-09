import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { ChevronRight, GripVertical, Copy, Trash2, Plus } from 'lucide-react';
import { Lesson } from '@/types/course';
import { Block } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LayerBlockItem } from './LayerBlockItem';
import { Button } from '@/components/ui/button';
import { pluralize } from '@/lib/pluralize';

interface LayerLessonItemProps {
  lesson: Lesson;
  index: number;
  isExpanded: boolean;
  selectedBlockId: string | null;
  blocks: Block[];
  onToggleExpand: () => void;
  onSelectBlock: (blockId: string) => void;
  onDeleteLesson: () => void;
  onDuplicateLesson: () => void;
  onDeleteBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onReorderBlocks: (event: DragEndEvent) => void;
  onAddBlock: () => void;
  onUpdateTitle?: (title: string) => void;
}

export const LayerLessonItem: React.FC<LayerLessonItemProps> = ({
  lesson,
  index,
  isExpanded,
  selectedBlockId,
  blocks,
  onToggleExpand,
  onSelectBlock,
  onDeleteLesson,
  onDuplicateLesson,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlocks,
  onAddBlock,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lesson.title);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setEditedTitle(lesson.title);
  }, [lesson.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateTitle) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onUpdateTitle && editedTitle.trim()) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(lesson.title);
      setIsEditing(false);
    }
  };

  const blocksCount = blocks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all duration-200',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        {/* Lesson header */}
        <div
          className={cn(
            'group flex items-center gap-2 py-2 px-2 rounded-xl cursor-pointer transition-all duration-150',
            'hover:bg-muted/50',
            isExpanded && 'bg-muted/30'
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

          {/* Expand chevron */}
          <CollapsibleTrigger asChild>
            <button className="flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors">
              <ChevronRight 
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )} 
              />
            </button>
          </CollapsibleTrigger>

          {/* Lesson number badge */}
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {index + 1}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0" onClick={onToggleExpand}>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm font-semibold text-foreground bg-transparent border-b-2 border-primary outline-none"
              />
            ) : (
              <div onDoubleClick={handleDoubleClick}>
                <p className="text-sm font-semibold text-foreground truncate">
                  {lesson.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {blocksCount} {pluralize(blocksCount, 'блок', 'блока', 'блоков')}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateLesson();
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLesson();
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>

        {/* Blocks list */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="py-1 space-y-0.5">
            {blocks.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onReorderBlocks}
              >
                <SortableContext
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block, blockIndex) => (
                    <LayerBlockItem
                      key={block.id}
                      block={block}
                      index={blockIndex}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => onSelectBlock(block.id)}
                      onDelete={() => onDeleteBlock(block.id)}
                      onDuplicate={() => onDuplicateBlock(block.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : null}

            {/* Add block button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddBlock();
              }}
              className="w-full justify-start ml-4 mr-4 text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
              style={{ width: 'calc(100% - 1rem)' }}
            >
              <Plus className="w-3 h-3" />
              Добавить блок
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

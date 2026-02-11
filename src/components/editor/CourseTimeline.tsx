import React, { useState, useEffect, useRef, memo } from 'react';
import { Plus, Play, Volume2, Heading, Type, Image, LayoutList, CircleDot, CheckSquare, ToggleLeft, PenLine, Link2, ListOrdered, SlidersHorizontal, Layers, GripVertical } from 'lucide-react';
import { Lesson, CourseDesignSystem } from '@/types/course';
import { Block, BLOCK_CONFIGS, BlockType } from '@/types/blocks';
import { DesignSystemConfig } from '@/types/designSystem';
import { cn } from '@/lib/utils';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, Layers
};

interface CourseTimelineProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  selectedBlockId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onSelectBlock: (blockId: string, lessonId: string) => void;
  onAddLesson: () => void;
  onAddBlock: (type: BlockType) => void;
  onReorderBlocks: (event: DragEndEvent) => void;
  slideToBlock: (slide: any) => Block;
  designSystem?: CourseDesignSystem | DesignSystemConfig;
}

// Scaled block thumbnail - renders real MobilePreviewFrame at full size, 
// then shrinks it with CSS transform for a pixel-perfect miniature
const THUMB_W = 72;
const THUMB_H = 128;
const FULL_W = 390;
const FULL_H = 760;
const SCALE = Math.min(THUMB_W / FULL_W, THUMB_H / FULL_H); // ~0.168

const ScaledBlockThumbnail = memo<{ 
  block: Block; 
  index: number; 
  designSystem?: CourseDesignSystem | DesignSystemConfig;
}>(({ block, index, designSystem }) => {
  const config = BLOCK_CONFIGS[block.type];
  const IconComponent = config?.icon ? iconMap[config.icon] : null;

  // For video blocks, skip heavy iframe rendering
  const isVideo = block.type === 'video';

  return (
    <div 
      className="relative bg-muted/50 rounded-md overflow-hidden"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {/* Badge overlay */}
      <div className="absolute top-1 left-1 right-1 z-10 flex items-center gap-1">
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background/90 shadow-sm">
          <span className="text-[9px] font-bold text-foreground">
            {index + 1}
          </span>
          {IconComponent && (
            <IconComponent className={cn('w-2.5 h-2.5', config?.colorClass)} />
          )}
        </div>
      </div>

      {isVideo ? (
        // Lightweight fallback for video blocks
        <div className="w-full h-full flex items-center justify-center bg-black/80">
          <Play className="w-5 h-5 text-white fill-white/50" />
        </div>
      ) : (
        // Scaled real preview
        <div 
          className="origin-top-left pointer-events-none"
          style={{ 
            width: FULL_W, 
            height: FULL_H, 
            transform: `scale(${SCALE})`,
          }}
        >
          <MobilePreviewFrame
            block={block}
            isReadOnly
            embedded
            fillContainer
            designSystem={designSystem}
            hideHeader
          />
        </div>
      )}
    </div>
  );
});

ScaledBlockThumbnail.displayName = 'ScaledBlockThumbnail';

// Sortable wrapper for block thumbnails
const SortableBlockThumb: React.FC<{
  block: Block;
  index: number;
  isSelected: boolean;
  lessonId: string;
  onSelect: (blockId: string, lessonId: string) => void;
  designSystem?: CourseDesignSystem | DesignSystemConfig;
}> = ({ block, index, isSelected, lessonId, onSelect, designSystem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'relative flex-shrink-0 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200',
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg scale-105'
          : 'hover:ring-2 hover:ring-primary/50 hover:scale-105'
      )}
      onClick={() => onSelect(block.id, lessonId)}
    >
      <div className="rounded-lg overflow-hidden">
        <ScaledBlockThumbnail block={block} index={index} designSystem={designSystem} />
      </div>
    </div>
  );
};


export const CourseTimeline: React.FC<CourseTimelineProps> = ({
  lessons,
  selectedLessonId,
  selectedBlockId,
  onSelectLesson,
  onSelectBlock,
  onAddLesson,
  onAddBlock,
  onReorderBlocks,
  slideToBlock,
  designSystem,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(selectedLessonId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedBlockRef = useRef<HTMLDivElement>(null);

  // Auto-expand selected lesson
  useEffect(() => {
    if (selectedLessonId && expandedLessonId !== selectedLessonId) {
      setExpandedLessonId(selectedLessonId);
    }
  }, [selectedLessonId]);

  // Scroll selected block into view
  useEffect(() => {
    if (selectedBlockRef.current && scrollRef.current) {
      selectedBlockRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedBlockId]);

  const handleLessonClick = (lessonId: string) => {
    if (expandedLessonId === lessonId) {
      onSelectLesson(lessonId);
    } else {
      setExpandedLessonId(lessonId);
      onSelectLesson(lessonId);
    }
  };

  return (
    <div className="h-[160px] border-t border-border/10 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Timeline content */}
      <div className="flex-1 flex items-center px-2 gap-2 overflow-hidden">
        {/* Lessons and blocks scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-2 h-full py-2 px-1">
            {lessons.map((lesson, lessonIndex) => {
              const blocks = lesson.slides?.map(slideToBlock) || [];
              const isExpanded = expandedLessonId === lesson.id;
              const isSelectedLesson = selectedLessonId === lesson.id;

              return (
                <div key={lesson.id} className="flex items-center gap-2 flex-shrink-0">
                  {/* Lesson indicator */}
                  <div
                    onClick={() => handleLessonClick(lesson.id)}
                    className={cn(
                      'relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200',
                      'text-sm font-bold',
                      isSelectedLesson
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105'
                    )}
                    title={lesson.title}
                  >
                    {lessonIndex + 1}
                    {/* Block count badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border border-border text-[10px] font-medium flex items-center justify-center text-foreground">
                      {blocks.length}
                    </span>
                  </div>

                  {/* Expanded blocks */}
                  {isExpanded && (
                    <div className="flex items-center gap-1.5 animate-in slide-in-from-left-5 duration-200">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                        onSelectLesson(lesson.id);
                        onReorderBlocks(e);
                      }}>
                        <SortableContext items={blocks.map(b => b.id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex items-center gap-1.5">
                            {blocks.map((block, blockIndex) => (
                              <SortableBlockThumb
                                key={block.id}
                                block={block}
                                index={blockIndex}
                                isSelected={selectedBlockId === block.id}
                                lessonId={lesson.id}
                                onSelect={onSelectBlock}
                                designSystem={designSystem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {/* Add block button with popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLesson(lesson.id);
                            }}
                            className={cn(
                              'flex-shrink-0 rounded-lg border-2 border-dashed border-border',
                              'flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary',
                              'transition-all duration-200 hover:bg-primary/5'
                            )}
                            style={{ width: THUMB_W, height: THUMB_H }}
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          side="top" 
                          align="center" 
                          className="w-[280px] p-2 space-y-2"
                          sideOffset={8}
                        >
                          {/* Контент */}
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Контент</p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.values(BLOCK_CONFIGS).filter(c => c.category === 'content').map((config) => {
                                const Icon = iconMap[config.icon as string];
                                return (
                                  <button
                                    key={config.type}
                                    onClick={() => onAddBlock(config.type)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    title={config.labelRu}
                                  >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span className="text-[10px] leading-tight text-center truncate w-full">{config.labelRu}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {/* Интерактивные */}
                          <div className="border-t border-border pt-2">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Интерактивные</p>
                            <div className="grid grid-cols-4 gap-1">
                              {Object.values(BLOCK_CONFIGS).filter(c => c.category === 'interactive').map((config) => {
                                const Icon = iconMap[config.icon as string];
                                return (
                                  <button
                                    key={config.type}
                                    onClick={() => onAddBlock(config.type)}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    title={config.labelRu}
                                  >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span className="text-[10px] leading-tight text-center truncate w-full">{config.labelRu}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Separator between lessons */}
                  {lessonIndex < lessons.length - 1 && !isExpanded && (
                    <div className="w-px h-8 bg-border" />
                  )}
                </div>
              );
            })}

            {/* Add lesson button */}
            <button
              onClick={onAddLesson}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-border',
                'flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary',
                'transition-all duration-200 hover:bg-primary/5'
              )}
              title="Добавить урок"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

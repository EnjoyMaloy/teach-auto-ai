import React, { useState, useEffect, useRef, memo } from 'react';
import { Plus, Play, Volume2, Heading, Type, Image, LayoutList, CircleDot, CheckSquare, ToggleLeft, PenLine, Link2, ListOrdered, SlidersHorizontal, Layers } from 'lucide-react';
import { Lesson, CourseDesignSystem } from '@/types/course';
import { Block, BLOCK_CONFIGS, BlockType } from '@/types/blocks';
import { DesignSystemConfig } from '@/types/designSystem';
import { cn } from '@/lib/utils';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';

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
  onAddBlock: () => void;
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

export const CourseTimeline: React.FC<CourseTimelineProps> = ({
  lessons,
  selectedLessonId,
  selectedBlockId,
  onSelectLesson,
  onSelectBlock,
  onAddLesson,
  onAddBlock,
  slideToBlock,
  designSystem,
}) => {
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
    <div className="h-[160px] border-t border-border bg-card/95 backdrop-blur-sm flex flex-col">
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
                      {blocks.map((block, blockIndex) => {
                        const isSelected = selectedBlockId === block.id;

                        return (
                          <div
                            key={block.id}
                            ref={isSelected ? selectedBlockRef : null}
                            onClick={() => onSelectBlock(block.id, lesson.id)}
                            className={cn(
                              'relative flex-shrink-0 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden',
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg scale-105'
                                : 'hover:ring-2 hover:ring-primary/50 hover:scale-105'
                            )}
                          >
                            <ScaledBlockThumbnail 
                              block={block} 
                              index={blockIndex} 
                              designSystem={designSystem}
                            />
                          </div>
                        );
                      })}

                      {/* Add block button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLesson(lesson.id);
                          onAddBlock();
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

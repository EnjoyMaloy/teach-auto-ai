import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lesson } from '@/types/course';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface CourseTimelineProps {
  lessons: Lesson[];
  selectedLessonId: string | null;
  selectedBlockId: string | null;
  onSelectLesson: (lessonId: string) => void;
  onSelectBlock: (blockId: string, lessonId: string) => void;
  onAddLesson: () => void;
  onAddBlock: () => void;
  slideToBlock: (slide: any) => Block;
}

export const CourseTimeline: React.FC<CourseTimelineProps> = ({
  lessons,
  selectedLessonId,
  selectedBlockId,
  onSelectLesson,
  onSelectBlock,
  onAddLesson,
  onAddBlock,
  slideToBlock,
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
      // If already expanded, just select it
      onSelectLesson(lessonId);
    } else {
      // Expand and select
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
                        const config = BLOCK_CONFIGS[block.type];
                        const isSelected = selectedBlockId === block.id;

                        return (
                          <div
                            key={block.id}
                            ref={isSelected ? selectedBlockRef : null}
                            onClick={() => onSelectBlock(block.id, lesson.id)}
                            className={cn(
                              'relative flex-shrink-0 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden',
                              'w-[72px] h-[128px]', // 9:16 aspect ratio scaled down
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg scale-105'
                                : 'hover:ring-2 hover:ring-primary/50 hover:scale-105'
                            )}
                          >
                            {/* Mini preview background */}
                            <div className={cn(
                              'absolute inset-0 flex items-center justify-center',
                              config?.bgClass || 'bg-muted'
                            )}>
                              {/* Block number */}
                              <span className="absolute top-1 left-1 w-5 h-5 rounded bg-background/80 text-[10px] font-bold flex items-center justify-center text-foreground">
                                {blockIndex + 1}
                              </span>
                              
                              {/* Block type indicator */}
                              <span className={cn(
                                'text-xs font-medium px-2 py-1 rounded bg-background/90',
                                config?.colorClass || 'text-foreground'
                              )}>
                                {config?.labelRu?.slice(0, 6) || block.type}
                              </span>
                            </div>
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
                          'flex-shrink-0 w-[72px] h-[128px] rounded-lg border-2 border-dashed border-border',
                          'flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary',
                          'transition-all duration-200 hover:bg-primary/5'
                        )}
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

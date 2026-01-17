import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Course } from '@/types/course';
import { Block, BlockType } from '@/types/blocks';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';
import { LessonMap } from '@/components/runtime/LessonMap';
import { DesignSystemProvider } from '@/components/runtime/DesignSystemProvider';
import { Button } from '@/components/ui/button';

interface FullscreenPreviewProps {
  course: Course;
  onClose: () => void;
  initialLessonId?: string;
  initialBlockIndex?: number;
}

// Adapter: Convert Slide to Block for preview
const slideToBlock = (slide: any): Block => ({
  id: slide.id,
  lessonId: slide.lessonId,
  type: slide.type as BlockType,
  order: slide.order,
  content: slide.content,
  imageUrl: slide.imageUrl,
  videoUrl: slide.videoUrl,
  audioUrl: slide.audioUrl,
  options: slide.options,
  correctAnswer: slide.correctAnswer,
  explanation: slide.explanation,
  blankWord: slide.blankWord,
  matchingPairs: slide.matchingPairs,
  hotspotAreas: slide.hotspotAreas,
  sliderMin: slide.sliderMin,
  sliderMax: slide.sliderMax,
  sliderCorrect: slide.sliderCorrect,
  sliderStep: slide.sliderStep,
  orderingItems: slide.orderingItems,
  correctOrder: slide.correctOrder,
  subBlocks: slide.subBlocks,
  backgroundColor: slide.backgroundColor,
  textColor: slide.textColor,
  textSize: slide.textSize,
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt,
});

type ViewMode = 'lesson' | 'map';

export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  course,
  onClose,
  initialLessonId,
  initialBlockIndex = 0,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialBlockIndex);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map'); // Start with map

  // Initialize lesson based on initialLessonId
  useEffect(() => {
    if (initialLessonId) {
      const lessonIdx = course.lessons.findIndex(l => l.id === initialLessonId);
      if (lessonIdx >= 0) {
        setCurrentLessonIndex(lessonIdx);
        setViewMode('lesson'); // If specific lesson was requested, start with it
      }
    }
  }, [initialLessonId, course.lessons]);

  const currentLesson = course.lessons[currentLessonIndex];
  const blocks = currentLesson?.slides?.map(slideToBlock) || [];
  const currentBlock = blocks[currentBlockIndex] || null;

  const handleContinue = () => {
    if (currentBlockIndex < blocks.length - 1) {
      // Next block in current lesson
      setCurrentBlockIndex(currentBlockIndex + 1);
    } else {
      // Lesson completed - mark as completed and show map
      if (currentLesson && !completedLessons.includes(currentLesson.id)) {
        setCompletedLessons(prev => [...prev, currentLesson.id]);
      }
      setViewMode('map');
    }
  };

  const handleSelectLesson = (lessonId: string, lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setCurrentBlockIndex(0);
    setViewMode('lesson');
  };

  const displayType = course.lessonsDisplayType || 'circle_map';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-card/90 hover:bg-card border border-border shadow-lg"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Phone frame */}
      <DesignSystemProvider config={course.designSystem}>
        <div 
          className="h-[calc(100vh-80px)] w-[calc((100vh-80px)*9/16)] max-w-full rounded-[2.5rem] overflow-hidden flex flex-col border-4 border-foreground/20 shadow-2xl"
          style={{
            backgroundColor: `hsl(var(--ds-background, var(--background)))`,
          }}
        >
          {viewMode === 'lesson' ? (
            <MobilePreviewFrame
              block={currentBlock}
              lessonTitle={currentLesson?.title}
              blockIndex={currentBlockIndex}
              totalBlocks={blocks.length}
              onContinue={handleContinue}
              designSystem={course.designSystem}
              isMuted={false}
              isReadOnly={true}
            />
          ) : (
            <div className="h-full overflow-auto">
              <LessonMap
                lessons={course.lessons}
                displayType={displayType}
                completedLessons={completedLessons}
                currentLessonId={currentLesson?.id}
                onSelectLesson={handleSelectLesson}
              />
            </div>
          )}
        </div>
      </DesignSystemProvider>
    </div>
  );
};

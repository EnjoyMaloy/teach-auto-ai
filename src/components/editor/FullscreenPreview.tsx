import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Course, Lesson } from '@/types/course';
import { Block, BlockType } from '@/types/blocks';
import { MobilePreviewFrame } from './blocks/MobilePreviewFrame';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  course,
  onClose,
  initialLessonId,
  initialBlockIndex = 0,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialBlockIndex);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize lesson based on initialLessonId
  useEffect(() => {
    if (initialLessonId) {
      const lessonIdx = course.lessons.findIndex(l => l.id === initialLessonId);
      if (lessonIdx >= 0) {
        setCurrentLessonIndex(lessonIdx);
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
    } else if (currentLessonIndex < course.lessons.length - 1) {
      // Next lesson
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentBlockIndex(0);
    } else {
      // Course completed
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    } else if (currentLessonIndex > 0) {
      const prevLesson = course.lessons[currentLessonIndex - 1];
      const prevBlocks = prevLesson?.slides?.length || 0;
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentBlockIndex(Math.max(0, prevBlocks - 1));
    }
  };

  const canGoPrevious = currentBlockIndex > 0 || currentLessonIndex > 0;
  const isLastBlock = currentBlockIndex === blocks.length - 1 && currentLessonIndex === course.lessons.length - 1;

  // Calculate overall progress
  const totalBlocks = course.lessons.reduce((sum, l) => sum + (l.slides?.length || 0), 0);
  const completedBlocks = course.lessons.slice(0, currentLessonIndex).reduce((sum, l) => sum + (l.slides?.length || 0), 0) + currentBlockIndex;
  const progressPercent = totalBlocks > 0 ? (completedBlocks / totalBlocks) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        {/* Left: Lesson info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-card/90 hover:bg-card border border-border shadow-lg"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="bg-card/90 px-3 py-1.5 rounded-lg border border-border shadow-lg">
            <p className="text-xs text-muted-foreground">Урок {currentLessonIndex + 1} / {course.lessons.length}</p>
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {currentLesson?.title}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-card/90 hover:bg-card border border-border shadow-lg"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation arrows */}
      {canGoPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-card/90 hover:bg-card border border-border shadow-lg h-12 w-12"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {/* Phone frame */}
      <div 
        className="h-[calc(100vh-120px)] w-[calc((100vh-120px)*9/16)] max-w-full rounded-[2.5rem] overflow-hidden flex flex-col border-4 border-foreground/20 shadow-2xl bg-background"
      >
        <MobilePreviewFrame
          block={currentBlock}
          lessonTitle={currentLesson?.title}
          blockIndex={currentBlockIndex}
          totalBlocks={blocks.length}
          onContinue={handleContinue}
          designSystem={course.designSystem}
          isMuted={isMuted}
        />
      </div>

      {/* Bottom progress */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-card/90 rounded-xl border border-border shadow-lg p-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Прогресс курса</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

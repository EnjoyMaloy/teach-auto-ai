import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
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
import { Course, Lesson, Slide, LessonsDisplayType } from '@/types/course';
import { Block, BlockType, createEmptyBlock } from '@/types/blocks';
import { DesignSystemConfig } from '@/types/designSystem';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { CourseTimeline } from '@/components/editor/CourseTimeline';
import { EditorAISidebar } from '@/components/editor/EditorAISidebar';

import { CoursePlayer } from '@/components/runtime/CoursePlayer';

import { 
  BlockPreview, 
  MobilePreviewFrame, 
  BlockEditor 
} from '@/components/editor/blocks';
import { TextEditorProvider } from '@/components/editor/blocks/TextEditorContext';
import { SortableBlockItem } from '@/components/editor/SortableBlockItem'; // Keep for potential future use
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { AIGenerationProvider, useAIGeneration } from '@/hooks/useAIGeneration';

// Adapter: Convert Slide to Block for the new editor
const slideToBlock = (slide: Slide): Block => ({
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
  explanationCorrect: slide.explanationCorrect,
  explanationPartial: slide.explanationPartial,
  blankWord: slide.blankWord,
  matchingPairs: slide.matchingPairs,
  sliderMin: slide.sliderMin,
  sliderMax: slide.sliderMax,
  sliderCorrect: slide.sliderCorrect,
  sliderCorrectMax: slide.sliderCorrectMax,
  sliderStep: slide.sliderStep,
  orderingItems: slide.orderingItems,
  correctOrder: slide.correctOrder,
  subBlocks: (slide as any).subBlocks,
  backgroundColor: slide.backgroundColor,
  textColor: slide.textColor,
  textSize: (slide as any).textSize,
  backgroundId: (slide as any).backgroundId,
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt,
});

// Adapter: Convert Block back to Slide for storage
const blockToSlide = (block: Block): Slide => ({
  id: block.id,
  lessonId: block.lessonId,
  type: block.type as any,
  order: block.order,
  content: block.content,
  imageUrl: block.imageUrl,
  videoUrl: block.videoUrl,
  audioUrl: block.audioUrl,
  options: block.options,
  correctAnswer: block.correctAnswer,
  explanation: block.explanation,
  explanationCorrect: block.explanationCorrect,
  explanationPartial: block.explanationPartial,
  blankWord: block.blankWord,
  matchingPairs: block.matchingPairs,
  sliderMin: block.sliderMin,
  sliderMax: block.sliderMax,
  sliderCorrect: block.sliderCorrect,
  sliderCorrectMax: block.sliderCorrectMax,
  sliderStep: block.sliderStep,
  orderingItems: block.orderingItems,
  correctOrder: block.correctOrder,
  subBlocks: block.subBlocks,
  backgroundColor: block.backgroundColor,
  textColor: block.textColor,
  textSize: block.textSize,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
} as Slide);

const Editor: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse, createCourse, saveCourse } = useCourses();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSubBlockId, setSelectedSubBlockId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false); // kept for potential use
  const [undoStack, setUndoStack] = useState<Course[]>([]);
  const [redoStack, setRedoStack] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load or create course - only once on mount
  useEffect(() => {
    // Skip if course is already loaded for this courseId
    if (course && course.id === courseId) return;
    
    const loadCourse = async () => {
      if (!user) return;
      
      setIsLoadingCourse(true);
      
      if (courseId === 'new') {
        const newCourse = await createCourse('Новый курс');
        if (newCourse) {
          navigate(`/editor/${newCourse.id}`, { replace: true });
        } else {
          navigate('/');
        }
      } else if (courseId) {
        const loadedCourse = await fetchCourse(courseId);
        if (loadedCourse) {
          setCourse(loadedCourse);
          if (loadedCourse.lessons.length > 0) {
            setSelectedLessonId(loadedCourse.lessons[0].id);
            if (loadedCourse.lessons[0].slides.length > 0) {
              setSelectedBlockId(loadedCourse.lessons[0].slides[0].id);
            }
          }
        } else {
          toast.error('Курс не найден');
          navigate('/');
        }
      }
      
      setIsLoadingCourse(false);
    };

    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.id]);

  const selectedLesson = course?.lessons.find(l => l.id === selectedLessonId);
  const blocks: Block[] = selectedLesson?.slides.map(slideToBlock) || [];
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // History management
  const pushToUndo = useCallback(() => {
    if (!course) return;
    setUndoStack(prev => [...prev.slice(-19), course]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, [course]);

  // Autosave effect - saves 2 seconds after last change
  useEffect(() => {
    if (!hasUnsavedChanges || !course || isSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      const success = await saveCourse(course);
      setIsSaving(false);
      if (success) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [course, hasUnsavedChanges, isSaving, saveCourse]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !course) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, course]);
    setUndoStack(prev => prev.slice(0, -1));
    setCourse(previous);
  }, [undoStack, course]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !course) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, course]);
    setRedoStack(prev => prev.slice(0, -1));
    setCourse(next);
  }, [redoStack, course]);

  // Course title update
  const handleUpdateTitle = (title: string) => {
    if (!course) return;
    pushToUndo();
    setCourse(prev => prev ? ({ ...prev, title, updatedAt: new Date() }) : null);
    toast.success('Название курса обновлено');
  };

  // Design system update
  const handleUpdateDesignSystem = (config: DesignSystemConfig) => {
    if (!course) return;
    pushToUndo();
    setCourse(prev => prev ? ({ ...prev, designSystem: config, updatedAt: new Date() }) : null);
  };

  // Lesson operations
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const lesson = course?.lessons.find(l => l.id === lessonId);
    if (lesson?.slides[0]) {
      setSelectedBlockId(lesson.slides[0].id);
    } else {
      setSelectedBlockId(null);
    }
  };

  const handleAddLesson = () => {
    if (!course) return;
    pushToUndo();
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      courseId: course.id,
      title: `Урок ${course.lessons.length + 1}`,
      description: '',
      order: course.lessons.length + 1,
      slides: [],
      estimatedMinutes: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCourse(prev => prev ? ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
      updatedAt: new Date(),
    }) : null);
    setSelectedLessonId(newLesson.id);
    setSelectedBlockId(null);
    toast.success('Урок добавлен');
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!course) return;
    if (course.lessons.length <= 1) {
      toast.error('Нельзя удалить единственный урок');
      return;
    }
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.filter(l => l.id !== lessonId),
      updatedAt: new Date(),
    }) : null);
    if (selectedLessonId === lessonId) {
      const remaining = course.lessons.filter(l => l.id !== lessonId);
      setSelectedLessonId(remaining[0]?.id || null);
    }
    toast.success('Урок удалён');
  };

  const handleDuplicateLesson = (lessonId: string) => {
    if (!course) return;
    pushToUndo();
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    const newLesson: Lesson = {
      ...lesson,
      id: crypto.randomUUID(),
      title: `${lesson.title} (копия)`,
      order: course.lessons.length + 1,
      slides: lesson.slides.map(s => ({
        ...s,
        id: crypto.randomUUID(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCourse(prev => prev ? ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
      updatedAt: new Date(),
    }) : null);
    toast.success('Урок скопирован');
  };

  // Block operations
  const handleAddBlock = (type: BlockType) => {
    if (!selectedLessonId || !course) {
      toast.error('Сначала выберите урок');
      return;
    }
    pushToUndo();
    
    const newBlock = createEmptyBlock(type, selectedLessonId, blocks.length + 1);
    const newSlide = blockToSlide(newBlock);

    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson =>
        lesson.id === selectedLessonId
          ? { ...lesson, slides: [...lesson.slides, newSlide], updatedAt: new Date() }
          : lesson
      ),
      updatedAt: new Date(),
    }) : null);
    setSelectedBlockId(newBlock.id);
    setShowBlockSelector(false);
    toast.success('Блок добавлен');
  };

  const handleUpdateBlock = (updates: Partial<Block>) => {
    if (!course || !selectedBlockId) return;
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => ({
        ...lesson,
        slides: lesson.slides.map(slide =>
          slide.id === selectedBlockId
            ? { ...slide, ...updates, updatedAt: new Date() }
            : slide
        ),
      })),
      updatedAt: new Date(),
    }) : null);
  };

  const handleDeleteBlock = (blockId?: string) => {
    const idToDelete = blockId || selectedBlockId;
    if (!course || !idToDelete) return;
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => ({
        ...lesson,
        slides: lesson.slides.filter(s => s.id !== idToDelete),
      })),
      updatedAt: new Date(),
    }) : null);
    if (idToDelete === selectedBlockId) {
      setSelectedBlockId(null);
    }
    toast.success('Блок удалён');
  };

  const handleDuplicateBlock = (blockId: string) => {
    if (!course || !selectedLessonId) return;
    const lesson = course.lessons.find(l => l.id === selectedLessonId);
    if (!lesson) return;
    const slide = lesson.slides.find(s => s.id === blockId);
    if (!slide) return;
    
    pushToUndo();
    const newSlide = {
      ...slide,
      id: crypto.randomUUID(),
      order: lesson.slides.length + 1,
    };
    
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(l =>
        l.id === selectedLessonId
          ? { ...l, slides: [...l.slides, newSlide], updatedAt: new Date() }
          : l
      ),
      updatedAt: new Date(),
    }) : null);
    toast.success('Блок скопирован');
  };

  // Reorder
  const handleReorderLessons = (activeId: string, overId: string) => {
    if (!course) return;
    pushToUndo();
    setCourse(prev => {
      if (!prev) return null;
      const oldIndex = prev.lessons.findIndex(l => l.id === activeId);
      const newIndex = prev.lessons.findIndex(l => l.id === overId);
      return {
        ...prev,
        lessons: arrayMove(prev.lessons, oldIndex, newIndex).map((l, i) => ({
          ...l,
          order: i + 1,
        })),
        updatedAt: new Date(),
      };
    });
  };

  const handleReorderBlocks = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedLessonId || !course) return;
    
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => {
        if (lesson.id !== selectedLessonId) return lesson;
        const oldIndex = lesson.slides.findIndex(s => s.id === active.id);
        const newIndex = lesson.slides.findIndex(s => s.id === over.id);
        return {
          ...lesson,
          slides: arrayMove(lesson.slides, oldIndex, newIndex).map((s, i) => ({
            ...s,
            order: i + 1,
          })),
          updatedAt: new Date(),
        };
      }),
      updatedAt: new Date(),
    }) : null);
  };

  const handleSave = async () => {
    if (!course) return;
    setIsSaving(true);
    const success = await saveCourse(course);
    setIsSaving(false);
    if (success) {
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      toast.success('Курс сохранён');
    }
  };

  const handlePublish = () => {
    if (!course) return;
    setCourse(prev => prev ? ({
      ...prev,
      isPublished: true,
      publishedAt: new Date(),
    }) : null);
  };

  // Loading state
  if (isLoadingCourse || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedBlockIndex = blocks.findIndex(b => b.id === selectedBlockId);

  if (isPreviewMode) {
    return (
      <CoursePlayer 
        courseId={course.id}
        mode="preview"
        onClose={() => setIsPreviewMode(false)}
        initialLessonId={selectedLessonId || undefined}
        initialBlockIndex={selectedBlockIndex >= 0 ? selectedBlockIndex : 0}
      />
    );
  }

  const handleContinueToNextBlock = () => {
    if (selectedBlockIndex < blocks.length - 1) {
      setSelectedBlockId(blocks[selectedBlockIndex + 1].id);
    }
  };

  return (
    <TextEditorProvider>
    <div className="h-screen flex bg-background">
      {/* AI Sidebar - Left, full height */}
      <EditorAISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        courseId={course.id}
        designSystem={course.designSystem}
        selectedBlock={selectedBlock}
        onAIGenerate={(generatedLessons) => {
          pushToUndo();
          setCourse(prev => prev ? ({
            ...prev,
            lessons: generatedLessons.map((l, i) => ({ ...l, courseId: prev.id, order: i + 1 })),
            updatedAt: new Date(),
          }) : null);
          if (generatedLessons.length > 0) {
            setSelectedLessonId(generatedLessons[0].id);
            if (generatedLessons[0].slides.length > 0) {
              setSelectedBlockId(generatedLessons[0].slides[0].id);
            }
          }
          toast.success(`Курс сгенерирован: ${generatedLessons.length} уроков`);
        }}
        onUpdateBlock={handleUpdateBlock}
      />

      {/* Main content area - header + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <EditorHeader
          course={course}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
          isAISidebarOpen={isAISidebarOpen}
          isPreviewMuted={isPreviewMuted}
          onToggleMute={() => setIsPreviewMuted(!isPreviewMuted)}
          onToggleAISidebar={() => setIsAISidebarOpen(!isAISidebarOpen)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPreview={() => setIsPreviewMode(true)}
          onPublish={handlePublish}
          onSave={handleSave}
          onUpdateTitle={handleUpdateTitle}
          onUpdateDesignSystem={handleUpdateDesignSystem}
          onUpdateLessonsDisplayType={(type) => {
            pushToUndo();
            setCourse(prev => prev ? ({ ...prev, lessonsDisplayType: type, updatedAt: new Date() }) : null);
          }}
          onAIGenerate={(generatedLessons) => {
            if (!course) return;
            pushToUndo();
            setCourse(prev => prev ? ({
              ...prev,
              lessons: generatedLessons.map((l, i) => ({ ...l, courseId: prev.id, order: i + 1 })),
              updatedAt: new Date(),
            }) : null);
            if (generatedLessons.length > 0) {
              setSelectedLessonId(generatedLessons[0].id);
              if (generatedLessons[0].slides.length > 0) {
                setSelectedBlockId(generatedLessons[0].slides[0].id);
              }
            }
            toast.success(`Курс сгенерирован: ${generatedLessons.length} уроков`);
          }}
          onBack={() => navigate('/')}
        />

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview + Block Editor row */}
          <div className="flex-1 flex overflow-hidden">
            {/* Mobile Preview - centered */}
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-background py-3">
              <div 
                className="h-full overflow-hidden"
                style={{ 
                  aspectRatio: '9/16',
                  maxHeight: '100%',
                }}
              >
                <MobilePreviewFrame
                  block={selectedBlock}
                  lessonTitle={selectedLesson?.title}
                  blockIndex={selectedBlockIndex >= 0 ? selectedBlockIndex : 0}
                  totalBlocks={blocks.length}
                  onContinue={handleContinueToNextBlock}
                  onUpdateBlock={handleUpdateBlock}
                  designSystem={course.designSystem}
                  isMuted={isPreviewMuted}
                  selectedSubBlockId={selectedSubBlockId}
                  onSelectSubBlock={setSelectedSubBlockId}
                />
              </div>
            </div>

            {/* Right: Block Editor - fixed width */}
            <div className="hidden md:flex w-[380px] shrink-0 flex-col border-l border-border/10 bg-background overflow-hidden">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  selectedSubBlockId={selectedSubBlockId}
                  onSelectSubBlock={setSelectedSubBlockId}
                  themeBackgrounds={(course.designSystem as any)?.themeBackgrounds || []}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="w-20 h-20 rounded-3xl bg-muted mx-auto mb-5 flex items-center justify-center">
                      <Smartphone className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">Редактор блока</p>
                    <p className="text-sm text-muted-foreground">
                      Выберите блок снизу для редактирования
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Course Timeline */}
        <CourseTimeline
          lessons={course.lessons}
          selectedLessonId={selectedLessonId}
          selectedBlockId={selectedBlockId}
          onSelectLesson={handleSelectLesson}
          onSelectBlock={(blockId, lessonId) => {
            setSelectedLessonId(lessonId);
            setSelectedBlockId(blockId);
          }}
          onAddLesson={handleAddLesson}
          onAddBlock={handleAddBlock}
          onReorderBlocks={handleReorderBlocks}
          slideToBlock={slideToBlock}
          designSystem={course.designSystem}
        />
      </div>
    </div>
    </TextEditorProvider>
  );
};

// Wrap Editor with AIGenerationProvider
const EditorWithProviders: React.FC = () => (
  <AIGenerationProvider>
    <Editor />
  </AIGenerationProvider>
);

export default EditorWithProviders;

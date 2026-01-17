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
import { Course, Lesson, Slide } from '@/types/course';
import { Block, BlockType, createEmptyBlock } from '@/types/blocks';
import { DesignSystemConfig } from '@/types/designSystem';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { LessonsList } from '@/components/editor/LessonsList';
import { CoursePlayer } from '@/components/runtime/CoursePlayer';

import { 
  BlockPreview, 
  BlockTypeSelector, 
  MobilePreviewFrame, 
  BlockEditor 
} from '@/components/editor/blocks';
import { SortableBlockItem } from '@/components/editor/SortableBlockItem';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, Smartphone, Volume2, VolumeX } from 'lucide-react';

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
  blankWord: slide.blankWord,
  matchingPairs: slide.matchingPairs,
  hotspotAreas: slide.hotspotAreas,
  sliderMin: slide.sliderMin,
  sliderMax: slide.sliderMax,
  sliderCorrect: slide.sliderCorrect,
  sliderStep: slide.sliderStep,
  orderingItems: slide.orderingItems,
  correctOrder: slide.correctOrder,
  subBlocks: (slide as any).subBlocks,
  backgroundColor: slide.backgroundColor,
  textColor: slide.textColor,
  textSize: (slide as any).textSize,
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
  blankWord: block.blankWord,
  matchingPairs: block.matchingPairs,
  hotspotAreas: block.hotspotAreas,
  sliderMin: block.sliderMin,
  sliderMax: block.sliderMax,
  sliderCorrect: block.sliderCorrect,
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [undoStack, setUndoStack] = useState<Course[]>([]);
  const [redoStack, setRedoStack] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load or create course
  useEffect(() => {
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
  }, [courseId, user, fetchCourse, createCourse, navigate]);

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
      id: `lesson-${Date.now()}`,
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
      id: `lesson-${Date.now()}`,
      title: `${lesson.title} (копия)`,
      order: course.lessons.length + 1,
      slides: lesson.slides.map(s => ({
        ...s,
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  if (isPreviewMode) {
    return <CoursePlayer course={course} onClose={() => setIsPreviewMode(false)} />;
  }

  const selectedBlockIndex = blocks.findIndex(b => b.id === selectedBlockId);

  const handleContinueToNextBlock = () => {
    if (selectedBlockIndex < blocks.length - 1) {
      setSelectedBlockId(blocks[selectedBlockIndex + 1].id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader
        course={course}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={() => setIsPreviewMode(true)}
        onPublish={handlePublish}
        onSave={handleSave}
        onUpdateTitle={handleUpdateTitle}
        onUpdateDesignSystem={handleUpdateDesignSystem}
        onBack={() => navigate('/')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Lessons sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-card">
          <LessonsList
            lessons={course.lessons}
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            onAddLesson={handleAddLesson}
            onDeleteLesson={handleDeleteLesson}
            onDuplicateLesson={handleDuplicateLesson}
            onReorderLessons={handleReorderLessons}
          />
        </div>

        {/* Center: Block list + Mobile Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Block list */}
          <div className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Блоки</h3>
                <p className="text-xs text-muted-foreground">{blocks.length} блоков • {Math.ceil(blocks.length * 10 / 60)} мин</p>
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowBlockSelector(true)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Добавить
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {blocks.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleReorderBlocks}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {blocks.map((block, index) => (
                        <SortableBlockItem
                          key={block.id}
                          block={block}
                          index={index}
                          isSelected={selectedBlockId === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                          onDelete={() => handleDeleteBlock(block.id)}
                          onDuplicate={() => handleDuplicateBlock(block.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-2">Начните создавать</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Добавьте первый блок урока
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowBlockSelector(true)}
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Добавить блок
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Preview - Full area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-card">
            {/* Preview header with mute button */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Предпросмотр</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                className="gap-2"
              >
                {isPreviewMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span className="text-xs">Звук выкл</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs">Звук вкл</span>
                  </>
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MobilePreviewFrame
                block={selectedBlock}
                lessonTitle={selectedLesson?.title}
                blockIndex={selectedBlockIndex >= 0 ? selectedBlockIndex : 0}
                totalBlocks={blocks.length}
                onContinue={handleContinueToNextBlock}
                onUpdateBlock={handleUpdateBlock}
                designSystem={course.designSystem}
                isMuted={isPreviewMuted}
              />
            </div>
          </div>
        </div>

        {/* Right: Block Editor */}
        <div className="w-[420px] flex-shrink-0 border-l border-border bg-card overflow-hidden">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onUpdate={handleUpdateBlock}
              onDelete={handleDeleteBlock}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div>
                <div className="w-20 h-20 rounded-3xl bg-muted mx-auto mb-5 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-2">Редактор блока</p>
                <p className="text-sm text-muted-foreground">
                  Выберите блок слева для редактирования
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Type Selector Modal */}
      {showBlockSelector && (
        <BlockTypeSelector
          onSelect={handleAddBlock}
          onClose={() => setShowBlockSelector(false)}
        />
      )}
    </div>
  );
};

export default Editor;

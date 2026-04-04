import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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
import { useCourseLanguages } from '@/hooks/useCourseLanguages';
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
import { useAIGeneration } from '@/hooks/useAIGeneration';

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
  articleId: slide.articleId,
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
  articleId: block.articleId,
  createdAt: block.createdAt,
  updatedAt: block.updatedAt,
} as Slide);

const Editor: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { fetchCourse, saveCourse } = useCourses();
  const queryClient = useQueryClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSubBlockId, setSelectedSubBlockId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [undoStack, setUndoStack] = useState<Course[]>([]);
  const [redoStack, setRedoStack] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [initialAIMode, setInitialAIMode] = useState<'generate' | null>(
    (location.state as any)?.openAIGenerate ? 'generate' : null
  );
  const [currentEditLanguage, setCurrentEditLanguage] = useState<string | null>(null);
  const { state: aiState } = useAIGeneration();
  const [translatedSlides, setTranslatedSlides] = useState<Record<string, any>>({});
  const [translatedLessons, setTranslatedLessons] = useState<Record<string, any>>({});


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load or create course - only once on mount
  useEffect(() => {
    // Skip if course is already loaded for this courseId (but never skip for 'new')
    if (courseId !== 'new' && course && course.id === courseId) return;
    
    const loadCourse = async () => {
      if (!user) return;
      
      setIsLoadingCourse(true);
      
      // Reset state when creating a new course to avoid stale data from previous course
      if (courseId === 'new') {
        setCourse(null);
        setSelectedLessonId(null);
        setSelectedBlockId(null);
        // Create in-memory course without saving to DB
        const tempId = crypto.randomUUID();
        const navState = location.state as any;
        
        // Check if we have imported lessons from MD file
        const importedLessons = navState?.importedLessons as Lesson[] | undefined;
        const importedTitle = navState?.importedTitle as string | undefined;
        const importedDescription = navState?.importedDescription as string | undefined;
        
        const tempCourse: Course = {
          id: tempId,
          title: importedTitle || 'Новый курс',
          description: importedDescription || '',
          authorId: user.id,
          targetAudience: '',
          lessons: importedLessons 
            ? importedLessons.map((l, i) => ({ ...l, courseId: tempId, order: i + 1 }))
            : [],
          currentVersion: 1,
          versions: [],
          isPublished: false,
          estimatedMinutes: 0,
          tags: [],
          lessonsDisplayType: 'circle_map',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCourse(tempCourse);
        setIsNewCourse(true);
        
        // If imported, select first lesson/block
        if (importedLessons && importedLessons.length > 0) {
          setSelectedLessonId(importedLessons[0].id);
          if (importedLessons[0].slides?.length > 0) {
            setSelectedBlockId(importedLessons[0].slides[0].id);
          }
        }
        
        navigate(`/editor/${tempId}`, { replace: true, state: location.state });
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
        } else if (!isNewCourse) {
          // Only show error if this isn't a new in-memory course
          toast.error('Курс не найден');
          navigate('/');
        }
      }
      
      setIsLoadingCourse(false);
    };

    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.id]);

  // Auto-open AI sidebar in generate mode when coming from "New Course"
  useEffect(() => {
    if (initialAIMode === 'generate' && course && !isLoadingCourse) {
      setIsAISidebarOpen(true);
      setInitialAIMode(null);
      // Clear navigation state to prevent re-triggering
      window.history.replaceState({}, '');
    }
  }, [initialAIMode, course, isLoadingCourse]);

  // Load translations when edit language changes
  useEffect(() => {
    if (!currentEditLanguage || !course) {
      setTranslatedSlides({});
      setTranslatedLessons({});
      return;
    }
    const loadTranslations = async () => {
      const lessonIds = course.lessons.map(l => l.id);
      if (lessonIds.length === 0) return;

      // Load lesson translations
      const { data: lessonTrans } = await supabase
        .from('lesson_translations')
        .select('*')
        .in('lesson_id', lessonIds)
        .eq('language_code', currentEditLanguage);

      const lessonMap: Record<string, any> = {};
      lessonTrans?.forEach(lt => { lessonMap[lt.lesson_id] = lt; });
      setTranslatedLessons(lessonMap);

      // Load slide translations
      const allSlideIds = course.lessons.flatMap(l => l.slides.map(s => s.id));
      if (allSlideIds.length === 0) { setTranslatedSlides({}); return; }

      const { data: slideTrans } = await supabase
        .from('slide_translations')
        .select('*')
        .in('slide_id', allSlideIds)
        .eq('language_code', currentEditLanguage);

      const slideMap: Record<string, any> = {};
      slideTrans?.forEach(st => { slideMap[st.slide_id] = st; });
      setTranslatedSlides(slideMap);
    };
    loadTranslations();
  }, [currentEditLanguage, course?.id, course?.lessons.length]);

  const selectedLesson = course?.lessons.find(l => l.id === selectedLessonId);
  
  // Apply translations to blocks if viewing a translation language
  const rawBlocks: Block[] = selectedLesson?.slides.map(slideToBlock) || [];
  const blocks: Block[] = currentEditLanguage
    ? rawBlocks.map(block => {
        const trans = translatedSlides[block.id];
        if (!trans) return block;
        return {
          ...block,
          content: trans.content ?? block.content,
          options: trans.options ?? block.options,
          explanation: trans.explanation ?? block.explanation,
          explanationCorrect: trans.explanation_correct ?? block.explanationCorrect,
          explanationPartial: trans.explanation_partial ?? block.explanationPartial,
          blankWord: trans.blank_word ?? block.blankWord,
          matchingPairs: trans.matching_pairs ?? block.matchingPairs,
          orderingItems: trans.ordering_items ?? block.orderingItems,
          subBlocks: trans.sub_blocks ?? block.subBlocks,
          hints: trans.hints ?? (block as any).hints,
        };
      })
    : rawBlocks;
  
  // Apply lesson title translation  
  const displayLessonTitle = currentEditLanguage && selectedLesson
    ? translatedLessons[selectedLesson.id]?.title || selectedLesson.title
    : selectedLesson?.title;

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // History management
  const pushToUndo = useCallback(() => {
    if (!course) return;
    setUndoStack(prev => [...prev.slice(-19), course]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, [course]);

  // Persist a new in-memory course to DB for the first time
  const persistNewCourseToDb = useCallback(async (courseToSave: Course): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          id: courseToSave.id,
          author_id: user.id,
          title: courseToSave.title,
          description: courseToSave.description || '',
          design_system: courseToSave.designSystem as any,
          lessons_display_type: courseToSave.lessonsDisplayType || 'circle_map',
        })
        .select()
        .single();

      if (error) throw error;
      setIsNewCourse(false);
      // Invalidate courses cache so workshop shows the new course
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      return true;
    } catch (error) {
      console.error('Error creating course in DB:', error);
      toast.error('Ошибка создания курса');
      return false;
    }
  }, [user, queryClient]);

  // Ensure course is persisted to DB (for new courses)
  const ensurePersisted = useCallback(async () => {
    if (!isNewCourse || !course) return true;
    const created = await persistNewCourseToDb(course);
    return created;
  }, [isNewCourse, course, persistNewCourseToDb]);

  // Autosave effect - saves 2 seconds after last change
  useEffect(() => {
    if (!hasUnsavedChanges || !course || isSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      
      // If this is a new course, create it in DB first
      if (isNewCourse) {
        const created = await persistNewCourseToDb(course);
        if (!created) {
          setIsSaving(false);
          return;
        }
      }
      
      const success = await saveCourse(course);
      setIsSaving(false);
      if (success) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [course, hasUnsavedChanges, isSaving, saveCourse, isNewCourse, persistNewCourseToDb]);

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
    // toast removed intentionally
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
    // toast removed intentionally
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
    // toast removed intentionally
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
    // toast removed intentionally
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
    
    if (isNewCourse) {
      const created = await persistNewCourseToDb(course);
      if (!created) {
        setIsSaving(false);
        return;
      }
    }
    
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
      <div className="h-screen flex bg-background relative">
      {/* Academy logo - fixed top-left corner, always visible */}
      <button
        onClick={() => setIsAISidebarOpen(prev => !prev)}
        className="absolute top-3 left-3 z-50 w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(265,60%,75%)] to-[hsl(265,60%,65%)] flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <svg width="14" height="14" viewBox="0 1.5 15.22 15.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.0069 1.94165H4.21278L0 16.8103H2.95308L3.94432 13.2583L4.74971 10.4911L6.29852 4.70887H8.92119L10.4494 10.4911L11.2754 13.2583L12.2666 16.8103H15.2197L11.0069 1.94165Z" fill="white"/>
          <path d="M9.06607 9.31335H6.1543V12.2251H9.06607V9.31335Z" fill="white"/>
        </svg>
      </button>
      {/* AI Sidebar - Left, full height */}
      <EditorAISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        initialMode={(location.state as any)?.openAIGenerate ? 'generate' : undefined}
        autoPrompt={(location.state as any)?.autoPrompt}
        autoSettings={(location.state as any)?.generationSettings}
        autoMdContent={(location.state as any)?.mdContent}
        courseId={course.id}
        designSystem={course.designSystem}
        selectedBlock={selectedBlock}
        selectedLessonOrder={selectedLesson ? (course.lessons.indexOf(selectedLesson) + 1) : undefined}
        selectedBlockOrder={selectedBlock ? (blocks.indexOf(selectedBlock) + 1) : undefined}
        allBlocks={blocks}
        allLessons={course.lessons}
        onAIGenerate={async (generatedLessons, designConfig, designSystemId) => {
          await ensurePersisted();
          pushToUndo();
          
          // Fetch the updated course title/description from DB (set by generation)
          const { data: updatedCourse } = await supabase
            .from('courses')
            .select('title, description')
            .eq('id', course.id)
            .single();
          
          setCourse(prev => prev ? ({
            ...prev,
            lessons: generatedLessons.map((l, i) => ({ ...l, courseId: prev.id, order: i + 1 })),
            ...(designConfig ? { designSystem: designConfig as any } : {}),
            ...(updatedCourse?.title ? { title: updatedCourse.title } : {}),
            ...(updatedCourse?.description ? { description: updatedCourse.description } : {}),
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
        onRefineCourse={async (refinedLessons) => {
          await ensurePersisted();
          pushToUndo();
          setCourse(prev => prev ? ({
            ...prev,
            lessons: refinedLessons.map((l, i) => ({ ...l, courseId: prev.id, order: i + 1 })),
            updatedAt: new Date(),
          }) : null);
          if (refinedLessons.length > 0) {
            setSelectedLessonId(refinedLessons[0].id);
            if (refinedLessons[0].slides.length > 0) {
              setSelectedBlockId(refinedLessons[0].slides[0].id);
            }
          }
          toast.success(`Курс обновлён: ${refinedLessons.length} уроков`);
        }}
        onBeforeGenerate={ensurePersisted}
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
          onAIGenerate={async (generatedLessons, designConfig, designSystemId) => {
            if (!course) return;
            await ensurePersisted();
            pushToUndo();
            
            const { data: updatedCourse } = await supabase
              .from('courses')
              .select('title, description')
              .eq('id', course.id)
              .single();
            
            setCourse(prev => prev ? ({
              ...prev,
              lessons: generatedLessons.map((l, i) => ({ ...l, courseId: prev.id, order: i + 1 })),
              ...(designConfig ? { designSystem: designConfig as any } : {}),
              ...(updatedCourse?.title ? { title: updatedCourse.title } : {}),
              ...(updatedCourse?.description ? { description: updatedCourse.description } : {}),
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
          currentEditLanguage={currentEditLanguage}
          onLanguageChange={setCurrentEditLanguage}
        />

        <div className="flex-1 flex overflow-hidden relative bg-secondary dark:bg-black/10">
          {/* Preview area - full width */}
          <div className={`flex-1 flex items-center justify-center overflow-hidden m-2 rounded-2xl bg-background transition-all duration-300 ${selectedBlock ? 'md:pr-[396px]' : ''}`}>
            <div 
              className="h-full w-full py-3"
            >
              <MobilePreviewFrame
                block={selectedBlock}
                lessonTitle={displayLessonTitle}
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

          {/* Right: Block Editor - floating overlay */}
          {selectedBlock && (
            <div className="hidden md:flex absolute right-3 top-3 bottom-3 w-[380px] flex-col rounded-2xl bg-secondary dark:bg-black/10 backdrop-blur-xl shadow-sm dark:shadow-black/10 overflow-hidden z-10 border border-border/10 dark:border-white/[0.06]">
              <BlockEditor
                block={selectedBlock}
                onUpdate={handleUpdateBlock}
                onDelete={handleDeleteBlock}
                selectedSubBlockId={selectedSubBlockId}
                onSelectSubBlock={setSelectedSubBlockId}
                themeBackgrounds={(course.designSystem as any)?.themeBackgrounds || []}
              />
            </div>
          )}
        </div>

        {/* Bottom: Course Timeline */}
        <CourseTimeline
          lessons={course.lessons}
          isGenerating={aiState.status === 'generating'}
          selectedLessonId={selectedLessonId}
          selectedBlockId={selectedBlockId}
          onSelectLesson={handleSelectLesson}
          onSelectBlock={(blockId, lessonId) => {
            setSelectedLessonId(lessonId);
            setSelectedBlockId(blockId);
          }}
          onAddLesson={handleAddLesson}
          onDeleteLesson={handleDeleteLesson}
          onAddBlock={handleAddBlock}
          onReorderBlocks={handleReorderBlocks}
          onDeleteBlock={handleDeleteBlock}
          onDuplicateBlock={handleDuplicateBlock}
          slideToBlock={slideToBlock}
          designSystem={course.designSystem}
        />
      </div>
      </div>
    </TextEditorProvider>
  );
};

export default Editor;

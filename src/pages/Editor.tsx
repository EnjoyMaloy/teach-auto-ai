import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
import { Course, Lesson, Slide, SlideType } from '@/types/course';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { LessonsList } from '@/components/editor/LessonsList';
import { SlideEditor } from '@/components/editor/SlideEditor';
import { CoursePlayer } from '@/components/runtime/CoursePlayer';
import { EditorAIChat } from '@/components/editor/EditorAIChat';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Editor: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse, createCourse, saveCourse } = useCourses();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [undoStack, setUndoStack] = useState<Course[]>([]);
  const [redoStack, setRedoStack] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load or create course
  useEffect(() => {
    const loadCourse = async () => {
      if (!user) return;
      
      setIsLoadingCourse(true);
      
      if (courseId === 'new') {
        // Create new course
        const newCourse = await createCourse('Новый курс');
        if (newCourse) {
          navigate(`/editor/${newCourse.id}`, { replace: true });
        } else {
          navigate('/');
        }
      } else if (courseId) {
        // Load existing course
        const loadedCourse = await fetchCourse(courseId);
        if (loadedCourse) {
          setCourse(loadedCourse);
          if (loadedCourse.lessons.length > 0) {
            setSelectedLessonId(loadedCourse.lessons[0].id);
            if (loadedCourse.lessons[0].slides.length > 0) {
              setSelectedSlideId(loadedCourse.lessons[0].slides[0].id);
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

  // History management
  const pushToUndo = useCallback(() => {
    if (!course) return;
    setUndoStack(prev => [...prev.slice(-19), course]);
    setRedoStack([]);
  }, [course]);

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
    setCourse(prev => prev ? ({
      ...prev,
      title,
      updatedAt: new Date(),
    }) : null);
    toast.success('Название курса обновлено');
  };

  // Lesson operations
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const lesson = course?.lessons.find(l => l.id === lessonId);
    if (lesson?.slides[0]) {
      setSelectedSlideId(lesson.slides[0].id);
    } else {
      setSelectedSlideId(null);
    }
  };

  const handleAddLesson = () => {
    if (!course) return;
    pushToUndo();
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      courseId: course.id,
      title: `Новый урок ${course.lessons.length + 1}`,
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
    setSelectedSlideId(null);
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

  // Slide operations
  const handleSelectSlide = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  const handleAddSlide = (type: SlideType) => {
    if (!selectedLessonId || !course) {
      toast.error('Сначала выберите урок');
      return;
    }
    pushToUndo();
    
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      lessonId: selectedLessonId,
      type,
      order: selectedLesson?.slides.length || 0 + 1,
      content: '',
      options: ['single_choice', 'multiple_choice'].includes(type) ? [
        { id: 'opt-1', text: 'Вариант 1', isCorrect: true },
        { id: 'opt-2', text: 'Вариант 2', isCorrect: false },
        { id: 'opt-3', text: 'Вариант 3', isCorrect: false },
      ] : undefined,
      correctAnswer: type === 'true_false' ? true : undefined,
      explanation: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank'].includes(type) 
        ? '' 
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson =>
        lesson.id === selectedLessonId
          ? { ...lesson, slides: [...lesson.slides, newSlide], updatedAt: new Date() }
          : lesson
      ),
      updatedAt: new Date(),
    }) : null);
    setSelectedSlideId(newSlide.id);
    toast.success('Слайд добавлен');
  };

  const handleUpdateSlide = (slideId: string, updates: Partial<Slide>) => {
    if (!course) return;
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => ({
        ...lesson,
        slides: lesson.slides.map(slide =>
          slide.id === slideId
            ? { ...slide, ...updates, updatedAt: new Date() }
            : slide
        ),
      })),
      updatedAt: new Date(),
    }) : null);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!course) return;
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => ({
        ...lesson,
        slides: lesson.slides.filter(s => s.id !== slideId),
      })),
      updatedAt: new Date(),
    }) : null);
    if (selectedSlideId === slideId) {
      setSelectedSlideId(null);
    }
    toast.success('Слайд удалён');
  };

  const handleImproveSlide = (slideId: string, action: 'improve' | 'simplify' | 'harder') => {
    toast.info(`AI ${action === 'improve' ? 'улучшает' : action === 'simplify' ? 'упрощает' : 'усложняет'} слайд...`);
    setTimeout(() => {
      toast.success('Слайд обновлён!');
    }, 1500);
  };

  // Reorder lessons via drag-and-drop
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
    toast.success('Порядок уроков обновлён');
  };

  // Reorder slides via drag-and-drop
  const handleReorderSlides = (activeId: string, overId: string) => {
    if (!selectedLessonId || !course) return;
    pushToUndo();
    setCourse(prev => prev ? ({
      ...prev,
      lessons: prev.lessons.map(lesson => {
        if (lesson.id !== selectedLessonId) return lesson;
        const oldIndex = lesson.slides.findIndex(s => s.id === activeId);
        const newIndex = lesson.slides.findIndex(s => s.id === overId);
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
    toast.success('Порядок слайдов обновлён');
  };

  const handleSave = async () => {
    if (!course) return;
    setIsSaving(true);
    const success = await saveCourse(course);
    setIsSaving(false);
    if (success) {
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader
        course={course}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        isSaving={isSaving}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPreview={() => setIsPreviewMode(true)}
        onPublish={handlePublish}
        onSave={handleSave}
        onUpdateTitle={handleUpdateTitle}
        onBack={() => navigate('/')}
      />

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Lessons sidebar */}
        <div className="w-72 flex-shrink-0">
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

        {/* Slides editor */}
        <div className="flex-1">
          <SlideEditor
            slides={selectedLesson?.slides || []}
            selectedSlideId={selectedSlideId}
            onSelectSlide={handleSelectSlide}
            onUpdateSlide={handleUpdateSlide}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onImproveSlide={handleImproveSlide}
            onReorderSlides={handleReorderSlides}
          />
        </div>
      </div>

      {/* AI Chat */}
      <EditorAIChat
        course={course}
        selectedLesson={selectedLesson || null}
        selectedSlide={selectedLesson?.slides.find(s => s.id === selectedSlideId) || null}
        onUpdateCourse={(updates) => setCourse(prev => prev ? ({ ...prev, ...updates }) : null)}
        onUpdateSlide={handleUpdateSlide}
        onAddLesson={(lesson) => {
          if (!course) return;
          const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            courseId: course.id,
            title: lesson.title || 'Новый урок',
            description: lesson.description || '',
            order: course.lessons.length + 1,
            slides: [],
            estimatedMinutes: lesson.estimatedMinutes || 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setCourse(prev => prev ? ({
            ...prev,
            lessons: [...prev.lessons, newLesson],
          }) : null);
        }}
      />
    </div>
  );
};

export default Editor;

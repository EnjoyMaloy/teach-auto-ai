import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
import { Course, Lesson, Slide, SlideType } from '@/types/course';
import { generateMockLessons, mockCourse } from '@/lib/mockData';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { LessonsList } from '@/components/editor/LessonsList';
import { SlideEditor } from '@/components/editor/SlideEditor';
import { CoursePlayer } from '@/components/runtime/CoursePlayer';
import { EditorAIChat } from '@/components/editor/EditorAIChat';
import { toast } from 'sonner';

const Editor: React.FC = () => {
  const { courseId } = useParams();

  // Initialize course with mock data
  const [course, setCourse] = useState<Course>(() => ({
    ...mockCourse,
    id: courseId || 'course-1',
    lessons: generateMockLessons(courseId || 'course-1'),
  }));

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    course.lessons[0]?.id || null
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    course.lessons[0]?.slides[0]?.id || null
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [undoStack, setUndoStack] = useState<Course[]>([]);
  const [redoStack, setRedoStack] = useState<Course[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedLesson = course.lessons.find(l => l.id === selectedLessonId);

  // History management
  const pushToUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), course]);
    setRedoStack([]);
  }, [course]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, course]);
    setUndoStack(prev => prev.slice(0, -1));
    setCourse(previous);
  }, [undoStack, course]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, course]);
    setRedoStack(prev => prev.slice(0, -1));
    setCourse(next);
  }, [redoStack, course]);

  // Course title update
  const handleUpdateTitle = (title: string) => {
    pushToUndo();
    setCourse(prev => ({
      ...prev,
      title,
      updatedAt: new Date(),
    }));
    toast.success('Название курса обновлено');
  };

  // Lesson operations
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (lesson?.slides[0]) {
      setSelectedSlideId(lesson.slides[0].id);
    } else {
      setSelectedSlideId(null);
    }
  };

  const handleAddLesson = () => {
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
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
      updatedAt: new Date(),
    }));
    setSelectedLessonId(newLesson.id);
    setSelectedSlideId(null);
    toast.success('Урок добавлен');
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (course.lessons.length <= 1) {
      toast.error('Нельзя удалить единственный урок');
      return;
    }
    pushToUndo();
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.filter(l => l.id !== lessonId),
      updatedAt: new Date(),
    }));
    if (selectedLessonId === lessonId) {
      const remaining = course.lessons.filter(l => l.id !== lessonId);
      setSelectedLessonId(remaining[0]?.id || null);
    }
    toast.success('Урок удалён');
  };

  const handleDuplicateLesson = (lessonId: string) => {
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
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
      updatedAt: new Date(),
    }));
    toast.success('Урок скопирован');
  };

  // Slide operations
  const handleSelectSlide = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  const handleAddSlide = (type: SlideType) => {
    if (!selectedLessonId) {
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

    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson =>
        lesson.id === selectedLessonId
          ? { ...lesson, slides: [...lesson.slides, newSlide], updatedAt: new Date() }
          : lesson
      ),
      updatedAt: new Date(),
    }));
    setSelectedSlideId(newSlide.id);
    toast.success('Слайд добавлен');
  };

  const handleUpdateSlide = (slideId: string, updates: Partial<Slide>) => {
    pushToUndo();
    setCourse(prev => ({
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
    }));
  };

  const handleDeleteSlide = (slideId: string) => {
    pushToUndo();
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => ({
        ...lesson,
        slides: lesson.slides.filter(s => s.id !== slideId),
      })),
      updatedAt: new Date(),
    }));
    if (selectedSlideId === slideId) {
      setSelectedSlideId(null);
    }
    toast.success('Слайд удалён');
  };

  const handleImproveSlide = (slideId: string, action: 'improve' | 'simplify' | 'harder') => {
    toast.info(`AI ${action === 'improve' ? 'улучшает' : action === 'simplify' ? 'упрощает' : 'усложняет'} слайд...`);
    // In real app, this would call AI API
    setTimeout(() => {
      toast.success('Слайд обновлён!');
    }, 1500);
  };

  // Reorder lessons via drag-and-drop
  const handleReorderLessons = (activeId: string, overId: string) => {
    pushToUndo();
    setCourse(prev => {
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
    if (!selectedLessonId) return;
    pushToUndo();
    setCourse(prev => ({
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
    }));
    toast.success('Порядок слайдов обновлён');
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Курс сохранён');
  };

  const handlePublish = () => {
    setCourse(prev => ({
      ...prev,
      isPublished: true,
      publishedAt: new Date(),
    }));
  };

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
        onUpdateCourse={(updates) => setCourse(prev => ({ ...prev, ...updates }))}
        onUpdateSlide={handleUpdateSlide}
        onAddLesson={(lesson) => {
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
          setCourse(prev => ({
            ...prev,
            lessons: [...prev.lessons, newLesson],
          }));
        }}
      />
    </div>
  );
};

export default Editor;
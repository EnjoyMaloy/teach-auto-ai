// Core entities for the course platform

export type SlideType = 
  | 'text' 
  | 'image_text' 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'true_false' 
  | 'fill_blank';

export interface SlideHint {
  id: string;
  text: string;
  order: number;
}

export interface SlideOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Slide {
  id: string;
  lessonId: string;
  type: SlideType;
  order: number;
  content: string;
  imageUrl?: string;
  options?: SlideOption[];
  correctAnswer?: string | string[] | boolean;
  explanation?: string;
  hints?: SlideHint[];
  blankWord?: string; // For fill_blank type
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  slides: Slide[];
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseVersion {
  id: string;
  courseId: string;
  version: number;
  lessons: Lesson[];
  changelog?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  coverImage?: string;
  targetAudience: string;
  estimatedMinutes: number;
  lessons: Lesson[];
  currentVersion: number;
  versions: CourseVersion[];
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'creator' | 'learner' | 'admin';
  createdAt: Date;
}

// Analytics types
export interface SlideAnalytics {
  slideId: string;
  lessonId: string;
  courseId: string;
  userId: string;
  timeSpentSeconds: number;
  attempts: number;
  isCorrect?: boolean;
  answeredAt: Date;
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  currentLessonId: string;
  currentSlideId: string;
  completedSlides: string[];
  correctAnswers: number;
  totalAnswers: number;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
}

// AI Generation types
export type AIAgentRole = 'planner' | 'builder' | 'reviewer';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  agentRole?: AIAgentRole;
  content: string;
  timestamp: Date;
  metadata?: {
    courseStructure?: CourseStructure;
    generatedLessons?: Lesson[];
    suggestions?: string[];
  };
}

export interface CourseStructure {
  title: string;
  description: string;
  targetAudience: string;
  estimatedMinutes: number;
  lessons: {
    title: string;
    description: string;
    slidesCount: number;
    slideTypes: SlideType[];
  }[];
}

// Editor state
export interface EditorState {
  selectedLessonId: string | null;
  selectedSlideId: string | null;
  isPreviewMode: boolean;
  undoStack: Course[];
  redoStack: Course[];
  isSaving: boolean;
}

import { Course, Lesson, Slide, User, CourseProgress, AIMessage } from '@/types/course';

// Mock user
export const mockUser: User = {
  id: 'user-1',
  email: 'creator@learnforge.ai',
  name: 'Alex Creator',
  role: 'creator',
  createdAt: new Date(),
};

// Mock course data
export const mockCourse: Course = {
  id: 'course-1',
  title: 'DeFi для начинающих',
  description: 'Изучите основы децентрализованных финансов за 10 минут',
  authorId: 'user-1',
  targetAudience: 'Новички в криптовалютах',
  estimatedMinutes: 10,
  lessons: [],
  currentVersion: 1,
  versions: [],
  isPublished: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['DeFi', 'crypto', 'beginner'],
};

// Generate mock slides for a lesson
export const generateMockSlides = (lessonId: string): Slide[] => [
  {
    id: `slide-${lessonId}-1`,
    lessonId,
    type: 'text',
    order: 1,
    content: 'DeFi — это финансовые сервисы без банков и посредников. Всё работает на блокчейне.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `slide-${lessonId}-2`,
    lessonId,
    type: 'image_text',
    order: 2,
    content: 'Традиционные финансы vs DeFi: в чём разница?',
    imageUrl: '/placeholder.svg',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `slide-${lessonId}-3`,
    lessonId,
    type: 'single_choice',
    order: 3,
    content: 'Что НЕ является примером DeFi?',
    options: [
      { id: 'opt-1', text: 'Обмен токенов на Uniswap', isCorrect: false },
      { id: 'opt-2', text: 'Кредит в Сбербанке', isCorrect: true },
      { id: 'opt-3', text: 'Стейкинг криптовалюты', isCorrect: false },
      { id: 'opt-4', text: 'Lending на Aave', isCorrect: false },
    ],
    correctAnswer: 'opt-2',
    explanation: 'Сбербанк — это традиционный банк, а не DeFi-сервис.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `slide-${lessonId}-4`,
    lessonId,
    type: 'true_false',
    order: 4,
    content: 'DeFi работает 24/7 без выходных и праздников.',
    correctAnswer: true,
    explanation: 'Верно! В отличие от банков, DeFi-протоколы работают круглосуточно.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: `slide-${lessonId}-5`,
    lessonId,
    type: 'fill_blank',
    order: 5,
    content: 'Главная технология DeFi — это ___.',
    blankWord: 'блокчейн',
    correctAnswer: 'блокчейн',
    explanation: 'Блокчейн обеспечивает прозрачность и безопасность DeFi.',
    hints: [{ id: 'hint-1', text: 'Это распределённый реестр', order: 1 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Generate mock lessons
export const generateMockLessons = (courseId: string): Lesson[] => {
  const lessons: Lesson[] = [
    {
      id: 'lesson-1',
      courseId,
      title: 'Что такое DeFi?',
      description: 'Базовые понятия децентрализованных финансов',
      order: 1,
      slides: [],
      estimatedMinutes: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'lesson-2',
      courseId,
      title: 'Основные протоколы',
      description: 'Uniswap, Aave, Compound и другие',
      order: 2,
      slides: [],
      estimatedMinutes: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'lesson-3',
      courseId,
      title: 'Риски и безопасность',
      description: 'Как защитить свои активы',
      order: 3,
      slides: [],
      estimatedMinutes: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return lessons.map(lesson => ({
    ...lesson,
    slides: generateMockSlides(lesson.id),
  }));
};

// Initial AI conversation
export const initialAIMessages: AIMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    agentRole: 'planner',
    content: 'Привет! 👋 Я помогу создать интерактивный курс. Просто опишите тему, аудиторию и желаемую длительность.\n\nНапример: "Сделай курс про DeFi для новичков на 10 минут"',
    timestamp: new Date(),
  },
];

// Mock course progress
export const mockCourseProgress: CourseProgress = {
  id: 'progress-1',
  userId: 'user-1',
  courseId: 'course-1',
  currentLessonId: 'lesson-1',
  currentSlideId: 'slide-lesson-1-1',
  completedSlides: [],
  correctAnswers: 0,
  totalAnswers: 0,
  startedAt: new Date(),
  lastActivityAt: new Date(),
};

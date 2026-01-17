export type Language = 'ru' | 'en';

export const translations = {
  ru: {
    // Header
    searchPlaceholder: 'Найти курс',
    profile: 'Профиль',
    logout: 'Выход',
    courseAuthor: 'Автор курсов',
    
    // Sidebar
    myCourses: 'Мои курсы',
    catalog: 'Каталог',
    analytics: 'Аналитика',
    settings: 'Настройки',
    
    // Dashboard
    createCourse: 'Создать курс',
    editCourse: 'Редактировать',
    deleteCourse: 'Удалить',
    publishCourse: 'Опубликовать',
    unpublishCourse: 'Снять с публикации',
    
    // Course
    lessons: 'Уроки',
    slides: 'Слайды',
    minutes: 'мин',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    back: 'Назад',
    next: 'Далее',
    finish: 'Завершить',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    
    // Auth
    signIn: 'Войти',
    signUp: 'Регистрация',
    email: 'Email',
    password: 'Пароль',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    
    // Messages
    courseCreated: 'Курс создан',
    courseSaved: 'Курс сохранен',
    courseDeleted: 'Курс удален',
    coursePublished: 'Курс опубликован',
    signedOut: 'Вы вышли из аккаунта',
  },
  en: {
    // Header
    searchPlaceholder: 'Find course',
    profile: 'Profile',
    logout: 'Logout',
    courseAuthor: 'Course Author',
    
    // Sidebar
    myCourses: 'My Courses',
    catalog: 'Catalog',
    analytics: 'Analytics',
    settings: 'Settings',
    
    // Dashboard
    createCourse: 'Create Course',
    editCourse: 'Edit',
    deleteCourse: 'Delete',
    publishCourse: 'Publish',
    unpublishCourse: 'Unpublish',
    
    // Course
    lessons: 'Lessons',
    slides: 'Slides',
    minutes: 'min',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    
    // Messages
    courseCreated: 'Course created',
    courseSaved: 'Course saved',
    courseDeleted: 'Course deleted',
    coursePublished: 'Course published',
    signedOut: 'You have been signed out',
  },
} as const;

export type TranslationKey = keyof typeof translations.ru;

export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations.ru[key] || key;
}

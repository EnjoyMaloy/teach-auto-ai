import { Heart, Dumbbell, Brain, Briefcase, Palette, Languages, Book, Sparkles, LucideIcon } from 'lucide-react';

export interface CourseCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: LucideIcon;
  color: string;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: 'health', name: 'Здоровье', nameEn: 'Health', icon: Heart, color: 'hsl(0, 80%, 92%)' },
  { id: 'sports', name: 'Спорт', nameEn: 'Sports', icon: Dumbbell, color: 'hsl(200, 80%, 92%)' },
  { id: 'psychology', name: 'Психология', nameEn: 'Psychology', icon: Brain, color: 'hsl(280, 80%, 92%)' },
  { id: 'business', name: 'Бизнес', nameEn: 'Business', icon: Briefcase, color: 'hsl(35, 80%, 92%)' },
  { id: 'creativity', name: 'Творчество', nameEn: 'Creativity', icon: Palette, color: 'hsl(320, 80%, 92%)' },
  { id: 'languages', name: 'Языки', nameEn: 'Languages', icon: Languages, color: 'hsl(160, 80%, 92%)' },
  { id: 'education', name: 'Образование', nameEn: 'Education', icon: Book, color: 'hsl(220, 80%, 92%)' },
  { id: 'lifestyle', name: 'Лайфстайл', nameEn: 'Lifestyle', icon: Sparkles, color: 'hsl(50, 80%, 92%)' },
];

export function getCategoryById(id: string): CourseCategory | undefined {
  return COURSE_CATEGORIES.find(c => c.id === id);
}

export function getCategoryName(id: string, language: string = 'ru'): string {
  const category = getCategoryById(id);
  if (!category) return id;
  return language === 'en' ? category.nameEn : category.name;
}

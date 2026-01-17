import { Bitcoin, Wallet, TrendingUp, Shield, Coins, GraduationCap, LucideIcon } from 'lucide-react';

export interface CourseCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: LucideIcon;
  color: string;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: 'crypto-basics', name: 'Основы крипты', nameEn: 'Crypto Basics', icon: Bitcoin, color: '#FFB09E' },
  { id: 'defi', name: 'DeFi', nameEn: 'DeFi', icon: Coins, color: '#D9C0FF' },
  { id: 'trading', name: 'Трейдинг', nameEn: 'Trading', icon: TrendingUp, color: '#C2F4E8' },
  { id: 'security', name: 'Безопасность', nameEn: 'Security', icon: Shield, color: '#FFF7AC' },
  { id: 'wallets', name: 'Кошельки', nameEn: 'Wallets', icon: Wallet, color: '#FDC0DD' },
  { id: 'advanced', name: 'Продвинутый', nameEn: 'Advanced', icon: GraduationCap, color: '#CDF3FF' },
];

export function getCategoryById(id: string): CourseCategory | undefined {
  return COURSE_CATEGORIES.find(c => c.id === id);
}

export function getCategoryName(id: string, language: string = 'ru'): string {
  const category = getCategoryById(id);
  if (!category) return id;
  return language === 'en' ? category.nameEn : category.name;
}

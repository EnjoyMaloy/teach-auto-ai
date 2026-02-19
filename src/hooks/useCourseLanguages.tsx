import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CourseLanguage {
  id: string;
  course_id: string;
  language_code: string;
  is_primary: boolean;
  created_at: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
];

export const getLanguageInfo = (code: string) =>
  SUPPORTED_LANGUAGES.find(l => l.code === code) || { code, name: code.toUpperCase(), flag: '🌐' };

export const useCourseLanguages = (courseId: string | undefined) => {
  const [languages, setLanguages] = useState<CourseLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const fetchLanguages = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('course_languages')
      .select('*')
      .eq('course_id', courseId)
      .order('is_primary', { ascending: false });

    if (!error && data) {
      setLanguages(data as CourseLanguage[]);
    }
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const primaryLanguage = languages.find(l => l.is_primary)?.language_code || null;
  const translationLanguages = languages.filter(l => !l.is_primary).map(l => l.language_code);

  const setPrimaryLanguage = useCallback(async (langCode: string) => {
    if (!courseId) return;

    // Remove old primary
    const oldPrimary = languages.find(l => l.is_primary);
    if (oldPrimary) {
      await supabase.from('course_languages').update({ is_primary: false }).eq('id', oldPrimary.id);
    }

    // Upsert new primary
    await supabase.from('course_languages').upsert({
      course_id: courseId,
      language_code: langCode,
      is_primary: true,
    }, { onConflict: 'course_id,language_code' });

    await fetchLanguages();
  }, [courseId, languages, fetchLanguages]);

  const addLanguage = useCallback(async (langCode: string) => {
    if (!courseId) return;
    const { error } = await supabase.from('course_languages').upsert({
      course_id: courseId,
      language_code: langCode,
      is_primary: false,
    }, { onConflict: 'course_id,language_code' });

    if (error) {
      toast.error('Ошибка добавления языка');
    } else {
      await fetchLanguages();
    }
  }, [courseId, fetchLanguages]);

  const removeLanguage = useCallback(async (langCode: string) => {
    if (!courseId) return;
    await supabase.from('course_languages')
      .delete()
      .eq('course_id', courseId)
      .eq('language_code', langCode);
    await fetchLanguages();
  }, [courseId, fetchLanguages]);

  const translateCourse = useCallback(async () => {
    if (!courseId || !primaryLanguage || translationLanguages.length === 0) return;

    setIsTranslating(true);
    try {
      // Translate one language at a time to avoid edge function timeouts
      const results: Record<string, any> = {};
      
      for (const targetLang of translationLanguages) {
        try {
          const { data, error } = await supabase.functions.invoke('translate-course', {
            body: {
              course_id: courseId,
              source_language: primaryLanguage,
              target_languages: [targetLang],
            },
          });

          if (error) {
            console.error(`Translation error for ${targetLang}:`, error);
            continue;
          }

          if (data?.results) {
            Object.assign(results, data.results);
          }
        } catch (e) {
          console.error(`Translation failed for ${targetLang}:`, e);
        }
      }

      const summary = Object.entries(results)
        .map(([lang, r]: [string, any]) => `${getLanguageInfo(lang).flag} ${r.lessons}/${r.slides}`)
        .join(', ');

      if (summary) {
        toast.success(`Перевод завершён: ${summary}`);
      } else {
        toast.error('Не удалось перевести ни на один язык');
      }
    } catch (e) {
      console.error('Translation error:', e);
      toast.error('Ошибка перевода');
    } finally {
      setIsTranslating(false);
    }
  }, [courseId, primaryLanguage, translationLanguages]);

  return {
    languages,
    primaryLanguage,
    translationLanguages,
    isLoading,
    isTranslating,
    setPrimaryLanguage,
    addLanguage,
    removeLanguage,
    translateCourse,
    refetch: fetchLanguages,
  };
};

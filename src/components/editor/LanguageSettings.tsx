import React from 'react';
import { Globe, Plus, X, Loader2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useCourseLanguages,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
} from '@/hooks/useCourseLanguages';

interface LanguageSettingsProps {
  courseId: string;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({ courseId }) => {
  const {
    languages,
    primaryLanguage,
    translationLanguages,
    isLoading,
    isTranslating,
    setPrimaryLanguage,
    addLanguage,
    removeLanguage,
    translateCourse,
  } = useCourseLanguages(courseId);

  const usedCodes = languages.map(l => l.language_code);
  const availableLanguages = SUPPORTED_LANGUAGES.filter(l => !usedCodes.includes(l.code));

  return (
    <div className="space-y-4">
      {/* Primary language */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Основной язык</label>
        <Select value={primaryLanguage || ''} onValueChange={setPrimaryLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите основной язык" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Translation languages */}
      {primaryLanguage && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Языки перевода</label>
          
          <div className="flex flex-wrap gap-2">
            {translationLanguages.map(code => {
              const info = getLanguageInfo(code);
              return (
                <Badge
                  key={code}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span>{info.flag}</span>
                  <span>{info.name}</span>
                  <button
                    onClick={() => removeLanguage(code)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>

          {availableLanguages.length > 0 && (
            <Select onValueChange={addLanguage} value="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Добавить язык перевода..." />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages
                  .filter(l => l.code !== primaryLanguage)
                  .map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Translate button */}
      {primaryLanguage && translationLanguages.length > 0 && (
        <Button
          onClick={translateCourse}
          disabled={isTranslating}
          className="w-full"
          variant="outline"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Переводим...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4 mr-2" />
              Перевести на все языки
            </>
          )}
        </Button>
      )}
    </div>
  );
};

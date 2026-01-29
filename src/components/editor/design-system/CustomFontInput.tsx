import React, { useState } from 'react';
import { CustomFont } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Link2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CustomFontInputProps {
  customFonts: CustomFont[];
  onChange: (fonts: CustomFont[]) => void;
}

// Parse Google Fonts URL to extract font name
// Supports formats:
// - https://fonts.google.com/specimen/Montserrat
// - https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap
// - Just the font name: "Montserrat"
const parseGoogleFontsInput = (input: string): { name: string; family: string; url: string } | null => {
  const trimmed = input.trim();
  
  if (!trimmed) return null;
  
  // Pattern 1: Google Fonts specimen URL
  const specimenMatch = trimmed.match(/fonts\.google\.com\/specimen\/([^/?]+)/);
  if (specimenMatch) {
    const fontName = decodeURIComponent(specimenMatch[1].replace(/\+/g, ' '));
    return {
      name: fontName,
      family: `"${fontName}", sans-serif`,
      url: `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`,
    };
  }
  
  // Pattern 2: Google Fonts CSS URL
  const cssMatch = trimmed.match(/fonts\.googleapis\.com\/css2?\?family=([^:&]+)/);
  if (cssMatch) {
    const fontName = decodeURIComponent(cssMatch[1].replace(/\+/g, ' '));
    return {
      name: fontName,
      family: `"${fontName}", sans-serif`,
      url: trimmed.includes('display=') ? trimmed : `${trimmed}&display=swap`,
    };
  }
  
  // Pattern 3: Just font name (assume it exists on Google Fonts)
  if (!trimmed.includes('http') && !trimmed.includes('/')) {
    const fontName = trimmed;
    return {
      name: fontName,
      family: `"${fontName}", sans-serif`,
      url: `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`,
    };
  }
  
  return null;
};

// Load a Google Font dynamically
const loadGoogleFont = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Failed to load font'));
    document.head.appendChild(link);
  });
};

export const CustomFontInput: React.FC<CustomFontInputProps> = ({
  customFonts,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleAddFont = async () => {
    const parsed = parseGoogleFontsInput(inputValue);
    
    if (!parsed) {
      toast({
        title: 'Неверный формат',
        description: 'Вставьте ссылку с fonts.google.com или название шрифта',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if font already exists
    if (customFonts.some(f => f.name.toLowerCase() === parsed.name.toLowerCase())) {
      toast({
        title: 'Шрифт уже добавлен',
        description: `"${parsed.name}" уже есть в списке`,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Try to load the font to verify it exists
      await loadGoogleFont(parsed.url);
      
      onChange([...customFonts, parsed]);
      setInputValue('');
      setShowInput(false);
      
      toast({
        title: 'Шрифт добавлен',
        description: `"${parsed.name}" успешно загружен`,
      });
    } catch {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить шрифт. Проверьте название.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFont = (fontName: string) => {
    onChange(customFonts.filter(f => f.name !== fontName));
  };

  return (
    <div className="space-y-3">
      {/* Existing custom fonts */}
      {customFonts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Добавленные шрифты</Label>
          <div className="flex flex-wrap gap-2">
            {customFonts.map((font) => (
              <div
                key={font.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border group"
              >
                <span 
                  className="text-sm font-medium"
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFont(font.name)}
                  className="w-4 h-4 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить шрифт"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add new font */}
      {showInput ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Вставьте ссылку с fonts.google.com или название шрифта
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Montserrat или fonts.google.com/..."
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFont();
                  }
                  if (e.key === 'Escape') {
                    setShowInput(false);
                    setInputValue('');
                  }
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleAddFont}
              disabled={isLoading || !inputValue.trim()}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowInput(false);
                setInputValue('');
              }}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Добавить шрифт из Google Fonts
        </Button>
      )}
    </div>
  );
};

// Hook to load custom fonts on mount
export const useLoadCustomFonts = (customFonts: CustomFont[] = []) => {
  React.useEffect(() => {
    customFonts.forEach((font) => {
      loadGoogleFont(font.url).catch(console.error);
    });
  }, [customFonts]);
};

import React, { useState } from 'react';
import { CustomFont, FONT_OPTIONS } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Check, Loader2, Link2, Trash2, HelpCircle, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FontSelectorWithCustomProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  customFonts: CustomFont[];
  onCustomFontsChange: (fonts: CustomFont[]) => void;
  /** Called when both font and customFonts need to update together */
  onAddCustomFont?: (font: CustomFont, selectIt: boolean) => void;
  previewText?: string;
  previewClassName?: string;
}

// Parse Google Fonts URL to extract font name
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

export const FontSelectorWithCustom: React.FC<FontSelectorWithCustomProps> = ({
  label,
  description,
  value,
  onChange,
  customFonts,
  onCustomFontsChange,
  onAddCustomFont,
  previewText,
  previewClassName = '',
}) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Check if current value is a custom font
  const currentCustomFont = customFonts.find(f => f.family === value);
  const currentStandardFont = FONT_OPTIONS.find(f => f.value === value);
  const displayLabel = currentCustomFont?.name || currentStandardFont?.label || 'Выберите шрифт';

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
      // Font exists, just select it
      onChange(parsed.family);
      setInputValue('');
      setShowAddInput(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      await loadGoogleFont(parsed.url);
      
      // Use combined update if available, otherwise fall back to separate updates
      if (onAddCustomFont) {
        onAddCustomFont(parsed, true);
      } else {
        const newFonts = [...customFonts, parsed];
        onCustomFontsChange(newFonts);
        // Use setTimeout to ensure state update happens first
        setTimeout(() => {
          onChange(parsed.family);
        }, 0);
      }
      
      setInputValue('');
      setShowAddInput(false);
      
      toast({
        title: 'Шрифт добавлен',
        description: `"${parsed.name}" успешно загружен и выбран`,
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

  const handleRemoveCustomFont = (fontFamily: string) => {
    const newFonts = customFonts.filter(f => f.family !== fontFamily);
    onCustomFontsChange(newFonts);
    
    // If removed font was selected, reset to default
    if (value === fontFamily) {
      onChange(FONT_OPTIONS[0].value);
    }
  };

  return (
    <div className="space-y-3">
      {/* Only show label/description if provided */}
      {(label || description) && (
        <div>
          {label && <Label className="text-sm font-medium">{label}</Label>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-12">
          <div className="flex items-center justify-between w-full">
            <span style={{ fontFamily: value }} className="text-base">
              {currentCustomFont ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-primary font-medium">Свой:</span>
                  {currentCustomFont.name}
                </span>
              ) : displayLabel}
            </span>
            <span style={{ fontFamily: value }} className="text-muted-foreground text-sm">
              Аа Bb
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {/* Custom fonts section */}
          {customFonts.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                Свои шрифты
              </div>
              {customFonts.map((font) => (
                <div key={font.family} className="relative group">
                  <SelectItem 
                    value={font.family}
                    className="py-3 pr-10"
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span style={{ fontFamily: font.family }} className="text-base">
                        {font.name}
                      </span>
                      <span style={{ fontFamily: font.family }} className="text-muted-foreground text-lg">
                        Аа Bb
                      </span>
                    </div>
                  </SelectItem>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveCustomFont(font.family);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Удалить шрифт"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium border-t mt-1 pt-2">
                Стандартные
              </div>
            </>
          )}
          {FONT_OPTIONS.map((font) => (
            <SelectItem 
              key={font.value} 
              value={font.value}
              className="py-3"
            >
              <div className="flex items-center justify-between w-full gap-4">
                <span style={{ fontFamily: font.value }} className="text-base">
                  {font.label}
                </span>
                <span style={{ fontFamily: font.value }} className="text-muted-foreground text-lg">
                  Аа Bb
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Add custom font section */}
      {showAddInput ? (
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
          <Label className="text-xs text-muted-foreground">
            Название шрифта или ссылка с Google Fonts
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
                    setShowAddInput(false);
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
                setShowAddInput(false);
                setInputValue('');
              }}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Guide */}
          <Collapsible open={showGuide} onOpenChange={setShowGuide}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground hover:text-foreground text-xs"
              >
                <HelpCircle className="w-3 h-3" />
                {showGuide ? 'Скрыть подсказку' : 'Как добавить?'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-lg border border-border bg-background p-3 space-y-2 text-xs">
                <p className="text-muted-foreground">
                  Введите название шрифта (<code className="px-1 py-0.5 rounded bg-muted">Montserrat</code>) или вставьте ссылку с{' '}
                  <a 
                    href="https://fonts.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    fonts.google.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddInput(true)}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Добавить свой шрифт
        </Button>
      )}

      {/* Preview */}
      {previewText && (
        <div 
          className={cn("p-3 rounded-lg border bg-muted/30", previewClassName)}
          style={{ fontFamily: value }}
        >
          {previewText}
        </div>
      )}
    </div>
  );
};

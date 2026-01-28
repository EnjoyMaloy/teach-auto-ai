import React, { useState } from 'react';
import { 
  DesignSystemConfig, 
  DEFAULT_DESIGN_SYSTEM,
  DEFAULT_SOUND_SETTINGS,
  DEFAULT_DESIGN_BLOCK_SETTINGS,
  DEFAULT_MASCOT_SETTINGS,
  BASE_THEMES,
  ThemePreset,
  FONT_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  SoundTheme,
  ButtonDepth,
  BackgroundType,
  BACKGROUND_PRESETS,
  BackgroundPreset
} from '@/types/designSystem';
import { playSound, SOUND_THEME_OPTIONS } from '@/lib/sounds';
import { BaseDesignSystemSelector } from './BaseDesignSystemSelector';
import { useBaseDesignSystems, BaseDesignSystem } from '@/hooks/useBaseDesignSystems';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Type, 
  Square, 
  Sparkles,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  Layers,
  Bot,
  Lock,
  Unlock,
  ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Play,
  Loader2,
  Link2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DesignSystemEditorProps {
  config: DesignSystemConfig;
  onChange: (config: DesignSystemConfig) => void;
  isAdmin?: boolean;
  selectedBaseSystemId?: string | null;
  onBaseSystemSelect?: (id: string | null) => void;
}

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}> = ({ label, value, onChange, description }) => {
  // Convert HSL string to hex for display
  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
      const sNorm = s / 100;
      const lNorm = l / 100;
      
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = lNorm - c / 2;
      
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
      return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    } catch {
      return '6366F1';
    }
  };
  
  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    try {
      // Remove # if present
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
      const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
      const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return value;
    }
  };

  const [hexValue, setHexValue] = React.useState(hslToHex(value));
  const [isFocused, setIsFocused] = React.useState(false);

  // Update hex when value prop changes (from outside)
  React.useEffect(() => {
    if (!isFocused) {
      setHexValue(hslToHex(value));
    }
  }, [value, isFocused]);

  const handleHexChange = (newHex: string) => {
    // Remove any non-hex characters except #
    const cleaned = newHex.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexValue(cleaned.toUpperCase());
    
    // Only convert to HSL if we have a valid 6-char hex
    if (cleaned.length === 6) {
      onChange(hexToHsl(cleaned));
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.replace('#', '').toUpperCase();
    setHexValue(hex);
    onChange(hexToHsl(hex));
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-xl border-2 border-border overflow-hidden cursor-pointer relative flex-shrink-0 shadow-sm hover:border-primary/50 transition-colors"
          style={{ backgroundColor: `hsl(${value})` }}
        >
          <input
            type="color"
            value={`#${hslToHex(value)}`}
            onChange={handleColorPickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">#</span>
          <Input
            value={hexValue}
            onChange={(e) => handleHexChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-7 font-mono text-sm uppercase tracking-wider bg-background"
            placeholder="FFFFFF"
            maxLength={6}
          />
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

// Rive file uploader component with URL input
const RiveFileUploader: React.FC<{
  riveUrl: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}> = ({ riveUrl, onUpload, onRemove }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.riv')) {
      setError('Пожалуйста, выберите файл .riv');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('mascots')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('mascots')
        .getPublicUrl(data.path);

      onUpload(publicUrl.publicUrl);
    } catch (err) {
      console.error('Rive upload error:', err);
      setError('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlValue.trim()) {
      setError('Введите URL');
      return;
    }
    
    // Basic URL validation
    if (!urlValue.includes('.riv') && !urlValue.includes('rive.app')) {
      setError('URL должен вести на .riv файл или Rive Community');
      return;
    }

    setError(null);
    onUpload(urlValue.trim());
    setUrlValue('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Файл анимации (.riv)</Label>
      {riveUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
          <Play className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Rive-анимация подключена</p>
            <p className="text-xs text-muted-foreground truncate">{riveUrl.split('/').pop()}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* File upload option */}
          <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
            <input
              type="file"
              accept=".riv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Загрузка...' : 'Загрузить .riv файл'}
            </span>
          </label>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* URL input option */}
          {showUrlInput ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://rive.app/community/..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <Button size="sm" onClick={handleUrlSubmit}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  setShowUrlInput(false);
                  setUrlValue('');
                  setError(null);
                }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowUrlInput(true)}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Вставить URL анимации
            </Button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Найдите анимации в{' '}
        <a href="https://rive.app/community" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Rive Community
        </a>
        {' '}или создайте в{' '}
        <a href="https://rive.app" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Rive Editor
        </a>
      </p>
    </div>
  );
};

export const DesignSystemEditor: React.FC<DesignSystemEditorProps> = ({
  config,
  onChange,
  isAdmin = false,
  selectedBaseSystemId,
  onBaseSystemSelect,
}) => {
  // Initialize activePreset from config.themeId if available
  const [activePreset, setActivePreset] = useState<string | null>(config.themeId || null);
  
  // Sync activePreset with config.themeId when config changes from outside
  React.useEffect(() => {
    if (config.themeId && config.themeId !== activePreset) {
      setActivePreset(config.themeId);
    }
  }, [config.themeId]);
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundPreset[]>(() => {
    const saved = localStorage.getItem('customBackgrounds');
    return saved ? JSON.parse(saved) : [];
  });

  // Hidden built-in themes (admin can hide them)
  const [hiddenBuiltInThemes, setHiddenBuiltInThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenBuiltInThemes');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCreateBgDialogOpen, setIsCreateBgDialogOpen] = useState(false);
  const [newBgName, setNewBgName] = useState('');

  // Use only base themes (Google, Notion, Apple, Duolingo), filter out hidden ones
  const allThemes = BASE_THEMES.filter(t => !hiddenBuiltInThemes.includes(t.id));

  const updateConfig = (updates: Partial<DesignSystemConfig>) => {
    // Keep themeId and don't reset activePreset - user is just customizing within the theme
    onChange({ ...config, ...updates });
  };

  const applyPreset = (presetId: string) => {
    const preset = BASE_THEMES.find(p => p.id === presetId);
    if (preset) {
      onChange({ ...DEFAULT_DESIGN_SYSTEM, ...preset.config, themeId: presetId });
      setActivePreset(presetId);
    }
  };
  const resetToDefault = () => {
    onChange(DEFAULT_DESIGN_SYSTEM);
    setActivePreset(null);
  };

  // Hide built-in theme (admin only)
  const handleBuiltInThemeDelete = (themeId: string) => {
    const updated = [...hiddenBuiltInThemes, themeId];
    setHiddenBuiltInThemes(updated);
    localStorage.setItem('hiddenBuiltInThemes', JSON.stringify(updated));
    
    // If this theme was active, reset
    if (activePreset === themeId || config.themeId === themeId) {
      resetToDefault();
    }
  };

  // Custom background functions
  // Get theme-specific presets using themeId from config (persisted) or activePreset (local state)
  const currentThemeId = config.themeId || activePreset;
  const activeTheme = BASE_THEMES.find(t => t.id === currentThemeId);
  const themeBackgroundPresets = activeTheme?.backgroundPresets || BACKGROUND_PRESETS;
  const allBackgrounds = [...themeBackgroundPresets, ...customBackgrounds];

  const saveCustomBackgrounds = (backgrounds: BackgroundPreset[]) => {
    setCustomBackgrounds(backgrounds);
    localStorage.setItem('customBackgrounds', JSON.stringify(backgrounds));
  };

  const createCustomBackground = () => {
    if (!newBgName.trim()) return;
    
    const newBg: BackgroundPreset = {
      id: `custom-bg-${Date.now()}`,
      name: newBgName.trim(),
      type: config.backgroundType || 'solid',
      ...(config.backgroundType === 'gradient' 
        ? { 
            from: config.gradientFrom || '262 83% 95%', 
            to: config.gradientTo || '200 83% 95%', 
            angle: config.gradientAngle || 135 
          }
        : { color: config.backgroundColor }),
    };
    
    saveCustomBackgrounds([...customBackgrounds, newBg]);
    updateConfig({ backgroundPresetId: newBg.id });
    setNewBgName('');
    setIsCreateBgDialogOpen(false);
  };

  const deleteCustomBackground = (bgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customBackgrounds.filter(b => b.id !== bgId);
    saveCustomBackgrounds(updated);
    if (config.backgroundPresetId === bgId) {
      updateConfig({ backgroundPresetId: 'white' });
    }
  };

  // Handler for base system selection
  const handleBaseSystemSelect = (system: BaseDesignSystem) => {
    onChange(system.config);
    onBaseSystemSelect?.(system.id);
    setActivePreset(null);
  };

  // Check if user is restricted from editing (non-admin with selected base system)
  const isEditingRestricted = !isAdmin && !!selectedBaseSystemId;

  return (
    <div className="space-y-6">
      {/* Unified Themes Block - Base systems from DB + Preset themes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Готовые темы
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Быстрый старт с готовым дизайном</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetToDefault}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Сбросить
          </Button>
        </div>

        {/* Base design systems from database + built-in presets */}
        <BaseDesignSystemSelector
          selectedId={selectedBaseSystemId || null}
          onSelect={handleBaseSystemSelect}
          isAdmin={isAdmin}
          currentConfig={config}
          builtInThemes={allThemes}
          activePresetId={activePreset || config.themeId}
          onPresetSelect={(presetId) => {
            applyPreset(presetId);
            onBaseSystemSelect?.(null);
          }}
          onBuiltInThemeDelete={isAdmin ? handleBuiltInThemeDelete : undefined}
        />
      </div>

      {/* Show restriction message for non-admins with base system selected */}
      {isEditingRestricted && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <p className="font-medium">Базовая тема выбрана</p>
          <p className="text-xs mt-1 text-amber-600">
            Вы не можете редактировать параметры базовой темы. Выберите другую тему или попросите администратора внести изменения.
          </p>
        </div>
      )}

      {/* Create Background Preset Dialog */}
      <Dialog open={isCreateBgDialogOpen} onOpenChange={setIsCreateBgDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сохранить фон</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newBgName}
                onChange={(e) => setNewBgName(e.target.value)}
                placeholder="Например: Мой градиент"
                onKeyDown={(e) => e.key === 'Enter' && createCustomBackground()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Предпросмотр</Label>
              <div 
                className="h-16 rounded-lg border border-border"
                style={
                  config.backgroundType === 'gradient' 
                    ? { background: `linear-gradient(${config.gradientAngle || 135}deg, hsl(${config.gradientFrom || '262 83% 95%'}), hsl(${config.gradientTo || '200 83% 95%'}))` }
                    : { backgroundColor: `hsl(${config.backgroundColor})` }
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateBgDialogOpen(false);
              setNewBgName('');
            }}>
              Отмена
            </Button>
            <Button onClick={createCustomBackground} disabled={!newBgName.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Settings - disabled for non-admins with base system selected */}
      <div className={cn("space-y-4", isEditingRestricted && "opacity-50 pointer-events-none")}>
        <h3 className="font-semibold text-foreground">Детальные настройки</h3>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="w-full grid grid-cols-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="colors" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Palette className="w-3.5 h-3.5 mr-1" />
              Цвета
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Type className="w-3.5 h-3.5 mr-1" />
              Шрифты
            </TabsTrigger>
            <TabsTrigger value="shape" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Square className="w-3.5 h-3.5 mr-1" />
              Форма
            </TabsTrigger>
            <TabsTrigger value="designblock" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Layers className="w-3.5 h-3.5 mr-1" />
              Блоки
            </TabsTrigger>
            <TabsTrigger value="mascot" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Bot className="w-3.5 h-3.5 mr-1" />
              Маскот
            </TabsTrigger>
            <TabsTrigger value="sound" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Volume2 className="w-3.5 h-3.5 mr-1" />
              Звуки
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">

            <TabsContent value="colors" className="space-y-4">
              {/* Background Selector - 5 presets + custom */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Фон курса</Label>
                
                {/* Default presets */}
                <div className="grid grid-cols-5 gap-2">
                  {themeBackgroundPresets.map((preset) => {
                    const isSelected = config.backgroundPresetId === preset.id;
                    const bgStyle = preset.type === 'gradient'
                      ? { background: `linear-gradient(${preset.angle || 135}deg, hsl(${preset.from}), hsl(${preset.to}))` }
                      : { backgroundColor: `hsl(${preset.color})` };
                    
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          if (preset.type === 'gradient') {
                            updateConfig({
                              backgroundPresetId: preset.id,
                              backgroundType: 'gradient',
                              gradientFrom: preset.from,
                              gradientTo: preset.to,
                              gradientAngle: preset.angle,
                            });
                          } else {
                            updateConfig({
                              backgroundPresetId: preset.id,
                              backgroundType: 'solid',
                              backgroundColor: preset.color!,
                            });
                          }
                        }}
                        className={cn(
                          "h-14 rounded-lg border-2 transition-all flex items-end justify-center pb-1",
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                        style={bgStyle}
                        title={preset.name}
                      >
                        <span className="text-[10px] font-medium text-foreground/70 bg-white/80 px-1.5 py-0.5 rounded">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom saved backgrounds */}
                {customBackgrounds.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Сохранённые</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {customBackgrounds.map((preset) => {
                        const isSelected = config.backgroundPresetId === preset.id;
                        const bgStyle = preset.type === 'gradient' 
                          ? { background: `linear-gradient(${preset.angle || 135}deg, hsl(${preset.from}), hsl(${preset.to}))` }
                          : { backgroundColor: `hsl(${preset.color})` };
                        
                        return (
                          <div key={preset.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                if (preset.type === 'gradient') {
                                  updateConfig({
                                    backgroundPresetId: preset.id,
                                    backgroundType: 'gradient',
                                    gradientFrom: preset.from,
                                    gradientTo: preset.to,
                                    gradientAngle: preset.angle,
                                  });
                                } else {
                                  updateConfig({
                                    backgroundPresetId: preset.id,
                                    backgroundType: 'solid',
                                    backgroundColor: preset.color!,
                                  });
                                }
                              }}
                              className={cn(
                                "w-full h-14 rounded-lg border-2 transition-all flex items-end justify-center pb-1",
                                isSelected
                                  ? "border-primary ring-2 ring-primary/20"
                                  : "border-border hover:border-primary/50"
                              )}
                              style={bgStyle}
                              title={preset.name}
                            >
                              <span className="text-[10px] font-medium text-foreground/70 bg-white/80 px-1.5 py-0.5 rounded truncate max-w-full">
                                {preset.name}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteCustomBackground(preset.id, e)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Custom background option */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({ backgroundPresetId: 'custom' });
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm transition-colors border-2 text-left",
                      config.backgroundPresetId === 'custom'
                        ? "border-primary bg-primary/10"
                        : "border-dashed border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-muted-foreground">+ Свой цвет</span>
                  </button>
                </div>

                {/* Custom color inputs - show when custom is selected */}
                {config.backgroundPresetId === 'custom' && (
                  <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateConfig({ backgroundType: 'solid' })}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded text-xs transition-colors",
                          (config.backgroundType || 'solid') === 'solid'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        Сплошной
                      </button>
                      <button
                        type="button"
                        onClick={() => updateConfig({ backgroundType: 'gradient' })}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded text-xs transition-colors",
                          config.backgroundType === 'gradient'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        Градиент
                      </button>
                    </div>
                    
                    {(config.backgroundType || 'solid') === 'solid' ? (
                      <ColorInput
                        label="Цвет фона"
                        value={config.backgroundColor}
                        onChange={(v) => updateConfig({ backgroundColor: v })}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <ColorInput
                          label="Начало"
                          value={config.gradientFrom || '262 83% 95%'}
                          onChange={(v) => updateConfig({ gradientFrom: v })}
                        />
                        <ColorInput
                          label="Конец"
                          value={config.gradientTo || '200 83% 95%'}
                          onChange={(v) => updateConfig({ gradientTo: v })}
                        />
                      </div>
                    )}

                    {/* Save custom background button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsCreateBgDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Сохранить как пресет
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Основной цвет"
                  value={config.primaryColor}
                  onChange={(v) => updateConfig({ primaryColor: v })}
                  description="Цвет кнопок и акцентов"
                />
                <ColorInput
                  label="Текст на основном"
                  value={config.primaryForeground}
                  onChange={(v) => updateConfig({ primaryForeground: v })}
                  description="Цвет текста на кнопках"
                />
                <ColorInput
                  label="Текст"
                  value={config.foregroundColor}
                  onChange={(v) => updateConfig({ foregroundColor: v })}
                />
                <ColorInput
                  label="Карточки"
                  value={config.cardColor}
                  onChange={(v) => updateConfig({ cardColor: v })}
                />
                <ColorInput
                  label="Приглушённый"
                  value={config.mutedColor}
                  onChange={(v) => updateConfig({ mutedColor: v })}
                />
                <ColorInput
                  label="Успех"
                  value={config.successColor}
                  onChange={(v) => updateConfig({ successColor: v })}
                />
                <ColorInput
                  label="Ошибка"
                  value={config.destructiveColor}
                  onChange={(v) => updateConfig({ destructiveColor: v })}
                />
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Основной шрифт</Label>
                  <Select
                    value={config.fontFamily}
                    onValueChange={(v) => updateConfig({ fontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Шрифт заголовков</Label>
                  <Select
                    value={config.headingFontFamily}
                    onValueChange={(v) => updateConfig({ headingFontFamily: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shape" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Скругление углов</Label>
                  <Select
                    value={config.borderRadius}
                    onValueChange={(v) => updateConfig({ borderRadius: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BORDER_RADIUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Стиль кнопок</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'rounded', label: 'Скруглённые' },
                      { value: 'pill', label: 'Пилюля' },
                      { value: 'square', label: 'Квадратные' },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => updateConfig({ buttonStyle: style.value as any })}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                          config.buttonStyle === style.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Объём кнопок</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'flat', label: 'Плоские', description: 'Минималистичный стиль' },
                      { value: 'raised', label: 'Объёмные', description: 'С тенью и эффектом 3D' },
                    ].map((depth) => (
                      <button
                        key={depth.value}
                        onClick={() => updateConfig({ buttonDepth: depth.value as ButtonDepth })}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          (config.buttonDepth ?? 'raised') === depth.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium text-sm mb-1">{depth.label}</div>
                        <p className="text-xs text-muted-foreground">{depth.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="designblock" className="space-y-4">
              <div className="space-y-6">
                {/* Backdrop settings */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Подложки для текста</Label>
                  <p className="text-sm text-muted-foreground">
                    Настройте цвета подложек для текстовых саб-блоков
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorInput
                    label="Светлая подложка"
                    value={config.designBlock?.backdropLightColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropLightColor: v 
                      } 
                    })}
                    description="Лёгкий полупрозрачный фон"
                  />
                  <ColorInput
                    label="Тёмная подложка"
                    value={config.designBlock?.backdropDarkColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropDarkColor: v 
                      } 
                    })}
                    description="Тёмный фон с белым текстом"
                  />
                  <ColorInput
                    label="Акцентная подложка"
                    value={config.designBlock?.backdropPrimaryColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropPrimaryColor: v 
                      } 
                    })}
                    description="Фон основного цвета"
                  />
                  <ColorInput
                    label="Blur-подложка"
                    value={config.designBlock?.backdropBlurColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropBlurColor: v 
                      } 
                    })}
                    description="Полупрозрачный фон с размытием"
                  />
                </div>


                {/* Highlight settings */}
                <div className="border-t pt-6 space-y-2">
                  <Label className="text-base font-semibold">Выделение текста</Label>
                  <p className="text-sm text-muted-foreground">
                    Настройте цвета для маркера, подчёркивания и волнистой линии
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorInput
                    label="Маркер"
                    value={config.designBlock?.highlightMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightMarkerColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        highlightMarkerColor: v 
                      } 
                    })}
                    description="Как текстовый маркер"
                  />
                  <ColorInput
                    label="Подчёркивание"
                    value={config.designBlock?.highlightUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightUnderlineColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        highlightUnderlineColor: v 
                      } 
                    })}
                    description="Прямая линия снизу"
                  />
                  <ColorInput
                    label="Волнистая линия"
                    value={config.designBlock?.highlightWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightWavyColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        highlightWavyColor: v 
                      } 
                    })}
                    description="Волнистая линия снизу"
                  />
                </div>

                {/* Progress bar settings */}
                <div className="border-t pt-6 space-y-2">
                  <Label className="text-base font-semibold">Прогресс-бар</Label>
                  <p className="text-sm text-muted-foreground">
                    Цвета индикаторов прогресса в слайдах
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorInput
                    label="Активный слайд"
                    value={config.designBlock?.progressActiveColor || DEFAULT_DESIGN_BLOCK_SETTINGS.progressActiveColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        progressActiveColor: v 
                      } 
                    })}
                    description="Текущий слайд"
                  />
                  <ColorInput
                    label="Пройденные"
                    value={config.designBlock?.progressCompletedColor || DEFAULT_DESIGN_BLOCK_SETTINGS.progressCompletedColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        progressCompletedColor: v 
                      } 
                    })}
                    description="Завершённые слайды"
                  />
                  <ColorInput
                    label="Неактивные"
                    value={config.designBlock?.progressInactiveColor || DEFAULT_DESIGN_BLOCK_SETTINGS.progressInactiveColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        progressInactiveColor: v 
                      } 
                    })}
                    description="Непройденные слайды"
                  />
                  <ColorInput
                    label="Подложка прогресс-бара"
                    value={config.designBlock?.progressBackdropColor || DEFAULT_DESIGN_BLOCK_SETTINGS.progressBackdropColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        progressBackdropColor: v 
                      } 
                    })}
                    description="Фон за индикаторами"
                  />
                </div>

                {/* Button backdrop settings */}
                <div className="border-t pt-6 space-y-2">
                  <Label className="text-base font-semibold">Кнопка «Продолжить»</Label>
                  <p className="text-sm text-muted-foreground">
                    Подложка под кнопкой навигации
                  </p>
                </div>

                <ColorInput
                  label="Подложка кнопки"
                  value={config.designBlock?.buttonBackdropColor || DEFAULT_DESIGN_BLOCK_SETTINGS.buttonBackdropColor}
                  onChange={(v) => updateConfig({ 
                    designBlock: { 
                      ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                      ...config.designBlock, 
                      buttonBackdropColor: v 
                    } 
                  })}
                  description="Фон области с кнопкой внизу экрана"
                />

              </div>
            </TabsContent>

            <TabsContent value="sound" className="space-y-4">
              <div className="space-y-6">
                {/* Sound enabled toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Звуковые эффекты</Label>
                    <p className="text-sm text-muted-foreground">
                      Звуки при переходах и ответах
                    </p>
                  </div>
                  <Switch
                    checked={config.sound?.enabled !== false}
                    onCheckedChange={(enabled) => 
                      updateConfig({ 
                        sound: { ...DEFAULT_SOUND_SETTINGS, ...config.sound, enabled } 
                      })
                    }
                  />
                </div>

                {/* Sound theme */}
                <div className="space-y-3">
                  <Label>Тема звуков</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SOUND_THEME_OPTIONS.map((theme) => {
                      const isEnabled = config.sound?.enabled !== false;
                      const currentTheme = config.sound?.theme ?? 'duolingo';
                      
                      return (
                        <button
                          key={theme.value}
                          onClick={() => {
                            updateConfig({ 
                              sound: { 
                                ...DEFAULT_SOUND_SETTINGS, 
                                ...config.sound, 
                                theme: theme.value as SoundTheme 
                              } 
                            });
                            // Play preview sound
                            if (theme.value !== 'none') {
                              playSound('tap', { 
                                enabled: true, 
                                theme: theme.value as SoundTheme, 
                                volume: config.sound?.volume ?? 0.5 
                              });
                            }
                          }}
                          disabled={!isEnabled}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            currentTheme === theme.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                            !isEnabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {theme.value === 'none' ? (
                              <VolumeX className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-primary" />
                            )}
                            <span className="font-medium">{theme.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{theme.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volume slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Громкость</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((config.sound?.volume ?? 0.5) * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[(config.sound?.volume ?? 0.5) * 100]}
                    min={0}
                    max={100}
                    step={10}
                    disabled={config.sound?.enabled === false || config.sound?.theme === 'none'}
                    onValueChange={([value]) => {
                      updateConfig({ 
                        sound: { 
                          ...DEFAULT_SOUND_SETTINGS, 
                          ...config.sound, 
                          volume: value / 100 
                        } 
                      });
                    }}
                    onValueCommit={() => {
                      // Play preview sound when done sliding
                      playSound('pop', { 
                        enabled: true, 
                        theme: config.sound?.theme ?? 'duolingo', 
                        volume: config.sound?.volume ?? 0.5 
                      });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Test sounds */}
                <div className="space-y-3">
                  <Label>Проверить звуки</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'swipe', label: 'Переход' },
                      { type: 'correct', label: 'Верно' },
                      { type: 'incorrect', label: 'Неверно' },
                      { type: 'complete', label: 'Завершение' },
                    ].map((sound) => (
                      <Button
                        key={sound.type}
                        variant="outline"
                        size="sm"
                        disabled={config.sound?.enabled === false || config.sound?.theme === 'none'}
                        onClick={() => playSound(sound.type as any, {
                          enabled: true,
                          theme: config.sound?.theme ?? 'duolingo',
                          volume: config.sound?.volume ?? 0.5,
                        })}
                      >
                        {sound.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Mascot Tab */}
            <TabsContent value="mascot" className="space-y-6">
              <div className="space-y-6">
                {/* Status banner */}
                <div className={cn(
                  "p-4 rounded-xl border-2 flex items-start gap-3",
                  config.mascot?.isApproved 
                    ? "bg-success/5 border-success/20" 
                    : "bg-muted/50 border-border"
                )}>
                  {config.mascot?.isApproved ? (
                    <Lock className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Unlock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {config.mascot?.isApproved ? 'Маскот утверждён' : 'Маскот не утверждён'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {config.mascot?.isApproved 
                        ? 'AI-агент будет использовать этого персонажа для генерации всех иллюстраций курса'
                        : 'Опишите персонажа и утвердите его для использования в курсе'}
                    </p>
                  </div>
                </div>

                {/* Mascot name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Имя персонажа</Label>
                  <Input
                    value={config.mascot?.name || ''}
                    onChange={(e) => updateConfig({ 
                      mascot: { 
                        ...DEFAULT_MASCOT_SETTINGS, 
                        ...config.mascot, 
                        name: e.target.value 
                      } 
                    })}
                    placeholder="Например: Профессор Лис, Робот Эдди, Сова Мудрила..."
                    disabled={config.mascot?.isApproved}
                  />
                </div>

                {/* AI Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Промт для ИИ</Label>
                  <Textarea
                    value={config.mascot?.prompt || ''}
                    onChange={(e) => updateConfig({ 
                      mascot: { 
                        ...DEFAULT_MASCOT_SETTINGS, 
                        ...config.mascot, 
                        prompt: e.target.value 
                      } 
                    })}
                    placeholder="Опишите внешний вид персонажа: вид животного/существа, одежда, цвета, особенности...

Пример: Дружелюбный лис-профессор в очках и твидовом пиджаке. Рыжий мех с белым пятном на груди. Большие добрые глаза. Всегда носит с собой книгу."
                    className="min-h-[120px] resize-none"
                    disabled={config.mascot?.isApproved}
                  />
                  <p className="text-xs text-muted-foreground">
                    Чем подробнее описание, тем лучше ИИ сможет генерировать консистентные изображения
                  </p>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Стиль иллюстрации</Label>
                  <Select
                    value={config.mascot?.style || 'flat vector illustration'}
                    onValueChange={(v) => updateConfig({ 
                      mascot: { 
                        ...DEFAULT_MASCOT_SETTINGS, 
                        ...config.mascot, 
                        style: v 
                      } 
                    })}
                    disabled={config.mascot?.isApproved}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat vector illustration">Плоская векторная иллюстрация</SelectItem>
                      <SelectItem value="3D cartoon">3D мультяшный</SelectItem>
                      <SelectItem value="pixel art">Пиксель-арт</SelectItem>
                      <SelectItem value="watercolor illustration">Акварельная иллюстрация</SelectItem>
                      <SelectItem value="anime style">Аниме стиль</SelectItem>
                      <SelectItem value="minimalist line art">Минималистичный лайн-арт</SelectItem>
                      <SelectItem value="cute kawaii">Милый кавай</SelectItem>
                      <SelectItem value="realistic illustration">Реалистичная иллюстрация</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Personality */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Характер персонажа</Label>
                  <Textarea
                    value={config.mascot?.personality || ''}
                    onChange={(e) => updateConfig({ 
                      mascot: { 
                        ...DEFAULT_MASCOT_SETTINGS, 
                        ...config.mascot, 
                        personality: e.target.value 
                      } 
                    })}
                    placeholder="Опишите характер: как персонаж говорит, какие эмоции выражает...

Пример: Добрый и терпеливый учитель. Радуется успехам ученика, подбадривает при ошибках. Использует простые объяснения и шутки."
                    className="min-h-[100px] resize-none"
                    disabled={config.mascot?.isApproved}
                  />
                </div>

                {/* Approved Image - File Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Референс изображение</Label>
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30 relative",
                      config.mascot?.approvedImageUrl ? "border-primary/30" : "border-border"
                    )}>
                      {config.mascot?.approvedImageUrl ? (
                        <>
                          <img 
                            src={config.mascot.approvedImageUrl} 
                            alt="Mascot" 
                            className="w-full h-full object-cover"
                          />
                          {!config.mascot?.isApproved && (
                            <button
                              type="button"
                              onClick={() => updateConfig({ 
                                mascot: { 
                                  ...DEFAULT_MASCOT_SETTINGS, 
                                  ...config.mascot, 
                                  approvedImageUrl: '' 
                                } 
                              })}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/90 text-white flex items-center justify-center hover:bg-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      {config.mascot?.approvedImageUrl ? (
                        <p className="text-sm text-foreground">Референс загружен</p>
                      ) : (
                        <label className={cn(
                          "flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                          config.mascot?.isApproved 
                            ? "border-muted bg-muted/20 cursor-not-allowed opacity-50" 
                            : "border-border hover:border-primary/50 bg-muted/30"
                        )}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={config.mascot?.isApproved}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              try {
                                const fileName = `mascot-ref-${Date.now()}-${file.name}`;
                                const { data, error } = await supabase.storage
                                  .from('mascots')
                                  .upload(fileName, file, { upsert: true });
                                
                                if (error) throw error;
                                
                                const { data: publicUrl } = supabase.storage
                                  .from('mascots')
                                  .getPublicUrl(data.path);
                                
                                updateConfig({ 
                                  mascot: { 
                                    ...DEFAULT_MASCOT_SETTINGS, 
                                    ...config.mascot, 
                                    approvedImageUrl: publicUrl.publicUrl 
                                  } 
                                });
                              } catch (err) {
                                console.error('Mascot upload error:', err);
                              }
                            }}
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Загрузить изображение</span>
                        </label>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Загрузите референс изображение маскота
                      </p>
                    </div>
                  </div>
                </div>

                {/* Approve button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    variant={config.mascot?.isApproved ? "outline" : "default"}
                    onClick={() => updateConfig({ 
                      mascot: { 
                        ...DEFAULT_MASCOT_SETTINGS, 
                        ...config.mascot, 
                        isApproved: !config.mascot?.isApproved 
                      } 
                    })}
                    className="w-full"
                  >
                    {config.mascot?.isApproved ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Разблокировать для редактирования
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Утвердить маскота
                      </>
                    )}
                  </Button>
                  {!config.mascot?.isApproved && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      После утверждения ИИ-агент будет использовать эти настройки для генерации персонажа
                    </p>
                  )}
                </div>

                {/* === RIVE MASCOT SECTION === */}
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">Rive-маскот для квизов</h4>
                      <p className="text-xs text-muted-foreground">
                        Анимированный персонаж с реакциями как в Duolingo
                      </p>
                    </div>
                  </div>

                  {/* Enable Rive mascot */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Включить Rive-маскота</Label>
                      <p className="text-xs text-muted-foreground">
                        Показывать в блоках с вопросами
                      </p>
                    </div>
                    <Switch
                      checked={config.mascot?.riveEnabled === true}
                      onCheckedChange={(enabled) => {
                        const currentMascot = config.mascot || {};
                        onChange({ 
                          ...config,
                          mascot: { 
                            ...DEFAULT_MASCOT_SETTINGS, 
                            ...currentMascot, 
                            riveEnabled: enabled 
                          } 
                        });
                      }}
                    />
                  </div>

                  {config.mascot?.riveEnabled && (
                    <>
                      {/* Rive file upload */}
                      <RiveFileUploader
                        riveUrl={config.mascot?.riveUrl || ''}
                        onUpload={(url) => updateConfig({
                          mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveUrl: url }
                        })}
                        onRemove={() => updateConfig({
                          mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveUrl: '' }
                        })}
                      />

                      {/* State machine settings */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Настройки State Machine</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Имя State Machine</Label>
                            <Input
                              value={config.mascot?.riveStateMachine || 'State Machine 1'}
                              onChange={(e) => updateConfig({
                                mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveStateMachine: e.target.value }
                              })}
                              placeholder="State Machine 1"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Триггер Idle</Label>
                            <Input
                              value={config.mascot?.riveIdleState || 'idle'}
                              onChange={(e) => updateConfig({
                                mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveIdleState: e.target.value }
                              })}
                              placeholder="idle"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Триггер Correct</Label>
                            <Input
                              value={config.mascot?.riveCorrectState || 'correct'}
                              onChange={(e) => updateConfig({
                                mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveCorrectState: e.target.value }
                              })}
                              placeholder="correct"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Триггер Incorrect</Label>
                            <Input
                              value={config.mascot?.riveIncorrectState || 'incorrect'}
                              onChange={(e) => updateConfig({
                                mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveIncorrectState: e.target.value }
                              })}
                              placeholder="incorrect"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Position and size */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Позиция</Label>
                          <Select
                            value={config.mascot?.rivePosition || 'top'}
                            onValueChange={(v) => updateConfig({
                              mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, rivePosition: v as 'top' | 'bottom' }
                            })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Сверху</SelectItem>
                              <SelectItem value="bottom">Снизу</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Размер</Label>
                          <Select
                            value={config.mascot?.riveSize || 'medium'}
                            onValueChange={(v) => updateConfig({
                              mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveSize: v as 'small' | 'medium' | 'large' }
                            })}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Маленький</SelectItem>
                              <SelectItem value="medium">Средний</SelectItem>
                              <SelectItem value="large">Большой</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

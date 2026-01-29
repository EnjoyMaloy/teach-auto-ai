// Design System Editor - with auto-save for personal themes
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DesignSystemConfig, 
  DEFAULT_DESIGN_SYSTEM,
  DEFAULT_SOUND_SETTINGS,
  DEFAULT_DESIGN_BLOCK_SETTINGS,
  DEFAULT_MASCOT_SETTINGS,
  FONT_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  SoundTheme,
  ButtonDepth,
} from '@/types/designSystem';
import { playSound, SOUND_THEME_OPTIONS } from '@/lib/sounds';
import { BaseDesignSystemSelector } from './BaseDesignSystemSelector';
import { ThemeBackgroundsEditor } from './ThemeBackgroundsEditor';
import { SettingsCard } from './design-system/SettingsCard';
import { CustomFontInput, useLoadCustomFonts } from './design-system/CustomFontInput';
import { useBaseDesignSystems, BaseDesignSystem } from '@/hooks/useBaseDesignSystems';
import { useUserDesignSystems } from '@/hooks/useUserDesignSystems';
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
  Link2,
  Copy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  const [copied, setCopied] = React.useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`#${hexValue}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        {/* Larger color picker - 48px for better touch target */}
        <div 
          className="w-12 h-12 rounded-xl border-2 border-border overflow-hidden cursor-pointer relative flex-shrink-0 shadow-sm hover:border-primary/50 transition-colors hover:scale-105"
          style={{ backgroundColor: `hsl(${value})` }}
        >
          <input
            type="color"
            value={`#${hslToHex(value)}`}
            onChange={handleColorPickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label={`Выбрать ${label}`}
          />
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">#</span>
          <Input
            value={hexValue}
            onChange={(e) => handleHexChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-7 pr-10 font-mono text-sm uppercase tracking-wider bg-background"
            placeholder="FFFFFF"
            maxLength={6}
            aria-label={`${label} HEX код`}
          />
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Копировать HEX"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
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
  const updateConfig = (updates: Partial<DesignSystemConfig>) => {
    // Keep themeId and don't reset activePreset - user is just customizing within the theme
    console.log('updateConfig called with:', Object.keys(updates));
    onChange({ ...config, ...updates });
  };
  
  const resetToDefault = () => {
    onChange(DEFAULT_DESIGN_SYSTEM);
    setActivePreset(null);
  };

  // Get base design systems for admin editing
  const { 
    systems: baseSystems,
    isLoading: isLoadingBaseSystems,
    createSystem: createBaseSystem,
    updateSystem: updateBaseSystem,
    deleteSystem: deleteBaseSystem,
    setDefault: setDefaultBaseSystem,
  } = useBaseDesignSystems();

  // Get user's personal themes to check if selected theme is personal
  const { 
    systems: userSystems, 
    isLoading: isLoadingUserSystems,
    createSystem: createUserSystem, 
    updateSystem: updateUserSystem, 
    deleteSystem: deleteUserSystem 
  } = useUserDesignSystems();

  // Load custom fonts when they change
  useLoadCustomFonts(config.customFonts);
  const isPersonalThemeSelected = userSystems.some(s => s.id === selectedBaseSystemId);
  // Check if the selected theme is a base (common) theme
  const isBaseThemeSelected = baseSystems.some(s => s.id === selectedBaseSystemId);
  const hasCommonThemeSelected = !!selectedBaseSystemId && !isPersonalThemeSelected && !isLoadingUserSystems;
  const isEditingRestricted = !isAdmin && hasCommonThemeSelected;

  // Auto-save theme changes with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedConfigRef = useRef<string>('');
  const currentThemeIdRef = useRef<string | null>(null);

  // Save changes to personal theme - silent to avoid toast spam
  const savePersonalTheme = useCallback(async (themeId: string, configToSave: DesignSystemConfig) => {
    const configStr = JSON.stringify(configToSave);
    if (configStr !== lastSavedConfigRef.current) {
      console.log('Saving personal theme:', themeId);
      await updateUserSystem(themeId, { config: configToSave }, true);
      lastSavedConfigRef.current = configStr;
    }
  }, [updateUserSystem]);

  // Save changes to base theme (admin only) - silent to avoid toast spam
  const saveBaseTheme = useCallback(async (themeId: string, configToSave: DesignSystemConfig) => {
    const configStr = JSON.stringify(configToSave);
    if (configStr !== lastSavedConfigRef.current) {
      console.log('Saving base theme:', themeId);
      await updateBaseSystem(themeId, { config: configToSave }, true);
      lastSavedConfigRef.current = configStr;
    }
  }, [updateBaseSystem]);

  // Auto-save effect for personal themes
  useEffect(() => {
    // Skip if still loading user systems or no theme selected
    if (isLoadingUserSystems || !selectedBaseSystemId) {
      return;
    }

    // Check if this is a personal theme
    const personalTheme = userSystems.find(s => s.id === selectedBaseSystemId);
    if (!personalTheme) {
      return;
    }

    // If theme changed, update ref and don't save (it's a load, not a change)
    if (currentThemeIdRef.current !== selectedBaseSystemId) {
      currentThemeIdRef.current = selectedBaseSystemId;
      lastSavedConfigRef.current = JSON.stringify(config);
      return;
    }

    const currentConfigStr = JSON.stringify(config);
    
    // Skip if config hasn't changed
    if (currentConfigStr === lastSavedConfigRef.current) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save - wait 800ms after last change
    saveTimeoutRef.current = setTimeout(() => {
      savePersonalTheme(selectedBaseSystemId, config);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, selectedBaseSystemId, userSystems, isLoadingUserSystems, savePersonalTheme]);

  // Auto-save effect for base themes (admin only)
  useEffect(() => {
    // Skip if not admin, still loading, or no theme selected
    if (!isAdmin || isLoadingBaseSystems || !selectedBaseSystemId) {
      return;
    }

    // Check if this is a base theme
    const baseTheme = baseSystems.find(s => s.id === selectedBaseSystemId);
    if (!baseTheme) {
      return;
    }

    // If theme changed, update ref and don't save (it's a load, not a change)
    if (currentThemeIdRef.current !== selectedBaseSystemId) {
      currentThemeIdRef.current = selectedBaseSystemId;
      lastSavedConfigRef.current = JSON.stringify(config);
      return;
    }

    const currentConfigStr = JSON.stringify(config);
    
    // Skip if config hasn't changed
    if (currentConfigStr === lastSavedConfigRef.current) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save - wait 800ms after last change
    saveTimeoutRef.current = setTimeout(() => {
      saveBaseTheme(selectedBaseSystemId, config);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, selectedBaseSystemId, baseSystems, isLoadingBaseSystems, isAdmin, saveBaseTheme]);

  // Handler for base system selection
  const handleBaseSystemSelect = (system: BaseDesignSystem, isPersonalTheme: boolean) => {
    // Update refs to prevent auto-save of the loaded config
    currentThemeIdRef.current = system.id;
    lastSavedConfigRef.current = JSON.stringify(system.config);
    
    // Apply the theme's config with themeId to track which theme is selected
    const newConfig = {
      ...system.config,
      themeId: system.id,
    };
    
    onChange(newConfig);
    // Always pass the system ID for visual selection
    onBaseSystemSelect?.(system.id);
    setActivePreset(null);
  };

  return (
    <div className="space-y-6">
      {/* Unified Themes Block - Base systems from DB + Preset themes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          Темы
        </h3>

        {/* Base design systems from database */}
        <BaseDesignSystemSelector
          selectedId={selectedBaseSystemId || null}
          onSelect={handleBaseSystemSelect}
          isAdmin={isAdmin}
          currentConfig={config}
          baseSystems={baseSystems}
          isLoadingBaseSystems={isLoadingBaseSystems}
          onCreateBaseSystem={createBaseSystem}
          onUpdateBaseSystem={updateBaseSystem}
          onDeleteBaseSystem={deleteBaseSystem}
          userSystems={userSystems}
          isLoadingUserSystems={isLoadingUserSystems}
          onCreateUserSystem={createUserSystem}
          onUpdateUserSystem={updateUserSystem}
          onDeleteUserSystem={deleteUserSystem}
        />
      </div>

      {/* Show restriction message for non-admins with base system or built-in theme selected */}
      {isEditingRestricted && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <p className="font-medium">Общая тема выбрана</p>
          <p className="text-xs mt-1 text-amber-600">
            Вы не можете редактировать параметры общих тем. Создайте свою тему, чтобы настроить дизайн.
          </p>
        </div>
      )}

      {/* Show hint when no theme is selected - hide all content below */}
      {!selectedBaseSystemId && !isEditingRestricted ? (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <p className="font-medium">Тема не выбрана</p>
          <p className="text-xs mt-1 text-blue-600">
            Выберите готовую тему выше или создайте свою для настройки дизайна курса.
          </p>
        </div>
      ) : (
      /* Detailed Settings - view-only for non-admins with base system selected */
      <div className={cn("space-y-4", isEditingRestricted && "opacity-60 [&_input]:pointer-events-none [&_input]:opacity-50 [&_button:not([data-radix-collection-item])]:pointer-events-none [&_button:not([data-radix-collection-item])]:opacity-50 [&_select]:pointer-events-none [&_textarea]:pointer-events-none [&_[role=slider]]:pointer-events-none [&_[role=switch]]:pointer-events-none [&_[type=color]]:pointer-events-none")}>
        <h3 className="font-semibold text-foreground">Детальные настройки</h3>
        <Tabs defaultValue="ui" className="w-full">
          <TabsList className="w-full grid grid-cols-3 grid-rows-2 h-auto p-1 bg-muted/50 gap-1">
            <TabsTrigger value="ui" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Palette className="w-3.5 h-3.5 mr-1" />
              Тема
            </TabsTrigger>
            <TabsTrigger value="interactive" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Квизы
            </TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Layers className="w-3.5 h-3.5 mr-1" />
              Текст
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Type className="w-3.5 h-3.5 mr-1" />
              Шрифты
            </TabsTrigger>
            <TabsTrigger value="sound" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Volume2 className="w-3.5 h-3.5 mr-1" />
              Звуки
            </TabsTrigger>
            <TabsTrigger value="mascot" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Bot className="w-3.5 h-3.5 mr-1" />
              Маскот
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">

            {/* === UI TAB: Background, Buttons, Progress Bar === */}
            <TabsContent value="ui" className="space-y-4">
              {/* Theme Backgrounds Card */}
              <SettingsCard
                icon={<ImageIcon className="w-4 h-4" />}
                title="Фоны курса"
                description="Настройте до 5 фонов для слайдов"
              >
                <ThemeBackgroundsEditor 
                  backgrounds={config.themeBackgrounds || []}
                  onChange={(backgrounds) => updateConfig({ themeBackgrounds: backgrounds })}
                  defaultBackgroundId={config.defaultBackgroundId}
                  onDefaultChange={(id) => updateConfig({ defaultBackgroundId: id })}
                  selectedBackgroundId={config.defaultBackgroundId}
                  onSelectBackground={(id) => updateConfig({ defaultBackgroundId: id })}
                  maxBackgrounds={5}
                />
              </SettingsCard>

              {/* Accent Color Card */}
              <SettingsCard
                icon={<Palette className="w-4 h-4" />}
                title="Акцентный цвет"
                description="Прогресс-бар и выбор ответов"
              >
                <ColorInput
                  label="Цвет"
                  value={config.designBlock?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor}
                  onChange={(v) => updateConfig({ 
                    designBlock: { 
                      ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                      ...config.designBlock, 
                      accentElementColor: v 
                    } 
                  })}
                />

                {/* Preview */}
                <div className="space-y-3 pt-2">
                  {/* Progress bar preview */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Прогресс-бар:</p>
                    <div className="flex gap-1 bg-black/5 rounded-lg px-2 py-1.5">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={`active-${i}`}
                          className="h-1 flex-1 rounded-sm transition-colors"
                          style={{ 
                            backgroundColor: `hsl(${config.designBlock?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor})` 
                          }}
                        />
                      ))}
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={`inactive-${i}`}
                          className="h-1 flex-1 rounded-sm transition-colors bg-black/15"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quiz selection preview */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Выбор ответа:</p>
                    <div className="flex gap-2">
                      <div 
                        className="px-3 py-2 rounded-lg text-xs font-medium border-2 flex items-center gap-2"
                        style={{ 
                          borderColor: `hsl(${config.designBlock?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor})`,
                          backgroundColor: `hsl(${config.designBlock?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor} / 0.1)`,
                          color: `hsl(${config.designBlock?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor})`,
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded border-2 flex items-center justify-center"
                          style={{ 
                            borderColor: 'currentColor',
                            backgroundColor: 'currentColor',
                          }}
                        >
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        Выбранный
                      </div>
                      <div className="px-3 py-2 rounded-lg text-xs font-medium border-2 border-border bg-background text-muted-foreground flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-current opacity-50" />
                        Не выбран
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsCard>

              {/* Buttons Card */}
              <SettingsCard
                icon={<Square className="w-4 h-4" />}
                title="Кнопки"
                description="Форма и стиль кнопок"
              >
                {/* Button Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <ColorInput
                    label="Цвет кнопки"
                    value={config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor}
                    onChange={(v) => updateConfig({ primaryColor: v })}
                  />
                  <ColorInput
                    label="Текст"
                    value={config.primaryForeground || DEFAULT_DESIGN_SYSTEM.primaryForeground}
                    onChange={(v) => updateConfig({ primaryForeground: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Форма</Label>
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
                          "p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
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
                  <Label className="text-xs text-muted-foreground">Объём</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'flat', label: 'Плоские' },
                      { value: 'raised', label: 'Объёмные' },
                    ].map((depth) => (
                      <button
                        key={depth.value}
                        onClick={() => updateConfig({ buttonDepth: depth.value as ButtonDepth })}
                        className={cn(
                          "p-2.5 rounded-lg border-2 text-center transition-all",
                          (config.buttonDepth ?? 'raised') === depth.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium text-sm">{depth.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Button Preview */}
                <div 
                  className="rounded-lg p-3"
                  style={{ 
                    backgroundColor: `hsl(${config.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor})` 
                  }}
                >
                  <button
                    className="w-full py-3 font-bold uppercase tracking-wide text-sm transition-all"
                    style={{
                      backgroundColor: `hsl(${config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor})`,
                      color: `hsl(${config.primaryForeground || DEFAULT_DESIGN_SYSTEM.primaryForeground})`,
                      borderRadius: config.buttonStyle === 'pill' 
                        ? '9999px' 
                        : config.buttonStyle === 'square' 
                          ? '0.5rem' 
                          : '0.75rem',
                      boxShadow: (config.buttonDepth ?? 'raised') === 'raised'
                        ? `0 4px 0 0 hsl(${config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor} / 0.4), 0 6px 12px -2px hsl(${config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor} / 0.25)`
                        : 'none',
                    }}
                  >
                    ПРОДОЛЖИТЬ
                  </button>
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === INTERACTIVE TAB: Quiz states, hints === */}
            <TabsContent value="interactive" className="space-y-4">
              {/* Answer Colors Card */}
              <SettingsCard
                icon={<Check className="w-4 h-4" />}
                title="Цвета ответов"
                description="Правильные и неправильные ответы"
              >
                <div className="grid grid-cols-2 gap-3">
                  <ColorInput
                    label="Правильный"
                    value={config.successColor || DEFAULT_DESIGN_SYSTEM.successColor}
                    onChange={(v) => updateConfig({ successColor: v })}
                  />
                  <ColorInput
                    label="Неправильный"
                    value={config.destructiveColor || DEFAULT_DESIGN_SYSTEM.destructiveColor}
                    onChange={(v) => updateConfig({ destructiveColor: v })}
                  />
                </div>
              </SettingsCard>

              {/* Mascot Card - Coming Soon */}
              <SettingsCard
                icon={<Lock className="w-4 h-4" />}
                title="Маскот"
                description="Анимированный персонаж для квизов"
              >
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Скоро</p>
                    <p className="text-xs text-muted-foreground/70">
                      Функция маскота находится в разработке
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === BLOCKS TAB: Design block settings === */}
            <TabsContent value="blocks" className="space-y-4">
              {/* Backdrop Card */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Подложки для текста"
                description="Цвета подложек в дизайн-блоках"
              >
                <div className="grid grid-cols-2 gap-3">
                  <ColorInput
                    label="Светлая"
                    value={config.designBlock?.backdropLightColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropLightColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Тёмная"
                    value={config.designBlock?.backdropDarkColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropDarkColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Акцентная"
                    value={config.designBlock?.backdropPrimaryColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropPrimaryColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Blur"
                    value={config.designBlock?.backdropBlurColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        backdropBlurColor: v 
                      } 
                    })}
                  />
                </div>
              </SettingsCard>

              {/* Highlights Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Выделение текста"
                description="Маркер, подчёркивание, волнистая линия"
              >
                <div className="space-y-3">
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
                  />
                </div>
              </SettingsCard>

              {/* Text Colors Card */}
              <SettingsCard
                icon={<Palette className="w-4 h-4" />}
                title="Цвета текста"
                description="Основной текст и карточки"
              >
                <ColorInput
                  label="Цвет текста"
                  value={config.foregroundColor || DEFAULT_DESIGN_SYSTEM.foregroundColor}
                  onChange={(v) => updateConfig({ foregroundColor: v })}
                />
              </SettingsCard>
            </TabsContent>

            {/* === TYPOGRAPHY TAB === */}
            <TabsContent value="typography" className="space-y-4">
              {/* Custom Fonts Card */}
              <SettingsCard
                icon={<Plus className="w-4 h-4" />}
                title="Кастомные шрифты"
                description="Добавьте шрифты из Google Fonts"
              >
                <CustomFontInput
                  customFonts={config.customFonts || []}
                  onChange={(fonts) => updateConfig({ customFonts: fonts })}
                />
              </SettingsCard>

              {/* Body Font Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Основной шрифт"
                description="Для основного текста и параграфов"
              >
                <Select
                  value={config.fontFamily}
                  onValueChange={(v) => updateConfig({ fontFamily: v })}
                >
                  <SelectTrigger className="w-full h-12">
                    <div className="flex items-center justify-between w-full">
                      <span style={{ fontFamily: config.fontFamily }} className="text-base">
                        {config.customFonts?.find(f => f.family === config.fontFamily)?.name || FONT_OPTIONS.find(f => f.value === config.fontFamily)?.label || 'Выберите шрифт'}
                      </span>
                      <span style={{ fontFamily: config.fontFamily }} className="text-muted-foreground text-sm">
                        Аа Bb
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {/* Custom fonts first */}
                    {config.customFonts && config.customFonts.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                          Кастомные
                        </div>
                        {config.customFonts.map((font) => (
                          <SelectItem 
                            key={font.family} 
                            value={font.family}
                            className="py-3"
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
                {/* Preview */}
                <div 
                  className="p-3 rounded-lg border bg-muted/30 text-sm"
                  style={{ fontFamily: config.fontFamily }}
                >
                  Пример текста с выбранным шрифтом — The quick brown fox
                </div>
              </SettingsCard>

              {/* Heading Font Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Шрифт заголовков"
                description="Для заголовков и подзаголовков"
              >
                <Select
                  value={config.headingFontFamily}
                  onValueChange={(v) => updateConfig({ headingFontFamily: v })}
                >
                  <SelectTrigger className="w-full h-12">
                    <div className="flex items-center justify-between w-full">
                      <span style={{ fontFamily: config.headingFontFamily }} className="text-base">
                        {config.customFonts?.find(f => f.family === config.headingFontFamily)?.name || FONT_OPTIONS.find(f => f.value === config.headingFontFamily)?.label || 'Выберите шрифт'}
                      </span>
                      <span style={{ fontFamily: config.headingFontFamily }} className="text-muted-foreground text-sm">
                        Аа Bb
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {/* Custom fonts first */}
                    {config.customFonts && config.customFonts.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                          Кастомные
                        </div>
                        {config.customFonts.map((font) => (
                          <SelectItem 
                            key={font.family} 
                            value={font.family}
                            className="py-3"
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
                {/* Preview */}
                <div 
                  className="p-3 rounded-lg border bg-muted/30 text-lg font-bold"
                  style={{ fontFamily: config.headingFontFamily }}
                >
                  Заголовок — Heading
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === SOUND TAB === */}
            <TabsContent value="sound" className="space-y-4">
              {/* Sound Toggle Card */}
              <SettingsCard
                icon={config.sound?.enabled !== false ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                title="Звуковые эффекты"
                description="Звуки при переходах и ответах"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Включить звуки</Label>
                  <Switch
                    checked={config.sound?.enabled !== false}
                    onCheckedChange={(enabled) => 
                      updateConfig({ 
                        sound: { ...DEFAULT_SOUND_SETTINGS, ...config.sound, enabled } 
                      })
                    }
                  />
                </div>
              </SettingsCard>

              {/* Sound settings - only show when enabled */}
              {config.sound?.enabled !== false && (
                <>
                  {/* Sound theme Card */}
                  <SettingsCard
                    icon={<Sparkles className="w-4 h-4" />}
                    title="Тема звуков"
                    description="Стиль звукового оформления"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {SOUND_THEME_OPTIONS.map((theme) => {
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
                            className={cn(
                              "p-2.5 rounded-lg border-2 text-center transition-all text-sm font-medium",
                              currentTheme === theme.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {theme.label}
                          </button>
                        );
                      })}
                    </div>
                  </SettingsCard>

                  {/* Volume Card */}
                  <SettingsCard
                    icon={<Volume2 className="w-4 h-4" />}
                    title="Громкость"
                    description={`${Math.round((config.sound?.volume ?? 0.5) * 100)}%`}
                  >
                    <Slider
                      value={[(config.sound?.volume ?? 0.5) * 100]}
                      min={0}
                      max={100}
                      step={10}
                      disabled={config.sound?.theme === 'none'}
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
                  </SettingsCard>

                  {/* Test Sounds Card */}
                  <SettingsCard
                    icon={<Play className="w-4 h-4" />}
                    title="Проверить звуки"
                    description="Прослушайте звуки курса"
                    collapsible
                    defaultOpen={false}
                  >
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
                          disabled={config.sound?.theme === 'none'}
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
                  </SettingsCard>
                </>
              )}
            </TabsContent>

            {/* === MASCOT TAB === */}
            <TabsContent value="mascot" className="space-y-4">
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

              {/* Basic Info Card */}
              <SettingsCard
                icon={<Bot className="w-4 h-4" />}
                title="Основные данные"
                description="Имя и описание персонажа"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Имя персонажа</Label>
                    <Input
                      value={config.mascot?.name || ''}
                      onChange={(e) => updateConfig({ 
                        mascot: { 
                          ...DEFAULT_MASCOT_SETTINGS, 
                          ...config.mascot, 
                          name: e.target.value 
                        } 
                      })}
                      placeholder="Например: Профессор Лис, Робот Эдди..."
                      disabled={config.mascot?.isApproved}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Промт для ИИ</Label>
                    <Textarea
                      value={config.mascot?.prompt || ''}
                      onChange={(e) => updateConfig({ 
                        mascot: { 
                          ...DEFAULT_MASCOT_SETTINGS, 
                          ...config.mascot, 
                          prompt: e.target.value 
                        } 
                      })}
                      placeholder="Опишите внешний вид персонажа: вид животного/существа, одежда, цвета..."
                      className="min-h-[100px] resize-none"
                      disabled={config.mascot?.isApproved}
                    />
                  </div>
                </div>
              </SettingsCard>

              {/* Style & Personality Card */}
              <SettingsCard
                icon={<Sparkles className="w-4 h-4" />}
                title="Стиль и характер"
                description="Визуальный стиль и поведение"
                collapsible
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Стиль иллюстрации</Label>
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

                  <div className="space-y-2">
                    <Label className="text-sm">Характер персонажа</Label>
                    <Textarea
                      value={config.mascot?.personality || ''}
                      onChange={(e) => updateConfig({ 
                        mascot: { 
                          ...DEFAULT_MASCOT_SETTINGS, 
                          ...config.mascot, 
                          personality: e.target.value 
                        } 
                      })}
                      placeholder="Опишите характер: как персонаж говорит, какие эмоции выражает..."
                      className="min-h-[80px] resize-none"
                      disabled={config.mascot?.isApproved}
                    />
                  </div>
                </div>
              </SettingsCard>

              {/* Reference Image Card */}
              <SettingsCard
                icon={<ImageIcon className="w-4 h-4" />}
                title="Референс изображение"
                description="Загрузите образец внешнего вида"
                collapsible
                defaultOpen={!!config.mascot?.approvedImageUrl}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30 relative flex-shrink-0",
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
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {!config.mascot?.approvedImageUrl && (
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
                        <span className="text-xs text-muted-foreground">Загрузить</span>
                      </label>
                    )}
                  </div>
                </div>
              </SettingsCard>

              {/* Approve button */}
              <div className="pt-2">
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
                    После утверждения ИИ-агент будет использовать эти настройки
                  </p>
                )}
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
      )}
    </div>
  );
};

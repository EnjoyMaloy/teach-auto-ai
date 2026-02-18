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
  ProgressBarStyle,
} from '@/types/designSystem';
import { playSound, SOUND_THEME_OPTIONS } from '@/lib/sounds';
import { BaseDesignSystemSelector } from './BaseDesignSystemSelector';
import { ThemeBackgroundsEditor } from './ThemeBackgroundsEditor';
import { SettingsCard } from './design-system/SettingsCard';
import { FontSelectorWithCustom } from './design-system/FontSelectorWithCustom';
import { useLoadCustomFonts } from './design-system/CustomFontInput';
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
  ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Play,
  Loader2,
  Link2,
  Copy,
  MousePointerClick,
  Table2
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
  /** Render themes and details as separate scrollable columns via render props */
  onRenderSplit?: (themes: React.ReactNode, details: React.ReactNode) => React.ReactNode;
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
      // Always copy the full 6-character hex from the current value
      const fullHex = hslToHex(value);
      await navigator.clipboard.writeText(fullHex);
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
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">#</span>
          <Input
            value={hexValue}
            onChange={(e) => handleHexChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-5 pr-8 font-mono text-xs uppercase tracking-tight bg-background h-9"
            placeholder="FFFFFF"
            maxLength={6}
            aria-label={`${label} HEX код`}
          />
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Копировать HEX"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
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

// Helper to truncate filename keeping extension visible
const truncateFileName = (url: string, maxLength: number = 20): string => {
  const fileName = url.split('/').pop() || '';
  if (fileName.length <= maxLength) return fileName;
  
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  const nameWithoutExt = fileName.slice(0, fileName.length - ext.length);
  const visibleChars = maxLength - ext.length - 3; // 3 for "..."
  
  if (visibleChars <= 0) return fileName.slice(0, maxLength - 3) + '...';
  
  return nameWithoutExt.slice(0, visibleChars) + '...' + ext;
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
          <Play className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Rive-анимация подключена</p>
            <p className="text-xs text-muted-foreground" title={riveUrl.split('/').pop()}>
              {truncateFileName(riveUrl, 24)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="shrink-0">
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

// Progress Bar Preview Component
const ProgressBarPreview: React.FC<{
  style: ProgressBarStyle;
  accentColor: string;
  mutedColor: string;
  foregroundColor: string;
}> = ({ style, accentColor, mutedColor, foregroundColor }) => {
  const currentIndex = 2; // Preview showing 3rd item active
  const totalItems = 8;
  
  console.log('[ProgressBarPreview] style:', style);

  // Bar style - single solid line (square)
  if (style === 'bar') {
    const progress = ((currentIndex + 1) / totalItems) * 100;
    return (
      <div className="flex items-center justify-center">
        <div 
          className="w-full max-w-[200px] h-1.5 overflow-hidden"
          style={{ backgroundColor: `hsl(${mutedColor})` }}
        >
          <div 
            className="h-full transition-all"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})` 
            }}
          />
        </div>
      </div>
    );
  }

  // Bar-rounded style - single solid line with rounded edges
  if (style === 'bar-rounded' || style === 'line') {
    const progress = ((currentIndex + 1) / totalItems) * 100;
    return (
      <div className="flex items-center justify-center">
        <div 
          className="w-full max-w-[200px] h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: `hsl(${mutedColor})` }}
        >
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})` 
            }}
          />
        </div>
      </div>
    );
  }

  if (style === 'pills') {
    return (
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: totalItems }).map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-sm transition-all"
            style={{
              width: '20px',
              backgroundColor: i <= currentIndex 
                ? `hsl(${accentColor})` 
                : `hsl(${mutedColor})`,
            }}
          />
        ))}
      </div>
    );
  }

  if (style === 'numbers') {
    return (
      <div className="flex items-center justify-center">
        <span 
          className="text-sm font-semibold"
          style={{ color: `hsl(${foregroundColor})` }}
        >
          <span style={{ color: `hsl(${accentColor})` }}>{currentIndex + 1}</span>
          <span className="opacity-50"> / {totalItems}</span>
        </span>
      </div>
    );
  }

  // Default: dots
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: totalItems }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            height: '6px',
            width: i === currentIndex ? '24px' : '8px',
            backgroundColor: i <= currentIndex 
              ? `hsl(${accentColor})` 
              : `hsl(${mutedColor})`,
          }}
        />
      ))}
    </div>
  );
};

export const DesignSystemEditor: React.FC<DesignSystemEditorProps> = ({
  config,
  onChange,
  isAdmin = false,
  selectedBaseSystemId,
  onBaseSystemSelect,
  onRenderSplit,
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
    // Apply the theme's config with defaults for any missing fields
    // Preserve course-specific themeBackgrounds and defaultBackgroundId if the theme doesn't have its own
    const themeConfig = system.config as Partial<DesignSystemConfig>;
    const newConfig: DesignSystemConfig = {
      ...DEFAULT_DESIGN_SYSTEM,
      ...themeConfig,
      themeId: system.id,
      // If the theme has its own backgrounds, use them; otherwise preserve course-specific ones
      themeBackgrounds: (themeConfig.themeBackgrounds && themeConfig.themeBackgrounds.length > 0)
        ? themeConfig.themeBackgrounds
        : config.themeBackgrounds || [],
      defaultBackgroundId: (themeConfig.themeBackgrounds && themeConfig.themeBackgrounds.length > 0)
        ? themeConfig.defaultBackgroundId
        : config.defaultBackgroundId,
    };
    
    // Update refs to prevent auto-save of the loaded config
    currentThemeIdRef.current = system.id;
    lastSavedConfigRef.current = JSON.stringify(newConfig);
    
    onChange(newConfig);
    // Always pass the system ID for visual selection
    onBaseSystemSelect?.(system.id);
    setActivePreset(null);
  };

  // Themes section
  const themesSection = (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">
        Темы
      </h3>
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
  );

  // Details section
  const detailsSection = isEditingRestricted ? (
    <div className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm">
      <p className="font-medium">Общая тема выбрана</p>
      <p className="text-xs mt-1 text-muted-foreground">
        Вы не можете редактировать параметры общих тем. Создайте свою тему, чтобы настроить дизайн.
      </p>
    </div>
  ) : !selectedBaseSystemId ? (
    <div className="p-3 rounded-xl bg-muted border border-border text-foreground text-sm">
      <p className="font-medium">Тема не выбрана</p>
      <p className="text-xs mt-1 text-muted-foreground">
        Выберите готовую тему выше или создайте свою для настройки дизайна курса.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
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
            <TabsTrigger value="quizblocks" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <MousePointerClick className="w-3.5 h-3.5 mr-1" />
              Блоки
            </TabsTrigger>
            <TabsTrigger value="blocks" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Layers className="w-3.5 h-3.5 mr-1" />
              Дизайн-блок
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Type className="w-3.5 h-3.5 mr-1" />
              Шрифты
            </TabsTrigger>
            <TabsTrigger value="sound" className="text-xs py-2 px-1 data-[state=active]:bg-background">
              <Volume2 className="w-3.5 h-3.5 mr-1" />
              Звуки
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
                  onChange={(backgrounds, newDefaultId) => {
                    if (newDefaultId !== undefined) {
                      updateConfig({ themeBackgrounds: backgrounds, defaultBackgroundId: newDefaultId });
                    } else {
                      updateConfig({ themeBackgrounds: backgrounds });
                    }
                  }}
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

              {/* Progress Bar Style */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Прогресс-бар"
                description="Стиль индикатора прогресса урока"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'bar', label: 'Полоса', icon: '▬▬▬' },
                      { value: 'bar-rounded', label: 'Полоса ○', icon: '━━━' },
                      { value: 'dots', label: 'Точки', icon: '● ● ●' },
                      { value: 'pills', label: 'Сегменты', icon: '▮ ▮ ▮' },
                      { value: 'numbers', label: 'Числа', icon: '3/10' },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => {
                          console.log('[ProgressBar] Clicked:', style.value);
                          updateConfig({ progressBarStyle: style.value as ProgressBarStyle });
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border-2 text-center transition-all",
                          (config.progressBarStyle ?? 'dots') === style.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="text-base mb-0.5 font-mono">{style.icon}</div>
                        <div className="text-[10px] font-medium">{style.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Progress Bar Preview */}
                  <div 
                    className="rounded-lg p-4"
                    style={{ 
                      backgroundColor: `hsl(${config.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor})` 
                    }}
                  >
                    <ProgressBarPreview 
                      style={(config.progressBarStyle ?? 'dots') as ProgressBarStyle}
                      accentColor={config.accentColor || DEFAULT_DESIGN_SYSTEM.accentColor}
                      mutedColor={config.mutedColor || DEFAULT_DESIGN_SYSTEM.mutedColor}
                      foregroundColor={config.foregroundColor || DEFAULT_DESIGN_SYSTEM.foregroundColor}
                    />
                  </div>
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === INTERACTIVE TAB: Quiz states, hints === */}
            <TabsContent value="interactive" className="space-y-4">
              {/* Answer Colors Card */}
              <SettingsCard
                icon={<Check className="w-4 h-4" />}
                title="Цвета ответов"
                description="Правильные, частично правильные и неправильные ответы"
              >
                <div className="space-y-3">
                  <ColorInput
                    label="Правильный"
                    value={config.successColor || DEFAULT_DESIGN_SYSTEM.successColor}
                    onChange={(v) => updateConfig({ successColor: v })}
                  />
                  <ColorInput
                    label="Почти"
                    value={config.partialColor || DEFAULT_DESIGN_SYSTEM.partialColor}
                    onChange={(v) => {
                      console.log('Partial color onChange:', v, 'current config.partialColor:', config.partialColor);
                      updateConfig({ partialColor: v });
                    }}
                  />
                  <ColorInput
                    label="Неправильный"
                    value={config.destructiveColor || DEFAULT_DESIGN_SYSTEM.destructiveColor}
                    onChange={(v) => updateConfig({ destructiveColor: v })}
                  />
                </div>
              </SettingsCard>

              {/* Rive Mascot Card */}
              <SettingsCard
                icon={<Play className="w-4 h-4" />}
                title="Rive-маскот"
                description="Анимированный персонаж для квизов"
              >
                <div className="space-y-4">
                  {/* Enable/disable toggle */}
                  <div className="flex items-center justify-between">
                    <Label>Включить маскота</Label>
                    <Switch
                      checked={config.mascot?.riveEnabled || false}
                      onCheckedChange={(checked) => updateConfig({
                        mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveEnabled: checked }
                      })}
                    />
                  </div>

                  {config.mascot?.riveEnabled && (
                    <>
                      {/* Rive file uploader */}
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
                      {config.mascot?.riveUrl && (
                        <div className="space-y-3 p-3 rounded-lg bg-muted/30 overflow-hidden">
                          <Label className="text-xs font-semibold">Настройки State Machine</Label>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Название State Machine</Label>
                            <Input
                              value={config.mascot?.riveStateMachine || DEFAULT_MASCOT_SETTINGS.riveStateMachine}
                              onChange={(e) => updateConfig({
                                mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveStateMachine: e.target.value }
                              })}
                              placeholder="State Machine 1"
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Триггеры состояний</Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16 shrink-0">Idle:</span>
                                <Input
                                  value={config.mascot?.riveIdleState || DEFAULT_MASCOT_SETTINGS.riveIdleState}
                                  onChange={(e) => updateConfig({
                                    mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveIdleState: e.target.value }
                                  })}
                                  placeholder="idle"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16 shrink-0">Correct:</span>
                                <Input
                                  value={config.mascot?.riveCorrectState || DEFAULT_MASCOT_SETTINGS.riveCorrectState}
                                  onChange={(e) => updateConfig({
                                    mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveCorrectState: e.target.value }
                                  })}
                                  placeholder="correct"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16 shrink-0">Incorrect:</span>
                                <Input
                                  value={config.mascot?.riveIncorrectState || DEFAULT_MASCOT_SETTINGS.riveIncorrectState}
                                  onChange={(e) => updateConfig({
                                    mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveIncorrectState: e.target.value }
                                  })}
                                  placeholder="incorrect"
                                  className="text-sm h-8"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Size selector */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Размер</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: 'small', label: 'Маленький' },
                                { value: 'medium', label: 'Средний' },
                                { value: 'large', label: 'Большой' },
                              ].map((size) => (
                                <button
                                  key={size.value}
                                  onClick={() => updateConfig({
                                    mascot: { ...DEFAULT_MASCOT_SETTINGS, ...config.mascot, riveSize: size.value as any }
                                  })}
                                  className={cn(
                                    "p-2 rounded-lg border-2 text-xs font-medium transition-all",
                                    (config.mascot?.riveSize || 'medium') === size.value
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  )}
                                >
                                  {size.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === QUIZ BLOCKS TAB: Matching, Ordering, Fill Blank, Slider === */}
            <TabsContent value="quizblocks" className="space-y-4">
              {/* Matching Block Card */}
              <SettingsCard
                icon={<Link2 className="w-4 h-4" />}
                title="Блок соответствия"
                description="Цвета для блока 'Соедините пары'"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ColorInput
                      label="Фон элемента"
                      value={config.designBlock?.matchingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBgColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, matchingItemBgColor: v } 
                      })}
                    />
                    <ColorInput
                      label="Рамка"
                      value={config.designBlock?.matchingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBorderColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, matchingItemBorderColor: v } 
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ColorInput
                      label="Верно"
                      value={config.designBlock?.matchingCorrectColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingCorrectColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, matchingCorrectColor: v } 
                      })}
                    />
                    <ColorInput
                      label="Неверно"
                      value={config.designBlock?.matchingIncorrectColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingIncorrectColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, matchingIncorrectColor: v } 
                      })}
                    />
                  </div>
                </div>
              </SettingsCard>

              {/* Ordering Block Card */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Блок порядка"
                description="Цвета для блока 'Расположите по порядку'"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ColorInput
                      label="Фон элемента"
                      value={config.designBlock?.orderingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingItemBgColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, orderingItemBgColor: v } 
                      })}
                    />
                    <ColorInput
                      label="Рамка"
                      value={config.designBlock?.orderingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingItemBorderColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, orderingItemBorderColor: v } 
                      })}
                    />
                  </div>
                  <ColorInput
                    label="Бейдж номера"
                    value={config.designBlock?.orderingBadgeColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingBadgeColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, orderingBadgeColor: v } 
                    })}
                  />
                </div>
              </SettingsCard>

              {/* Fill Blank Block Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Заполни пропуск"
                description="Цвета для поля ввода"
              >
                <div className="grid grid-cols-2 gap-2">
                  <ColorInput
                    label="Линия"
                    value={config.designBlock?.fillBlankUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.fillBlankUnderlineColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, fillBlankUnderlineColor: v } 
                    })}
                  />
                  <ColorInput
                    label="Текст"
                    value={config.designBlock?.fillBlankTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.fillBlankTextColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, fillBlankTextColor: v } 
                    })}
                  />
                </div>
              </SettingsCard>

              {/* Slider Block Card */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Ползунок"
                description="Цвета для слайдера"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ColorInput
                      label="Полоска"
                      value={config.designBlock?.sliderTrackColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderTrackColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, sliderTrackColor: v } 
                      })}
                    />
                    <ColorInput
                      label="Ползунок"
                      value={config.designBlock?.sliderThumbColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderThumbColor}
                      onChange={(v) => updateConfig({ 
                        designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, sliderThumbColor: v } 
                      })}
                    />
                  </div>
                  <ColorInput
                    label="Значение"
                    value={config.designBlock?.sliderValueColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderValueColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, sliderValueColor: v } 
                    })}
                  />
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === BLOCKS TAB: Design block settings === */}
            <TabsContent value="blocks" className="space-y-4">
              {/* Backdrop Card */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Подложки для текста"
                description="Цвет фона и текста для каждой подложки"
              >
                <div className="space-y-6">
                  {/* Light backdrop */}
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                    <Label className="text-xs font-semibold text-foreground">Светлая подложка</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorInput
                        label="Фон"
                        value={config.designBlock?.backdropLightColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropLightColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Текст"
                        value={config.designBlock?.backdropLightTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightTextColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropLightTextColor: v } 
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ColorInput
                        label="Маркер"
                        value={config.designBlock?.backdropLightMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightMarkerColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropLightMarkerColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Подчёрк."
                        value={config.designBlock?.backdropLightUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightUnderlineColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropLightUnderlineColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Волна"
                        value={config.designBlock?.backdropLightWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightWavyColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropLightWavyColor: v } 
                        })}
                      />
                    </div>
                  </div>
                  
                  {/* Dark backdrop */}
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                    <Label className="text-xs font-semibold text-foreground">Тёмная подложка</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorInput
                        label="Фон"
                        value={config.designBlock?.backdropDarkColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropDarkColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Текст"
                        value={config.designBlock?.backdropDarkTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkTextColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropDarkTextColor: v } 
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ColorInput
                        label="Маркер"
                        value={config.designBlock?.backdropDarkMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkMarkerColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropDarkMarkerColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Подчёрк."
                        value={config.designBlock?.backdropDarkUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkUnderlineColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropDarkUnderlineColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Волна"
                        value={config.designBlock?.backdropDarkWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkWavyColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropDarkWavyColor: v } 
                        })}
                      />
                    </div>
                  </div>
                  
                  {/* Primary backdrop */}
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                    <Label className="text-xs font-semibold text-foreground">Акцентная подложка</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorInput
                        label="Фон"
                        value={config.designBlock?.backdropPrimaryColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropPrimaryColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Текст"
                        value={config.designBlock?.backdropPrimaryTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryTextColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropPrimaryTextColor: v } 
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ColorInput
                        label="Маркер"
                        value={config.designBlock?.backdropPrimaryMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryMarkerColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropPrimaryMarkerColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Подчёрк."
                        value={config.designBlock?.backdropPrimaryUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryUnderlineColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropPrimaryUnderlineColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Волна"
                        value={config.designBlock?.backdropPrimaryWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryWavyColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropPrimaryWavyColor: v } 
                        })}
                      />
                    </div>
                  </div>
                  
                  {/* Blur backdrop */}
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                    <Label className="text-xs font-semibold text-foreground">Blur подложка</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <ColorInput
                        label="Фон"
                        value={config.designBlock?.backdropBlurColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropBlurColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Текст"
                        value={config.designBlock?.backdropBlurTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurTextColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropBlurTextColor: v } 
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ColorInput
                        label="Маркер"
                        value={config.designBlock?.backdropBlurMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurMarkerColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropBlurMarkerColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Подчёрк."
                        value={config.designBlock?.backdropBlurUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurUnderlineColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropBlurUnderlineColor: v } 
                        })}
                      />
                      <ColorInput
                        label="Волна"
                        value={config.designBlock?.backdropBlurWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurWavyColor}
                        onChange={(v) => updateConfig({ 
                          designBlock: { ...DEFAULT_DESIGN_BLOCK_SETTINGS, ...config.designBlock, backdropBlurWavyColor: v } 
                        })}
                      />
                    </div>
                  </div>
                </div>
              </SettingsCard>

              {/* Text Colors Card */}
              <SettingsCard
                icon={<Palette className="w-4 h-4" />}
                title="Цвета текста"
                description="Основной текст"
              >
                <ColorInput
                  label="Цвет текста"
                  value={config.foregroundColor || DEFAULT_DESIGN_SYSTEM.foregroundColor}
                  onChange={(v) => updateConfig({ foregroundColor: v })}
                />
              </SettingsCard>
              
              {/* Badge Color Card */}
              <SettingsCard
                icon={<Palette className="w-4 h-4" />}
                title="Цвет бейджей"
                description="Цвет саб-блоков бейджей"
              >
                <ColorInput
                  label="Цвет бейджей"
                  value={config.designBlock?.badgeColor || DEFAULT_DESIGN_BLOCK_SETTINGS.badgeColor}
                  onChange={(v) => updateConfig({ 
                    designBlock: { 
                      ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                      ...config.designBlock, 
                      badgeColor: v 
                    } 
                  })}
                />
              </SettingsCard>
              
              {/* Button Sub-block Card */}
              <SettingsCard
                icon={<MousePointerClick className="w-4 h-4" />}
                title="Саб-блок кнопки"
                description="Цвета фона и текста кнопки"
              >
                <div className="grid grid-cols-2 gap-3">
                  <ColorInput
                    label="Фон кнопки"
                    value={config.designBlock?.buttonBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.buttonBgColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        buttonBgColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Текст кнопки"
                    value={config.designBlock?.buttonTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.buttonTextColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        buttonTextColor: v 
                      } 
                    })}
                  />
                </div>
              </SettingsCard>
              
              {/* Table Sub-block Card */}
              <SettingsCard
                icon={<Layers className="w-4 h-4" />}
                title="Саб-блок таблицы"
                description="Цвета границ, заголовка и полос"
              >
                <div className="space-y-3">
                  {/* Table style row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Стиль углов</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateConfig({ 
                            designBlock: { 
                              ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                              ...config.designBlock, 
                              tableRounded: false 
                            } 
                          })}
                          className={cn(
                            "flex-1 px-3 py-2 text-xs rounded-lg border transition-colors",
                            !(config.designBlock?.tableRounded ?? DEFAULT_DESIGN_BLOCK_SETTINGS.tableRounded)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          Квадратные
                        </button>
                        <button
                          onClick={() => updateConfig({ 
                            designBlock: { 
                              ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                              ...config.designBlock, 
                              tableRounded: true 
                            } 
                          })}
                          className={cn(
                            "flex-1 px-3 py-2 text-xs rounded-lg border transition-colors",
                            (config.designBlock?.tableRounded ?? DEFAULT_DESIGN_BLOCK_SETTINGS.tableRounded)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          Закруглённые
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Border width */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Толщина рамки</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map((width) => (
                        <button
                          key={width}
                          onClick={() => updateConfig({ 
                            designBlock: { 
                              ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                              ...config.designBlock, 
                              tableBorderWidth: width 
                            } 
                          })}
                          className={cn(
                            "flex-1 px-3 py-2 text-xs rounded-lg border transition-colors",
                            (config.designBlock?.tableBorderWidth ?? DEFAULT_DESIGN_BLOCK_SETTINGS.tableBorderWidth) === width
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {width === 0 ? 'Нет' : `${width}px`}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <ColorInput
                    label="Цвет рамки"
                    value={config.designBlock?.tableBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.tableBorderColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        tableBorderColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Фон заголовка"
                    value={config.designBlock?.tableHeaderBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.tableHeaderBgColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        tableHeaderBgColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Полосатый фон 1"
                    value={config.designBlock?.tableStripeBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.tableStripeBgColor}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        tableStripeBgColor: v 
                      } 
                    })}
                  />
                  <ColorInput
                    label="Полосатый фон 2"
                    value={config.designBlock?.tableStripeBgColor2 || DEFAULT_DESIGN_BLOCK_SETTINGS.tableStripeBgColor2}
                    onChange={(v) => updateConfig({ 
                      designBlock: { 
                        ...DEFAULT_DESIGN_BLOCK_SETTINGS, 
                        ...config.designBlock, 
                        tableStripeBgColor2: v 
                      } 
                    })}
                  />
                </div>
              </SettingsCard>
            </TabsContent>

            {/* === TYPOGRAPHY TAB === */}
            <TabsContent value="typography" className="space-y-4">
              {/* Body Font Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Основной шрифт"
                description="Для основного текста и параграфов"
              >
                <FontSelectorWithCustom
                  value={config.fontFamily}
                  onChange={(v) => updateConfig({ fontFamily: v })}
                  customFonts={config.customFonts || []}
                  onCustomFontsChange={(fonts) => updateConfig({ customFonts: fonts })}
                  onAddCustomFont={(font, selectIt) => {
                    const newFonts = [...(config.customFonts || []), font];
                    updateConfig({ 
                      customFonts: newFonts,
                      ...(selectIt ? { fontFamily: font.family } : {})
                    });
                  }}
                  previewText="Пример текста с выбранным шрифтом — The quick brown fox"
                  previewClassName="text-sm"
                />
              </SettingsCard>

              {/* Heading Font Card */}
              <SettingsCard
                icon={<Type className="w-4 h-4" />}
                title="Шрифт заголовков"
                description="Для заголовков и подзаголовков"
              >
                <FontSelectorWithCustom
                  value={config.headingFontFamily}
                  onChange={(v) => updateConfig({ headingFontFamily: v })}
                  customFonts={config.customFonts || []}
                  onCustomFontsChange={(fonts) => updateConfig({ customFonts: fonts })}
                  onAddCustomFont={(font, selectIt) => {
                    const newFonts = [...(config.customFonts || []), font];
                    updateConfig({ 
                      customFonts: newFonts,
                      ...(selectIt ? { headingFontFamily: font.family } : {})
                    });
                  }}
                  previewText="Заголовок — Heading"
                  previewClassName="text-lg font-bold"
                />
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

          </div>
        </Tabs>
    </div>
  );

  // If onRenderSplit is provided, let parent control layout
  if (onRenderSplit) {
    return <>{onRenderSplit(themesSection, detailsSection)}</>;
  }

  // Default: render everything together
  return (
    <div className="space-y-6">
      {themesSection}
      {detailsSection}
    </div>
  );
};

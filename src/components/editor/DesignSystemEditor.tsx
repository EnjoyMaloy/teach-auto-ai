import React, { useState } from 'react';
import { 
  DesignSystemConfig, 
  DEFAULT_DESIGN_SYSTEM,
  DEFAULT_SOUND_SETTINGS,
  DEFAULT_DESIGN_BLOCK_SETTINGS,
  PRESET_THEMES,
  FONT_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  SoundTheme,
  ButtonDepth
} from '@/types/designSystem';
import { playSound, SOUND_THEME_OPTIONS } from '@/lib/sounds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesignSystemEditorProps {
  config: DesignSystemConfig;
  onChange: (config: DesignSystemConfig) => void;
}

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}> = ({ label, value, onChange, description }) => {
  // Convert HSL string to hex for the color picker
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
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#6366f1';
    }
  };
  
  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
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
  
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-border overflow-hidden cursor-pointer relative"
          style={{ backgroundColor: `hsl(${value})` }}
        >
          <input
            type="color"
            value={hslToHex(value)}
            onChange={(e) => onChange(hexToHsl(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs"
          placeholder="262 83% 58%"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export const DesignSystemEditor: React.FC<DesignSystemEditorProps> = ({
  config,
  onChange,
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const updateConfig = (updates: Partial<DesignSystemConfig>) => {
    onChange({ ...config, ...updates });
    setActivePreset(null);
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESET_THEMES.find(p => p.id === presetId);
    if (preset) {
      onChange({ ...DEFAULT_DESIGN_SYSTEM, ...preset.config });
      setActivePreset(presetId);
    }
  };

  const resetToDefault = () => {
    onChange(DEFAULT_DESIGN_SYSTEM);
    setActivePreset('default');
  };

  // Preview component
  const PreviewCard = () => (
    <div 
      className="rounded-2xl border overflow-hidden"
      style={{ 
        backgroundColor: `hsl(${config.cardColor})`,
        borderColor: `hsl(${config.mutedColor})`,
        borderRadius: config.borderRadius,
        fontFamily: config.fontFamily,
      }}
    >
      <div className="p-4 space-y-3">
        <h3 
          className="font-bold text-lg"
          style={{ 
            color: `hsl(${config.foregroundColor})`,
            fontFamily: config.headingFontFamily,
          }}
        >
          Предпросмотр
        </h3>
        <p 
          className="text-sm"
          style={{ color: `hsl(${config.foregroundColor})`, opacity: 0.7 }}
        >
          Так будет выглядеть ваш курс для учеников
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 text-sm font-medium transition-all"
            style={{ 
              backgroundColor: `hsl(${config.primaryColor})`,
              color: `hsl(${config.primaryForeground})`,
              borderRadius: config.buttonStyle === 'pill' ? '9999px' : 
                           config.buttonStyle === 'square' ? '0' : config.borderRadius,
            }}
          >
            Начать
          </button>
          <button
            className="px-4 py-2 text-sm font-medium border transition-all"
            style={{ 
              backgroundColor: 'transparent',
              color: `hsl(${config.primaryColor})`,
              borderColor: `hsl(${config.primaryColor})`,
              borderRadius: config.buttonStyle === 'pill' ? '9999px' : 
                           config.buttonStyle === 'square' ? '0' : config.borderRadius,
            }}
          >
            Подробнее
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <span 
            className="px-2 py-1 text-xs rounded-full"
            style={{ 
              backgroundColor: `hsl(${config.successColor} / 0.1)`,
              color: `hsl(${config.successColor})`,
            }}
          >
            ✓ Правильно
          </span>
          <span 
            className="px-2 py-1 text-xs rounded-full"
            style={{ 
              backgroundColor: `hsl(${config.destructiveColor} / 0.1)`,
              color: `hsl(${config.destructiveColor})`,
            }}
          >
            ✗ Неправильно
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Готовые темы
          </CardTitle>
          <CardDescription>
            Выберите готовую тему или настройте свою
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all text-left",
                  activePreset === preset.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex gap-1 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor})` }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.config.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor})` }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ 
                      backgroundColor: `hsl(${preset.config.foregroundColor || DEFAULT_DESIGN_SYSTEM.foregroundColor})`,
                      borderColor: `hsl(${preset.config.mutedColor || DEFAULT_DESIGN_SYSTEM.mutedColor})`
                    }}
                  />
                </div>
                <p className="text-sm font-medium">{preset.name}</p>
                {activePreset === preset.id && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToDefault}
            className="mt-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Сбросить
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Предпросмотр</CardTitle>
        </CardHeader>
        <CardContent 
          className="p-6 rounded-xl"
          style={{ backgroundColor: `hsl(${config.backgroundColor})` }}
        >
          <PreviewCard />
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Детальные настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="colors">
                <Palette className="w-4 h-4 mr-2" />
                Цвета
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="w-4 h-4 mr-2" />
                Шрифты
              </TabsTrigger>
              <TabsTrigger value="shape">
                <Square className="w-4 h-4 mr-2" />
                Форма
              </TabsTrigger>
              <TabsTrigger value="designblock">
                <Layers className="w-4 h-4 mr-2" />
                Дизайн-блок
              </TabsTrigger>
              <TabsTrigger value="sound">
                <Volume2 className="w-4 h-4 mr-2" />
                Звуки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
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
                  label="Фон"
                  value={config.backgroundColor}
                  onChange={(v) => updateConfig({ backgroundColor: v })}
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

                {/* Preview of backdrops */}
                <div className="space-y-2">
                  <Label>Предпросмотр подложек</Label>
                  <div 
                    className="p-4 rounded-xl space-y-3"
                    style={{ backgroundColor: `hsl(${config.backgroundColor})` }}
                  >
                    <div 
                      className="p-3 rounded-xl text-center text-sm"
                      style={{ backgroundColor: `hsl(${config.designBlock?.backdropLightColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightColor})` }}
                    >
                      <span style={{ color: `hsl(${config.foregroundColor})` }}>Светлая подложка</span>
                    </div>
                    <div 
                      className="p-3 rounded-xl text-center text-sm"
                      style={{ backgroundColor: `hsl(${config.designBlock?.backdropDarkColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkColor})` }}
                    >
                      <span className="text-white">Тёмная подложка</span>
                    </div>
                    <div 
                      className="p-3 rounded-xl text-center text-sm"
                      style={{ backgroundColor: `hsl(${config.designBlock?.backdropPrimaryColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryColor})` }}
                    >
                      <span style={{ color: `hsl(${config.primaryColor})` }}>Акцентная подложка</span>
                    </div>
                    <div 
                      className="p-3 rounded-xl text-center text-sm backdrop-blur-sm"
                      style={{ backgroundColor: `hsl(${config.designBlock?.backdropBlurColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurColor})` }}
                    >
                      <span style={{ color: `hsl(${config.foregroundColor})` }}>Blur-подложка</span>
                    </div>
                  </div>
                </div>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

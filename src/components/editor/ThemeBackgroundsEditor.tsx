import React, { useState, useRef } from 'react';
import { BackgroundPreset } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Plus, Trash2, Check, Edit, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnglePicker } from './AnglePicker';
import { parseHSL, formatHSL } from '@/lib/colorUtils';

interface ThemeBackgroundsEditorProps {
  backgrounds: BackgroundPreset[];
  onChange: (backgrounds: BackgroundPreset[], newDefaultId?: string) => void;
  defaultBackgroundId?: string;
  onDefaultChange: (id: string | undefined) => void;
  selectedBackgroundId?: string;
  onSelectBackground?: (id: string) => void;
  maxBackgrounds?: number;
  primaryColor?: string;
}

// Generate background presets based on accent color
function generateBackgroundsFromAccent(primaryHsl: string, variation: number): BackgroundPreset[] {
  const parsed = parseHSL(primaryHsl);
  if (!parsed) return [];

  const { h, s } = parsed;

  // 6 palette variations, each produces 5 backgrounds (3 solid + 2 gradient)
  const palettes: Array<{
    names: string[];
    bgs: Array<{ type: 'solid' | 'gradient'; color?: string; from?: string; to?: string; angle?: number }>;
  }> = [
    {
      names: ['Светлый', 'Тёплый', 'Насыщенный', 'Мягкий градиент', 'Глубокий градиент'],
      bgs: [
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.3), 95) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.4), 88) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.6), 78) },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.25), 95), to: formatHSL((h + 15) % 360, Math.round(s * 0.3), 90), angle: 135 },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.5), 82), to: formatHSL((h - 10 + 360) % 360, Math.round(s * 0.6), 70), angle: 160 },
      ],
    },
    {
      names: ['Пастельный', 'Дымчатый', 'Акцентный', 'Закат', 'Рассвет'],
      bgs: [
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.2), 96) },
        { type: 'solid', color: formatHSL((h + 8) % 360, Math.round(s * 0.15), 90) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.7), 75) },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.4), 90), to: formatHSL((h + 20) % 360, Math.round(s * 0.5), 85), angle: 120 },
        { type: 'gradient', from: formatHSL((h - 15 + 360) % 360, Math.round(s * 0.3), 93), to: formatHSL(h, Math.round(s * 0.4), 88), angle: 180 },
      ],
    },
    {
      names: ['Кремовый', 'Песочный', 'Терракот', 'Аналогичный', 'Глубина'],
      bgs: [
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.25), 94) },
        { type: 'solid', color: formatHSL((h + 5) % 360, Math.round(s * 0.35), 86) },
        { type: 'solid', color: formatHSL((h - 5 + 360) % 360, Math.round(s * 0.55), 72) },
        { type: 'gradient', from: formatHSL((h - 8 + 360) % 360, Math.round(s * 0.3), 92), to: formatHSL((h + 8) % 360, Math.round(s * 0.35), 88), angle: 145 },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.45), 80), to: formatHSL(h, Math.round(s * 0.65), 55), angle: 170 },
      ],
    },
    {
      names: ['Облачный', 'Пепельный', 'Бронзовый', 'Нежность', 'Контраст'],
      bgs: [
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.1), 97) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.18), 85) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.5), 60) },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.15), 96), to: formatHSL((h + 12) % 360, Math.round(s * 0.2), 92), angle: 110 },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.35), 85), to: formatHSL(h, Math.round(s * 0.55), 50), angle: 150 },
      ],
    },
    {
      names: ['Жемчужный', 'Льняной', 'Карамель', 'Сумерки', 'Восход'],
      bgs: [
        { type: 'solid', color: formatHSL((h + 10) % 360, Math.round(s * 0.15), 95) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.3), 87) },
        { type: 'solid', color: formatHSL((h - 5 + 360) % 360, Math.round(s * 0.6), 65) },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.2), 93), to: formatHSL((h - 15 + 360) % 360, Math.round(s * 0.25), 90), angle: 130 },
        { type: 'gradient', from: formatHSL((h + 10) % 360, Math.round(s * 0.4), 88), to: formatHSL(h, Math.round(s * 0.5), 75), angle: 155 },
      ],
    },
    {
      names: ['Молочный', 'Сливочный', 'Глиняный', 'Туман', 'Янтарь'],
      bgs: [
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.12), 97) },
        { type: 'solid', color: formatHSL((h + 6) % 360, Math.round(s * 0.28), 90) },
        { type: 'solid', color: formatHSL(h, Math.round(s * 0.45), 68) },
        { type: 'gradient', from: formatHSL(h, Math.round(s * 0.1), 96), to: formatHSL((h + 18) % 360, Math.round(s * 0.15), 93), angle: 140 },
        { type: 'gradient', from: formatHSL((h - 6 + 360) % 360, Math.round(s * 0.38), 82), to: formatHSL(h, Math.round(s * 0.55), 62), angle: 165 },
      ],
    },
  ];

  const palette = palettes[variation % palettes.length];
  return palette.bgs.map((bg, i) => ({
    id: `bg-gen-${Date.now()}-${i}`,
    name: palette.names[i],
    ...bg,
  }));
}

// Color input for HSL values
const ColorInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label?: string;
}> = ({ value, onChange, label }) => {
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
      return '#6366F1';
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
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

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted-foreground w-16">{label}</span>}
      {/* Larger color picker - 44px for better touch target */}
      <div 
        className="w-11 h-11 rounded-lg border border-border overflow-hidden cursor-pointer relative flex-shrink-0 hover:border-primary/50 transition-colors hover:scale-105"
        style={{ backgroundColor: `hsl(${value})` }}
      >
        <input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          aria-label={`Выбрать ${label || 'цвет'}`}
        />
      </div>
    </div>
  );
};

export const ThemeBackgroundsEditor: React.FC<ThemeBackgroundsEditorProps> = ({
  backgrounds,
  onChange,
  defaultBackgroundId,
  onDefaultChange,
  selectedBackgroundId,
  onSelectBackground,
  maxBackgrounds = 5,
  primaryColor,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBackground, setEditingBackground] = useState<BackgroundPreset | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'solid' | 'gradient'>('solid');
  const [newColor, setNewColor] = useState('0 0% 100%');
  const [newGradientFrom, setNewGradientFrom] = useState('262 83% 95%');
  const [newGradientTo, setNewGradientTo] = useState('200 83% 95%');
  const [newGradientAngle, setNewGradientAngle] = useState(135);
  const bgVariationRef = useRef(0);

  const handleGenerateFromAccent = () => {
    if (!primaryColor) return;
    const generated = generateBackgroundsFromAccent(primaryColor, bgVariationRef.current);
    bgVariationRef.current += 1;
    const defaultId = generated[0]?.id;
    onChange(generated, defaultId);
    if (defaultId) onDefaultChange(defaultId);
  };

  const canAddMore = backgrounds.length < maxBackgrounds;

  const openAddDialog = () => {
    setEditingBackground(null);
    setNewName(`Фон ${backgrounds.length + 1}`);
    setNewType('solid');
    setNewColor('0 0% 100%');
    setNewGradientFrom('262 83% 95%');
    setNewGradientTo('200 83% 95%');
    setNewGradientAngle(135);
    setIsDialogOpen(true);
  };

  const openEditDialog = (bg: BackgroundPreset) => {
    setEditingBackground(bg);
    setNewName(bg.name);
    setNewType(bg.type);
    if (bg.type === 'solid') {
      setNewColor(bg.color || '0 0% 100%');
    } else {
      setNewGradientFrom(bg.from || '262 83% 95%');
      setNewGradientTo(bg.to || '200 83% 95%');
      setNewGradientAngle(bg.angle || 135);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!newName.trim()) return;

    const newBg: BackgroundPreset = {
      id: editingBackground?.id || `bg-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      ...(newType === 'solid' 
        ? { color: newColor }
        : { from: newGradientFrom, to: newGradientTo, angle: newGradientAngle }
      ),
    };

    if (editingBackground) {
      onChange(backgrounds.map(bg => bg.id === editingBackground.id ? newBg : bg));
    } else {
      const newBackgrounds = [...backgrounds, newBg];
      // Set as default if it's the first background — pass in same call to avoid stale closure
      if (backgrounds.length === 0) {
        onChange(newBackgrounds, newBg.id);
      } else {
        onChange(newBackgrounds);
      }
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(backgrounds.filter(bg => bg.id !== id));
    if (defaultBackgroundId === id) {
      onDefaultChange(backgrounds.length > 1 ? backgrounds.find(bg => bg.id !== id)?.id : undefined);
    }
  };

  const setAsDefault = (id: string) => {
    onDefaultChange(id);
  };

  const getBackgroundStyle = (bg: BackgroundPreset): React.CSSProperties => {
    if (bg.type === 'gradient') {
      return { background: `linear-gradient(${bg.angle || 135}deg, hsl(${bg.from}), hsl(${bg.to}))` };
    }
    return { backgroundColor: `hsl(${bg.color})` };
  };

  return (
    <div className="space-y-3">
      {/* Generate from accent button */}
      {primaryColor && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateFromAccent}
          className="w-full gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Подобрать фоны из акцентного цвета
        </Button>
      )}

      {/* Background list */}
      <div className="grid grid-cols-3 gap-2">
        {backgrounds.map((bg) => {
          const isDefault = defaultBackgroundId === bg.id;
          const isSelected = selectedBackgroundId === bg.id;
          return (
            <div 
              key={bg.id} 
              className="relative group"
            >
              {/* Main background card - click to select for preview */}
              <button
                type="button"
                onClick={() => onSelectBackground?.(bg.id)}
                className={cn(
                  "w-full h-20 rounded-lg border-2 transition-all flex flex-col items-center justify-end pb-1.5 gap-0.5",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : isDefault
                      ? "border-primary/50"
                      : "border-border hover:border-primary/50"
                )}
                style={getBackgroundStyle(bg)}
                title={`${bg.name}${isDefault ? ' (по умолчанию)' : ''}`}
              >
                <span className={cn(
                  "text-xs font-medium bg-white/90 dark:bg-black/60 text-foreground/80 dark:text-white/90 px-2 py-0.5 rounded truncate max-w-[90%] transition-transform",
                  !isDefault && "group-hover:-translate-y-3"
                )}>
                  {bg.name}
                </span>
                {isDefault && (
                  <span className="text-[9px] font-medium text-primary bg-white/90 dark:bg-black/60 dark:text-primary px-1.5 py-0.5 rounded">
                    по умолчанию
                  </span>
                )}
              </button>
              
              {/* Action buttons - top right corner */}
              <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Edit button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(bg);
                  }}
                  className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-all hover:scale-110 shadow-sm"
                  title="Редактировать"
                >
                  <Edit className="w-3 h-3" />
                </button>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bg.id);
                  }}
                  className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-200 transition-all hover:scale-110 shadow-sm"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Set default button - bottom */}
              {!isDefault && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAsDefault(bg.id);
                  }}
                  className="absolute -bottom-1.5 right-1/2 translate-x-1/2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-sm"
                  title="Применить ко всем блокам курса"
                >
                  По умолч.
                </button>
              )}
            </div>
          );
        })}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={openAddDialog}
            className="h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBackground ? 'Редактировать фон' : 'Добавить фон'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Например: Светлый"
              />
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType('solid')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm transition-colors",
                  newType === 'solid'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Сплошной
              </button>
              <button
                type="button"
                onClick={() => setNewType('gradient')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm transition-colors",
                  newType === 'gradient'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Градиент
              </button>
            </div>

            {/* Color inputs */}
            {newType === 'solid' ? (
              <ColorInput 
                value={newColor} 
                onChange={setNewColor} 
                label="Цвет"
              />
            ) : (
              <div className="space-y-3">
                <ColorInput 
                  value={newGradientFrom} 
                  onChange={setNewGradientFrom} 
                  label="Начало"
                />
                <ColorInput 
                  value={newGradientTo} 
                  onChange={setNewGradientTo} 
                  label="Конец"
                />
                <AnglePicker 
                  value={newGradientAngle} 
                  onChange={setNewGradientAngle} 
                />
              </div>
            )}

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Предпросмотр</Label>
              <div 
                className="h-16 rounded-lg border border-border"
                style={
                  newType === 'gradient'
                    ? { background: `linear-gradient(${newGradientAngle}deg, hsl(${newGradientFrom}), hsl(${newGradientTo}))` }
                    : { backgroundColor: `hsl(${newColor})` }
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!newName.trim()}>
              {editingBackground ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

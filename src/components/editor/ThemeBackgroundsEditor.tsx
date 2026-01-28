import React, { useState } from 'react';
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
import { Plus, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeBackgroundsEditorProps {
  backgrounds: BackgroundPreset[];
  onChange: (backgrounds: BackgroundPreset[]) => void;
  defaultBackgroundId?: string;
  onDefaultChange: (id: string | undefined) => void;
  maxBackgrounds?: number;
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
      <div 
        className="w-8 h-8 rounded-lg border border-border overflow-hidden cursor-pointer relative flex-shrink-0"
        style={{ backgroundColor: `hsl(${value})` }}
      >
        <input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
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
  maxBackgrounds = 5,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBackground, setEditingBackground] = useState<BackgroundPreset | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'solid' | 'gradient'>('solid');
  const [newColor, setNewColor] = useState('0 0% 100%');
  const [newGradientFrom, setNewGradientFrom] = useState('262 83% 95%');
  const [newGradientTo, setNewGradientTo] = useState('200 83% 95%');
  const [newGradientAngle, setNewGradientAngle] = useState(135);

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
      onChange([...backgrounds, newBg]);
      // Set as default if it's the first background
      if (backgrounds.length === 0) {
        onDefaultChange(newBg.id);
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
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Фоны курса ({backgrounds.length}/{maxBackgrounds})</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Добавьте до {maxBackgrounds} фонов, которые можно будет использовать в блоках курса
      </p>

      {/* Background list */}
      <div className="grid grid-cols-5 gap-2">
        {backgrounds.map((bg) => {
          const isDefault = defaultBackgroundId === bg.id;
          return (
            <div 
              key={bg.id} 
              className="relative group"
            >
              <button
                type="button"
                onClick={() => openEditDialog(bg)}
                className={cn(
                  "w-full h-14 rounded-lg border-2 transition-all flex items-end justify-center pb-1",
                  isDefault
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                style={getBackgroundStyle(bg)}
                title={`${bg.name}${isDefault ? ' (по умолчанию)' : ''}`}
              >
                <span className="text-[10px] font-medium text-foreground/70 bg-white/80 px-1.5 py-0.5 rounded truncate max-w-full">
                  {bg.name}
                </span>
                {isDefault && (
                  <Check className="absolute top-1 right-1 w-3 h-3 text-primary" />
                )}
              </button>
              
              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(bg.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Set default button */}
              {!isDefault && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAsDefault(bg.id);
                  }}
                  className="absolute -bottom-1.5 right-1/2 translate-x-1/2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
            className="h-14 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center"
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Угол</span>
                  <Input
                    type="number"
                    value={newGradientAngle}
                    onChange={(e) => setNewGradientAngle(Number(e.target.value))}
                    min={0}
                    max={360}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">°</span>
                </div>
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

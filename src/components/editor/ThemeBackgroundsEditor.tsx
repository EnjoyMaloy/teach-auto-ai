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
import { Plus, Trash2, Check, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnglePicker } from './AnglePicker';

interface ThemeBackgroundsEditorProps {
  backgrounds: BackgroundPreset[];
  onChange: (backgrounds: BackgroundPreset[], newDefaultId?: string) => void;
  defaultBackgroundId?: string;
  onDefaultChange: (id: string | undefined) => void;
  selectedBackgroundId?: string;
  onSelectBackground?: (id: string) => void;
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
                  "text-xs font-medium text-foreground/80 bg-white/90 px-2 py-0.5 rounded truncate max-w-[90%] transition-transform",
                  !isDefault && "group-hover:-translate-y-3"
                )}>
                  {bg.name}
                </span>
                {isDefault && (
                  <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
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

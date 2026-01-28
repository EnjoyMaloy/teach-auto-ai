import React from 'react';
import { BackgroundPreset } from '@/types/designSystem';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface BlockBackgroundSelectorProps {
  backgrounds: BackgroundPreset[];
  selectedBackgroundId?: string;
  onChange: (backgroundId: string | undefined) => void;
}

export const BlockBackgroundSelector: React.FC<BlockBackgroundSelectorProps> = ({
  backgrounds,
  selectedBackgroundId,
  onChange,
}) => {
  if (!backgrounds || backgrounds.length === 0) {
    return null;
  }

  const getBackgroundStyle = (bg: BackgroundPreset): React.CSSProperties => {
    if (bg.type === 'gradient') {
      return { background: `linear-gradient(${bg.angle || 135}deg, hsl(${bg.from}), hsl(${bg.to}))` };
    }
    return { backgroundColor: `hsl(${bg.color})` };
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Фон блока</Label>
      <div className="flex gap-1.5 flex-wrap">
        {backgrounds.map((bg) => {
          const isSelected = selectedBackgroundId === bg.id;
          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => onChange(isSelected ? undefined : bg.id)}
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all relative",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
              style={getBackgroundStyle(bg)}
              title={bg.name}
            >
              {isSelected && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-primary drop-shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

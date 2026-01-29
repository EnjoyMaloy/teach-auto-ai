import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnhancedColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  showCopyButton?: boolean;
}

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
    return '262 83% 58%';
  }
};

export const EnhancedColorInput: React.FC<EnhancedColorInputProps> = ({
  label,
  value,
  onChange,
  description,
  showCopyButton = true,
}) => {
  const [hexValue, setHexValue] = useState(hslToHex(value));
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  // Update hex when value prop changes (from outside)
  useEffect(() => {
    if (!isFocused) {
      setHexValue(hslToHex(value));
    }
  }, [value, isFocused]);

  const handleHexChange = (newHex: string) => {
    // Remove # and any non-hex characters, then take first 6 chars
    const cleaned = newHex.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexValue(cleaned.toUpperCase());
    
    // Save immediately when we have a valid 6-character hex
    if (cleaned.length === 6) {
      onChange(hexToHsl(cleaned));
    }
  };

  // Handle paste event to immediately apply pasted color
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = pasted.replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    
    if (cleaned.length === 6) {
      setHexValue(cleaned.toUpperCase());
      onChange(hexToHsl(cleaned));
    } else if (cleaned.length > 0) {
      setHexValue(cleaned.toUpperCase());
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
      await navigator.clipboard.writeText(`#${fullHex}`);
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
        {/* Larger color picker - 48px instead of 40px */}
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
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-7 pr-10 font-mono text-sm uppercase tracking-wider bg-background"
            placeholder="FFFFFF"
            maxLength={6}
            aria-label={`${label} HEX код`}
          />
          {/* Copy button inside input */}
          {showCopyButton && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors",
                copied 
                  ? "text-green-600" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Копировать HEX"
              aria-label="Копировать HEX код"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

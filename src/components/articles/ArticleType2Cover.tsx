import React from 'react';
import { cn } from '@/lib/utils';

interface ArticleType2CoverProps {
  variant: 'banner' | 'square';
  gradient: string;
  image: string | null;
  title: string;
  titleColor?: string;
  className?: string;
  /** Optional content to show inside the media frame placeholder when no image */
  placeholder?: React.ReactNode;
  /** Optional click handler for media area (used in editor) */
  onMediaClick?: () => void;
  /** Slot above (banner) — children rendered as overlay icons (top-right) */
  overlay?: React.ReactNode;
}

// Parse a hex (#rrggbb) to {r,g,b}
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = hex.trim().match(/^#?([a-f\d]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

// Darken a hex by a factor (0..1). 0.18 ≈ "two tones darker"
const darken = (hex: string, amount = 0.18): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
};

/**
 * Extract the first hex color from a linear-gradient string and produce a
 * darker "shadow frame" color (2 tones darker).
 */
const getShadowColor = (gradient: string): string => {
  const hexes = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return 'rgba(0,0,0,0.15)';
  // Use the darker (first) color as base
  return darken(hexes[0], 0.22);
};

/**
 * Type-2 cover renderer. Used both for banner (4:1) and square (1:1) shapes.
 * - Square media frame tilted 1deg in front
 * - Background frame (no tilt) shifted bottom-left, 2 tones darker
 * - Title in Wix Madefor Display Regular
 */
const ArticleType2Cover: React.FC<ArticleType2CoverProps> = ({
  variant,
  gradient,
  image,
  title,
  titleColor = '#1f1f1f',
  className,
  placeholder,
  onMediaClick,
  overlay,
}) => {
  const shadow = getShadowColor(gradient);
  const isBanner = variant === 'banner';

  // Media frame element — used in both layouts
  const MediaFrame = (
    <div className={cn('relative shrink-0', isBanner ? 'h-[82%] aspect-square' : 'w-[55%] aspect-square')}>
      {/* Background frame (offset bottom-left, no tilt) */}
      <div
        className="absolute rounded-2xl"
        style={{
          backgroundColor: shadow,
          inset: 0,
          transform: 'translate(-6%, 6%)',
        }}
      />
      {/* Foreground frame (tilted 1deg) */}
      <div
        onClick={onMediaClick}
        className={cn(
          'absolute inset-0 rounded-2xl bg-white overflow-hidden flex items-center justify-center',
          onMediaClick && 'cursor-pointer'
        )}
        style={{ transform: 'rotate(1deg)' }}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          placeholder
        )}
      </div>
    </div>
  );

  if (isBanner) {
    return (
      <div
        className={cn(
          'w-full rounded-2xl overflow-hidden border border-border shadow-md flex items-center gap-6 px-8 relative',
          className
        )}
        style={{ background: gradient, aspectRatio: '4 / 1' }}
      >
        {overlay}
        <h3
          className="flex-1 leading-[1.1] line-clamp-3 text-left"
          style={{
            fontFamily: '"Wix Madefor Display", system-ui, sans-serif',
            fontWeight: 400,
            color: titleColor,
            fontSize: 'clamp(20px, 4.2vw, 56px)',
          }}
        >
          {title}
        </h3>
        {MediaFrame}
      </div>
    );
  }

  // Square variant — text centered below tilted frame
  return (
    <div
      className={cn(
        'w-full rounded-2xl overflow-hidden border border-border shadow-md flex flex-col items-center justify-center gap-5 p-6 relative',
        className
      )}
      style={{ background: gradient, aspectRatio: '1 / 1' }}
    >
      {overlay}
      {MediaFrame}
      <h3
        className="leading-[1.1] line-clamp-3 text-center px-2"
        style={{
          fontFamily: '"Wix Madefor Display", system-ui, sans-serif',
          fontWeight: 400,
          color: titleColor,
          fontSize: 'clamp(14px, 3.2vw, 28px)',
        }}
      >
        {title}
      </h3>
    </div>
  );
};

export default ArticleType2Cover;

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

// Darken a hex by a factor (0..1).
const darken = (hex: string, amount = 0.10): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
};

/**
 * Extract the first hex color from a linear-gradient string and produce a
 * "shadow frame" color one tone darker than the gradient base.
 */
const getShadowColor = (gradient: string): string => {
  const hexes = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return 'rgba(0,0,0,0.10)';
  // Use the darker (first) color as base; one tone darker
  return darken(hexes[0], 0.10);
};

// Shadow frame offset (percent of media frame size) — used to compute
// total bounding box of the (frame + shadow) group for centering.
const SHADOW_OFFSET = 0.06; // 6%

interface MediaFrameProps {
  size: string; // CSS size (width === height)
  image: string | null;
  placeholder?: React.ReactNode;
  onMediaClick?: () => void;
  shadow: string;
}

/**
 * Renders the (frame + shadow) group, vertically/horizontally centered
 * inside its wrapper. The wrapper accounts for the shadow's offset so the
 * GROUP (not just the front frame) is centered.
 */
const MediaGroup: React.FC<MediaFrameProps> = ({ size, image, placeholder, onMediaClick, shadow }) => {
  // The group's effective bounding box has extra space on bottom-left equal to
  // SHADOW_OFFSET * size. Add equivalent transparent padding on top-right so
  // that centering the wrapper centers the visual group.
  const padPct = `${SHADOW_OFFSET * 100}%`;
  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        // Compensate so the visual group (frame + shadow) is centered inside this box
        paddingRight: padPct,
        paddingTop: padPct,
        boxSizing: 'content-box',
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background frame (offset bottom-left, no tilt) */}
        <div
          className="absolute rounded-xl"
          style={{
            backgroundColor: shadow,
            inset: 0,
            transform: `translate(-${SHADOW_OFFSET * 100}%, ${SHADOW_OFFSET * 100}%)`,
          }}
        />
        {/* Foreground frame (tilted 1deg) */}
        <div
          onClick={onMediaClick}
          className={cn(
            'absolute inset-0 rounded-xl bg-white overflow-hidden flex items-center justify-center',
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
    </div>
  );
};

/**
 * Type-2 cover renderer.
 * - banner (4:1): text left, media right, group vertically centered
 * - square: matches Type 1 layout — square media area on top, text below (no fixed 1:1 outer ratio)
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

  if (variant === 'banner') {
    // Inner banner content height ≈ 100% (4:1 box). Use a sized media group
    // so we can center the (frame + shadow) bounding box vertically.
    return (
      <div
        className={cn(
          'w-full rounded-xl overflow-hidden border border-border shadow-md flex items-center gap-6 px-8 relative',
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
        <MediaGroup
          size="78%"
          image={image}
          placeholder={placeholder}
          onMediaClick={onMediaClick}
          shadow={shadow}
        />
      </div>
    );
  }

  // Square (cover preview) — match Type 1 layout: square media area on top + text below.
  return (
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden border border-border shadow-md relative',
        className
      )}
      style={{ background: gradient }}
    >
      {overlay}
      {/* Square media region */}
      <div className="w-full aspect-square flex items-center justify-center p-5">
        <MediaGroup
          size="84%"
          image={image}
          placeholder={placeholder}
          onMediaClick={onMediaClick}
          shadow={shadow}
        />
      </div>
      {/* Title below */}
      <div className="px-4 pb-5 pt-0">
        <h3
          className="leading-[1.15] line-clamp-3 text-center"
          style={{
            fontFamily: '"Wix Madefor Display", system-ui, sans-serif',
            fontWeight: 400,
            color: titleColor,
            fontSize: 'clamp(14px, 3.4vw, 28px)',
          }}
        >
          {title}
        </h3>
      </div>
    </div>
  );
};

export default ArticleType2Cover;

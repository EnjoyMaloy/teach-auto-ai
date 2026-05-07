import React from 'react';
import { cn } from '@/lib/utils';
import { getAutoTitleColor } from '@/lib/gradientTextColor';

interface ArticleType2CoverProps {
  variant: 'banner' | 'square';
  gradient: string;
  image: string | null;
  title: string;
  /** If omitted, color is auto-computed for contrast against the gradient. */
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
  /** CSS size of the square frame (width === height). */
  size: string;
  image: string | null;
  placeholder?: React.ReactNode;
  onMediaClick?: () => void;
  shadow: string;
}

/**
 * Renders the (frame + shadow) group. The wrapper is exactly the size of the
 * front frame; the shadow extends visibly outside via translate. Use the
 * `className` on the parent to position/center this group as desired.
 */
const MediaGroup: React.FC<MediaFrameProps> = ({ size, image, placeholder, onMediaClick, shadow }) => {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
  titleColor,
  className,
  placeholder,
  onMediaClick,
  overlay,
}) => {
  const shadow = getShadowColor(gradient);
  const resolvedTitleColor = titleColor ?? getAutoTitleColor(gradient);

  if (variant === 'banner') {
    // Group bbox = front frame + shadow extending 6% bottom-left.
    // Group sized 1:1 by banner height. Shift up by half the shadow offset
    // so the visual GROUP (not just the front frame) is vertically centered.
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
        <div
          className="h-[78%] aspect-square shrink-0"
          style={{ transform: `translateY(-${(SHADOW_OFFSET * 100) / 2}%)` }}
        >
          <MediaGroup
            size="100%"
            image={image}
            placeholder={placeholder}
            onMediaClick={onMediaClick}
            shadow={shadow}
          />
        </div>
      </div>
    );
  }

  // Square (cover preview) — square media region on top + reserved title block below.
  // Both regions have fixed dimensions independent of title length, so RU/EN cards
  // always render at the same size.
  return (
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden border border-border shadow-md relative',
        className
      )}
      style={{ background: gradient }}
    >
      {overlay}
      {/* Square media region — horizontally center the visual GROUP (frame + shadow). */}
      <div className="w-full aspect-square flex items-center justify-center p-5 pb-2">
        <div
          className="aspect-square"
          style={{
            width: '84%',
            transform: `translate(${(SHADOW_OFFSET * 100) / 2}%, -${(SHADOW_OFFSET * 100) / 2}%)`,
          }}
        >
          <MediaGroup
            size="100%"
            image={image}
            placeholder={placeholder}
            onMediaClick={onMediaClick}
            shadow={shadow}
          />
        </div>
      </div>
      {/* Title — reserve a fixed 3-line block based on the actual heading font size,
          so RU/EN cards always keep the same total height. */}
      <div className="px-4 pb-5 pt-0 -mt-2">
        <div
          className="w-full flex items-center justify-center"
          style={{ minHeight: 'clamp(48.3px, 11.73vw, 96.6px)' }}
        >
          <h3
            className="leading-[1.15] line-clamp-3 text-center w-full"
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
    </div>
  );
};

export default ArticleType2Cover;

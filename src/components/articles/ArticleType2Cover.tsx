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
 * Pick a "shadow frame" color from the gradient.
 * - Dark background  → lighten by 35 % (3.5 tones)
 * - Light background → darken by 35 % (3.5 tones)
 */
const getShadowColor = (gradient: string): string => {
  const hexes = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return '#1f1f1f';

  const c1 = hexToRgb(hexes[0]);
  const c2 = hexToRgb(hexes[1] ?? hexes[0]);
  if (!c1 || !c2) return '#1f1f1f';

  const avgR = (c1.r + c2.r) / 2;
  const avgG = (c1.g + c2.g) / 2;
  const avgB = (c1.b + c2.b) / 2;

  const avgBrightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
  const isDark = avgBrightness < 128;

  // RGB → HSL
  const r = avgR / 255, g = avgG / 255, b = avgB / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Shift lightness by 35 % (3.5 tones)
  const TONE_SHIFT = 0.35;
  l = isDark ? Math.min(1, l + TONE_SHIFT) : Math.max(0, l - TONE_SHIFT);

  // HSL → RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r2: number, g2: number, b2: number;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex(r2 * 255, g2 * 255, b2 * 255);
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
            color: resolvedTitleColor,
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
              color: resolvedTitleColor,
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

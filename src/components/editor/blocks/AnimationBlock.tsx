import React from 'react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';
import { RiveAnimation } from './RiveAnimation';
import { LottieAnimation } from './LottieAnimation';

export type AnimationType = 'rive' | 'lottie';

interface AnimationBlockProps {
  src?: string;
  animationType?: AnimationType;
  size?: 'small' | 'medium' | 'large' | 'full';
  autoplay?: boolean;
  loop?: boolean;
  stateMachine?: string; // For Rive
  isEditing?: boolean;
  onUpdate?: (updates: { 
    animationUrl?: string; 
    animationType?: AnimationType;
    animationStateMachine?: string;
  }) => void;
  designSystem?: {
    primaryColor?: string;
    foregroundColor?: string;
    mutedColor?: string;
  };
}

export const AnimationBlock: React.FC<AnimationBlockProps> = ({
  src,
  animationType,
  size = 'medium',
  autoplay = true,
  loop = true,
  stateMachine,
  isEditing = false,
  onUpdate,
  designSystem,
}) => {

  const ds = {
    primaryColor: designSystem?.primaryColor || '262 83% 58%',
    foregroundColor: designSystem?.foregroundColor || '240 10% 4%',
    mutedColor: designSystem?.mutedColor || '240 5% 96%',
  };

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-72 h-72',
    full: 'w-full aspect-square max-w-md',
  };

  // Auto-detect animation type from URL/data
  const detectAnimationType = (url: string): AnimationType => {
    if (url.endsWith('.riv') || url.startsWith('data:application/octet-stream')) {
      return 'rive';
    }
    if (url.endsWith('.json') || url.startsWith('data:application/json') || url.startsWith('{')) {
      return 'lottie';
    }
    // Default to lottie as it's more common
    return 'lottie';
  };

  // If we have a src but no type, try to detect it
  const effectiveType = animationType || (src ? detectAnimationType(src) : undefined);

  // If no animation, show placeholder
  if (!src) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6', sizeClasses[size])}
        style={{ borderColor: `hsl(${ds.mutedColor})` }}
      >
        <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
        <span className="text-xs text-muted-foreground text-center">
          {isEditing ? 'Выберите формат и загрузите файл →' : 'Нет анимации'}
        </span>
      </div>
    );
  }

  // If type is set or we have source, render appropriate animation component
  if (effectiveType === 'rive') {
    return (
      <RiveAnimation
        src={src}
        size={size}
        autoplay={autoplay}
        stateMachine={stateMachine}
        isEditing={isEditing}
        onUpdate={(updates) => {
          onUpdate?.({ ...updates, animationType: 'rive' });
        }}
        designSystem={designSystem}
      />
    );
  }

  if (effectiveType === 'lottie') {
    return (
      <LottieAnimation
        src={src}
        size={size}
        autoplay={autoplay}
        loop={loop}
        isEditing={isEditing}
        onUpdate={(updates) => {
          onUpdate?.({ ...updates, animationType: 'lottie' });
        }}
        designSystem={designSystem}
      />
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center rounded-xl', sizeClasses[size])}
      style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
    >
      <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
    </div>
  );
};

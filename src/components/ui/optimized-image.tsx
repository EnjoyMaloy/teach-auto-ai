/**
 * OptimizedImage - компонент для оптимизированного отображения картинок
 * Плавное появление, lazy loading, error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string | undefined;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = '',
  className,
  style,
  fallbackClassName,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Сбрасываем состояние при смене src
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    // Проверяем, если картинка уже в кэше браузера
    if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!src || hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted/50',
          fallbackClassName || className
        )}
        style={style}
      >
        <ImageOff className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'transition-opacity duration-200',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={style}
      loading="eager" // Не lazy, т.к. используем предзагрузку
      decoding="async"
    />
  );
};

import React, { useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link, Play, AlertCircle } from 'lucide-react';

interface LottieAnimationProps {
  src?: string; // JSON string or URL
  size?: 'small' | 'medium' | 'large' | 'full';
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  isEditing?: boolean;
  onUpdate?: (updates: { animationUrl?: string }) => void;
  designSystem?: {
    primaryColor?: string;
    foregroundColor?: string;
    mutedColor?: string;
  };
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  size = 'medium',
  loop = true,
  autoplay = true,
  speed = 1,
  isEditing = false,
  onUpdate,
  designSystem,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Load animation data when src changes
  React.useEffect(() => {
    if (!src) {
      setAnimationData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadAnimation = async () => {
      try {
        // Check if src is already JSON data (starts with { or [)
        if (src.startsWith('{') || src.startsWith('[')) {
          const data = JSON.parse(src);
          setAnimationData(data);
          setLoading(false);
          return;
        }

        // Check if src is a data URL with JSON
        if (src.startsWith('data:application/json')) {
          const base64 = src.split(',')[1];
          const jsonString = atob(base64);
          const data = JSON.parse(jsonString);
          setAnimationData(data);
          setLoading(false);
          return;
        }

        // Fetch from URL
        const response = await fetch(src);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setAnimationData(data);
        setLoading(false);
      } catch (err) {
        console.error('Lottie load error:', err);
        setLoading(false);
        setError('Не удалось загрузить анимацию');
      }
    };

    loadAnimation();
  }, [src]);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Пожалуйста, выберите файл .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Validate it's valid JSON
        JSON.parse(content);
        // Store as data URL for consistency
        const dataUrl = `data:application/json;base64,${btoa(content)}`;
        onUpdate?.({ animationUrl: dataUrl });
        setError(null);
      } catch {
        setError('Неверный формат JSON');
      }
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsText(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    onUpdate?.({ animationUrl: urlInput.trim() });
    setShowUrlInput(false);
    setUrlInput('');
    setError(null);
  };

  // If no animation is set, show upload/URL input
  if (!src && isEditing) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6', sizeClasses[size])}
        style={{ borderColor: `hsl(${ds.mutedColor})` }}
      >
        {showUrlInput ? (
          <div className="w-full space-y-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/animation.json"
              className="text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUrlSubmit();
                }}
              >
                Добавить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(false);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
            <span className="text-xs text-center" style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}>
              Lottie-анимация
            </span>
            <div className="flex gap-2">
              <label>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-3 h-3 mr-1" />
                    JSON
                  </span>
                </Button>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
              >
                <Link className="w-3 h-3 mr-1" />
                URL
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // If no animation and not editing, show placeholder
  if (!src) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-xl', sizeClasses[size])}
        style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
      >
        <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
      </div>
    );
  }

  // Show animation
  return (
    <div className={cn('relative', sizeClasses[size])}>
      {loading && (
        <div
          className={cn('absolute inset-0 flex items-center justify-center rounded-xl')}
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error ? (
        <div
          className={cn('flex flex-col items-center justify-center gap-2 rounded-xl w-full h-full')}
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <AlertCircle className="w-6 h-6 text-destructive" />
          <span className="text-xs text-destructive text-center px-2">{error}</span>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate?.({ animationUrl: '' });
                setError(null);
              }}
            >
              Удалить
            </Button>
          )}
        </div>
      ) : animationData ? (
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}

      {isEditing && !error && !loading && animationData && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate?.({ animationUrl: '' });
            setAnimationData(null);
          }}
        >
          ×
        </Button>
      )}
    </div>
  );
};

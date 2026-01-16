import React, { useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link, Play, AlertCircle } from 'lucide-react';

interface RiveAnimationProps {
  src?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  stateMachine?: string;
  autoplay?: boolean;
  isEditing?: boolean;
  onUpdate?: (updates: { animationUrl?: string; animationStateMachine?: string }) => void;
  designSystem?: {
    primaryColor?: string;
    foregroundColor?: string;
    mutedColor?: string;
  };
}

export const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src,
  size = 'medium',
  stateMachine,
  autoplay = true,
  isEditing = false,
  onUpdate,
  designSystem,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const { rive, RiveComponent } = useRive({
    src: src || '',
    stateMachines: stateMachine ? [stateMachine] : undefined,
    autoplay: autoplay,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoadError: (err) => {
      console.error('Rive load error:', err);
      setError('Не удалось загрузить анимацию');
    },
    onLoad: () => {
      setError(null);
    },
  });

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.riv')) {
      setError('Пожалуйста, выберите файл .riv');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdate?.({ animationUrl: dataUrl });
      setError(null);
    };
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    // Basic URL validation
    if (!urlInput.endsWith('.riv') && !urlInput.includes('rive')) {
      setError('URL должен указывать на .riv файл');
      return;
    }
    
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
              placeholder="https://example.com/animation.riv"
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
              Rive-анимация
            </span>
            <div className="flex gap-2">
              <label>
                <input
                  type="file"
                  accept=".riv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-3 h-3 mr-1" />
                    Файл
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
      {error ? (
        <div 
          className={cn('flex flex-col items-center justify-center gap-2 rounded-xl', sizeClasses[size])}
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <AlertCircle className="w-6 h-6 text-destructive" />
          <span className="text-xs text-destructive">{error}</span>
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
      ) : (
        <RiveComponent className="w-full h-full" />
      )}
      
      {isEditing && !error && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate?.({ animationUrl: '' });
          }}
        >
          ×
        </Button>
      )}
    </div>
  );
};

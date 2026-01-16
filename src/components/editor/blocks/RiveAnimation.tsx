import React, { useState, useEffect, useRef } from 'react';
import { Rive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link, Play, AlertCircle, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [riveInstance, setRiveInstance] = useState<Rive | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Initialize Rive when src changes
  useEffect(() => {
    if (!src || !canvasRef.current) return;

    setLoading(true);
    setError(null);

    // Cleanup previous instance
    if (riveInstance) {
      riveInstance.cleanup();
      setRiveInstance(null);
    }

    const initRive = async () => {
      try {
        let buffer: ArrayBuffer;

        // Check if src is a data URL (base64)
        if (src.startsWith('data:')) {
          // Convert base64 to ArrayBuffer
          const base64 = src.split(',')[1];
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          buffer = bytes.buffer;
        } else {
          // Fetch from URL
          const response = await fetch(src);
          if (!response.ok) throw new Error('Failed to fetch');
          buffer = await response.arrayBuffer();
        }

        const rive = new Rive({
          buffer,
          canvas: canvasRef.current!,
          autoplay: autoplay,
          layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
          }),
          onLoad: () => {
            setLoading(false);
            setError(null);
            // Play first animation or state machine
            if (stateMachine) {
              rive.play(stateMachine);
            } else {
              rive.play();
            }
          },
          onLoadError: (err) => {
            console.error('Rive load error:', err);
            setLoading(false);
            setError('Не удалось загрузить анимацию');
          },
        });

        setRiveInstance(rive);
      } catch (err) {
        console.error('Rive init error:', err);
        setLoading(false);
        setError('Ошибка загрузки анимации');
      }
    };

    initRive();

    return () => {
      if (riveInstance) {
        riveInstance.cleanup();
      }
    };
  }, [src, autoplay, stateMachine]);

  // Resize handler
  useEffect(() => {
    if (riveInstance) {
      riveInstance.resizeDrawingSurfaceToCanvas();
    }
  }, [riveInstance, size]);

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
      {loading && (
        <div 
          className={cn('absolute inset-0 flex items-center justify-center rounded-xl', sizeClasses[size])}
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: `hsl(${ds.primaryColor})` }} />
        </div>
      )}
      
      {error ? (
        <div 
          className={cn('flex flex-col items-center justify-center gap-2 rounded-xl', sizeClasses[size])}
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
      ) : (
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      )}
      
      {isEditing && !error && !loading && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (riveInstance) {
              riveInstance.cleanup();
              setRiveInstance(null);
            }
            onUpdate?.({ animationUrl: '' });
          }}
        >
          ×
        </Button>
      )}
    </div>
  );
};

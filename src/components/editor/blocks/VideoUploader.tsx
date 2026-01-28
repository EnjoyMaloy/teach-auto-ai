import React, { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle, Link, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface VideoUploaderProps {
  videoUrl?: string;
  onUpdate: (url: string | undefined) => void;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  isVertical: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ videoUrl, onUpdate }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          isVertical: video.videoHeight > video.videoWidth,
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Не удалось загрузить метаданные видео'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const validateVideo = (metadata: VideoMetadata): { valid: boolean; message?: string } => {
    const { duration, isVertical } = metadata;
    
    if (isVertical) {
      // Vertical video: max 1 minute (60 seconds)
      if (duration > 60) {
        return {
          valid: false,
          message: `Вертикальное видео должно быть до 1 минуты. Текущая длительность: ${Math.round(duration)} сек.`,
        };
      }
    } else {
      // Horizontal video: max 1 hour (3600 seconds)
      if (duration > 3600) {
        return {
          valid: false,
          message: `Горизонтальное видео должно быть до 1 часа. Текущая длительность: ${Math.round(duration / 60)} мин.`,
        };
      }
    }
    
    return { valid: true };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Необходима авторизация для загрузки видео');
      return;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат. Используйте MP4, WebM, MOV или AVI.');
      return;
    }

    // Check file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 500 МБ.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Get video metadata
      const metadata = await getVideoMetadata(file);
      setUploadProgress(20);

      // Validate duration based on orientation
      const validation = validateVideo(metadata);
      if (!validation.valid) {
        toast.error(validation.message);
        setIsUploading(false);
        return;
      }

      // Generate unique filename with user folder for RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/videos/${fileName}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setUploadProgress(90);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onUpdate(urlData.publicUrl);
      
      const orientationText = metadata.isVertical ? 'вертикальное' : 'горизонтальное';
      const durationText = metadata.duration < 60 
        ? `${Math.round(metadata.duration)} сек` 
        : `${Math.round(metadata.duration / 60)} мин`;
      
      toast.success(`Видео загружено! (${orientationText}, ${durationText})`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Ошибка загрузки видео');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    onUpdate(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Ссылка на видео добавлена');
  };

  const handleRemove = async () => {
    if (videoUrl?.includes('course-videos')) {
      // Extract file path and delete from storage
      try {
        const path = videoUrl.split('course-videos/')[1];
        if (path) {
          await supabase.storage.from('course-videos').remove([path]);
        }
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }
    onUpdate(undefined);
    toast.success('Видео удалено');
  };

  // Check if it's a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          {isYouTubeUrl(videoUrl) ? (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          className="w-full rounded-xl"
        >
          Удалить видео
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        className="hidden"
        onChange={handleFileSelect}
      />

      {isUploading ? (
        <div className="border-2 border-dashed border-primary rounded-2xl p-8 text-center bg-primary/5">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground mb-2">Загрузка видео...</p>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
        </div>
      ) : showUrlInput ? (
        <div className="space-y-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://youtube.com/watch?v=... или прямая ссылка"
            className="rounded-xl"
          />
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="flex-1 rounded-xl"
            >
              Добавить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(false)}
              className="rounded-xl"
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Загрузить видео</p>
            <p className="text-xs text-muted-foreground">MP4, WebM, MOV до 500 МБ</p>
          </button>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Вертикальное: до 1 мин • Горизонтальное: до 1 часа</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="w-full rounded-xl"
          >
            <Link className="w-4 h-4 mr-2" />
            Вставить ссылку (YouTube и др.)
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper function to extract YouTube ID
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

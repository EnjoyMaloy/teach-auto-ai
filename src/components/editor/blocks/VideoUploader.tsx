import React, { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface VideoUploaderProps {
  videoUrl?: string;
  onUpdate: (url: string | undefined) => void;
}

type Orientation = 'vertical' | 'horizontal';

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  orientation: Orientation;
}

// 16:9 = 1.7778, 9:16 = 0.5625 — допуск ±5%
const RATIO_TOLERANCE = 0.05;
const HORIZONTAL_RATIO = 16 / 9;
const VERTICAL_RATIO = 9 / 16;
const MAX_VERTICAL_DURATION = 60; // 1 минута
const MAX_HORIZONTAL_DURATION = 3600; // 1 час
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 МБ

const detectOrientation = (width: number, height: number): Orientation | null => {
  if (!width || !height) return null;
  const ratio = width / height;
  if (Math.abs(ratio - HORIZONTAL_RATIO) / HORIZONTAL_RATIO <= RATIO_TOLERANCE) return 'horizontal';
  if (Math.abs(ratio - VERTICAL_RATIO) / VERTICAL_RATIO <= RATIO_TOLERANCE) return 'vertical';
  return null;
};

export const VideoUploader: React.FC<VideoUploaderProps> = ({ videoUrl, onUpdate }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const { duration, videoWidth: width, videoHeight: height } = video;
        URL.revokeObjectURL(video.src);
        const orientation = detectOrientation(width, height);
        if (!orientation) {
          reject(new Error(
            `Соотношение сторон видео ${width}×${height} не поддерживается. Разрешены только 16:9 (горизонтальное) и 9:16 (вертикальное).`
          ));
          return;
        }
        resolve({ duration, width, height, orientation });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Не удалось прочитать метаданные видео. Возможно, файл повреждён.'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const validateDuration = (meta: VideoMetadata): string | null => {
    if (meta.orientation === 'vertical' && meta.duration > MAX_VERTICAL_DURATION) {
      return `Вертикальное видео должно быть до 1 минуты. Длительность: ${Math.round(meta.duration)} сек.`;
    }
    if (meta.orientation === 'horizontal' && meta.duration > MAX_HORIZONTAL_DURATION) {
      return `Горизонтальное видео должно быть до 1 часа. Длительность: ${Math.round(meta.duration / 60)} мин.`;
    }
    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Необходима авторизация для загрузки видео');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Неподдерживаемый формат. Используйте MP4, WebM, MOV или AVI.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(0)} МБ). Максимум 500 МБ.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const metadata = await getVideoMetadata(file);
      setUploadProgress(20);

      const durationError = validateDuration(metadata);
      if (durationError) {
        toast.error(durationError);
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/videos/${fileName}`;

      setUploadProgress(30);

      const { error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      setUploadProgress(90);

      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onUpdate(urlData.publicUrl);

      const orientationText = metadata.orientation === 'vertical' ? '9:16' : '16:9';
      const durationText = metadata.duration < 60
        ? `${Math.round(metadata.duration)} сек`
        : `${Math.round(metadata.duration / 60)} мин`;
      toast.success(`Видео загружено (${orientationText}, ${durationText})`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Ошибка загрузки видео');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (videoUrl?.includes('course-videos')) {
      try {
        const path = videoUrl.split('course-videos/')[1];
        if (path) await supabase.storage.from('course-videos').remove([path]);
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }
    onUpdate(undefined);
    toast.success('Видео удалено');
  };

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video src={videoUrl} controls className="w-full h-full object-contain" />
        </div>
        <Button variant="destructive" size="sm" onClick={handleRemove} className="w-full rounded-xl">
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
            <p className="text-xs text-muted-foreground">MP4, WebM, MOV, AVI до 500 МБ</p>
          </button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Только 16:9 (горизонтальное, до 1 часа) или 9:16 (вертикальное, до 1 минуты)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

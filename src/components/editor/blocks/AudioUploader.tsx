import React, { useRef, useState } from 'react';
import { Upload, Loader2, Trash2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioUploaderProps {
  audioUrl?: string;
  audioName?: string;
  onUpdate: (url: string | undefined, name?: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ 
  audioUrl, 
  audioName,
  onUpdate 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      toast.error('Неподдерживаемый формат. Используйте MP3, WAV, OGG, AAC или M4A.');
      return;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 50 МБ.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `audio/${fileName}`;

      setUploadProgress(40);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-audio')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      
      // Extract clean name from file
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      onUpdate(urlData.publicUrl, cleanName);
      
      toast.success('Аудио загружено!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Ошибка загрузки аудио');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (audioUrl?.includes('course-audio')) {
      try {
        const path = audioUrl.split('course-audio/')[1];
        if (path) {
          await supabase.storage.from('course-audio').remove([path]);
        }
      } catch (error) {
        console.error('Error deleting audio:', error);
      }
    }
    onUpdate(undefined, undefined);
    toast.success('Аудио удалено');
  };

  if (audioUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {audioName || 'Аудио файл'}
            </p>
            <p className="text-xs text-muted-foreground">Готово к воспроизведению</p>
          </div>
        </div>
        <audio src={audioUrl} controls className="w-full rounded-lg" />
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          className="w-full rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить аудио
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,.mp3,.wav,.ogg,.aac,.m4a"
        className="hidden"
        onChange={handleFileSelect}
      />

      {isUploading ? (
        <div className="border-2 border-dashed border-primary rounded-2xl p-8 text-center bg-primary/5">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground mb-2">Загрузка аудио...</p>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Загрузить аудио</p>
          <p className="text-xs text-muted-foreground">MP3, WAV, OGG, AAC до 50 МБ</p>
        </button>
      )}
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const ARTICLE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #667eea 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)',
  'linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff8177 0%, #b12a5b 100%)',
];

interface ArticleCoverEditorProps {
  gradient: string | null;
  image: string | null;
  articleId: string;
  onUpdate: (gradient: string | null, image: string | null) => void;
}

const ArticleCoverEditor: React.FC<ArticleCoverEditorProps> = ({
  gradient,
  image,
  articleId,
  onUpdate,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Загрузите изображение (PNG, JPG)');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `article-covers/${articleId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Ошибка загрузки');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('course-images')
      .getPublicUrl(path);

    onUpdate(gradient, urlData.publicUrl);
    setUploading(false);
    toast.success('Обложка загружена');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Обложка</p>

      {/* Preview */}
      <div
        className="w-full aspect-[2/1] rounded-xl overflow-hidden relative flex items-center justify-center border border-border"
        style={{ background: gradient || ARTICLE_GRADIENTS[0] }}
      >
        {image && (
          <img
            src={image}
            alt="cover"
            className="h-3/4 w-auto object-contain relative z-10"
          />
        )}
        {!image && !uploading && (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white/90 transition-colors z-10"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs">Загрузить PNG</span>
          </button>
        )}
        {uploading && (
          <Loader2 className="w-6 h-6 animate-spin text-white/80 z-10" />
        )}
        {image && (
          <button
            onClick={() => onUpdate(gradient, null)}
            className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Upload button when image exists */}
      {image && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-xl text-xs w-full"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5" />}
          Заменить изображение
        </Button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Gradient grid */}
      <div className="grid grid-cols-10 gap-1.5">
        {ARTICLE_GRADIENTS.map((g, i) => (
          <button
            key={i}
            onClick={() => onUpdate(g, image)}
            className={cn(
              'aspect-square rounded-lg border-2 transition-all hover:scale-110',
              gradient === g ? 'border-primary ring-1 ring-primary' : 'border-transparent'
            )}
            style={{ background: g }}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticleCoverEditor;

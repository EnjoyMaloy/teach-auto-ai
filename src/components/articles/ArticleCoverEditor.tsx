import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, Plus, RotateCcw, Eye, Unlink, Bookmark, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

const ANGLE_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315];

interface ArticleCoverEditorProps {
  gradient: string | null;
  image: string | null;
  articleId: string;
  title?: string;
  titleEn?: string;
  authorName?: string;
  authorAvatar?: string;
  onUpdate: (gradient: string | null, image: string | null) => void;
}

const CUSTOM_GRADIENTS_KEY = 'article-custom-gradients';

const loadCustomGradients = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_GRADIENTS_KEY) || '[]');
  } catch { return []; }
};

const saveCustomGradients = (gradients: string[]) => {
  localStorage.setItem(CUSTOM_GRADIENTS_KEY, JSON.stringify(gradients));
};

const CustomGradientBuilder: React.FC<{
  onChange: (gradient: string) => void;
  onSave: (gradient: string) => void;
}> = ({ onChange, onSave }) => {
  const [color1, setColor1] = useState('#667eea');
  const [color2, setColor2] = useState('#764ba2');
  const [angle, setAngle] = useState(135);

  const gradientValue = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;

  const updateColor1 = (v: string) => { setColor1(v); onChange(`linear-gradient(${angle}deg, ${v} 0%, ${color2} 100%)`); };
  const updateColor2 = (v: string) => { setColor2(v); onChange(`linear-gradient(${angle}deg, ${color1} 0%, ${v} 100%)`); };
  const updateAngle = (a: number) => { setAngle(a); onChange(`linear-gradient(${a}deg, ${color1} 0%, ${color2} 100%)`); };
  const swapColors = () => { setColor1(color2); setColor2(color1); onChange(`linear-gradient(${angle}deg, ${color2} 0%, ${color1} 100%)`); };

  return (
    <div className="space-y-4">
      {/* Color pickers */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Цвет 1</Label>
          <div className="flex items-center gap-2">
            <label className="w-8 h-8 rounded-lg cursor-pointer block shrink-0" style={{ backgroundColor: color1 }}>
              <input type="color" value={color1} onChange={(e) => updateColor1(e.target.value)} className="sr-only" />
            </label>
            <span className="text-xs text-muted-foreground font-mono">{color1}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Цвет 2</Label>
          <div className="flex items-center gap-2">
            <label className="w-8 h-8 rounded-lg cursor-pointer block shrink-0" style={{ backgroundColor: color2 }}>
              <input type="color" value={color2} onChange={(e) => updateColor2(e.target.value)} className="sr-only" />
            </label>
            <span className="text-xs text-muted-foreground font-mono">{color2}</span>
          </div>
        </div>
      </div>

      {/* Swap colors */}
      <Button
        variant="ghost"
        size="sm"
        onClick={swapColors}
        className="w-full rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Поменять цвета местами
      </Button>

      {/* Angle */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Угол: {angle}°</Label>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={(e) => updateAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Save */}
      <Button
        onClick={() => onSave(gradientValue)}
        size="sm"
        className="w-full rounded-xl gap-1.5 hover:brightness-90 dark:text-foreground dark:hover:text-white dark:hover:bg-primary/80"
      >
        <Save className="w-3.5 h-3.5" />
        Сохранить градиент
      </Button>
    </div>
  );
};

const ArticleCoverEditor: React.FC<ArticleCoverEditorProps> = ({
  gradient,
  image,
  articleId,
  title,
  titleEn,
  authorName,
  authorAvatar,
  onUpdate,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [customGradients, setCustomGradients] = useState<string[]>(loadCustomGradients);
  const [gradientPopoverOpen, setGradientPopoverOpen] = useState(false);
  const handleSaveGradient = (g: string) => {
    if (customGradients.includes(g)) return;
    const updated = [...customGradients, g];
    setCustomGradients(updated);
    saveCustomGradients(updated);
    onUpdate(g, image);
    setGradientPopoverOpen(false);
  };

  const handleDeleteCustomGradient = (g: string) => {
    const updated = customGradients.filter(cg => cg !== g);
    setCustomGradients(updated);
    saveCustomGradients(updated);
  };

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

      {/* Two card previews side by side */}
      <div className="flex gap-3">
        {[
          { label: 'RU', cardTitle: title || 'Заголовок инструкции' },
          { label: 'EN', cardTitle: titleEn || 'Instruction title' },
        ].map(({ label, cardTitle }) => (
          <div key={label} className="flex-1">
            <div
              className="w-full rounded-2xl overflow-hidden relative border border-border shadow-md"
              style={{ background: gradient || ARTICLE_GRADIENTS[0] }}
            >
              {/* Top-right icons */}
              <div className="absolute top-3 right-3 z-20 flex gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer">
                  <Unlink className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer">
                  <Bookmark className="w-4.5 h-4.5 text-white" />
                </div>
              </div>

              {/* Image area */}
              <div className="w-full aspect-square flex items-center justify-center relative p-4">
                {image && (
                  <img
                    src={image}
                    alt="cover"
                    className={cn(
                      "max-h-full max-w-full object-contain relative z-10 drop-shadow-lg",
                      label === 'RU' && "cursor-pointer hover:opacity-80 transition-opacity"
                    )}
                    onClick={label === 'RU' ? () => fileRef.current?.click() : undefined}
                  />
                )}
                {!image && !uploading && label === 'RU' && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center gap-1 text-white/60 hover:text-white/90 transition-colors z-10"
                  >
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-[10px]">PNG</span>
                  </button>
                )}
                {!image && !uploading && label === 'EN' && (
                  <div className="text-white/30 text-[10px]">No image</div>
                )}
                {uploading && label === 'RU' && (
                  <Loader2 className="w-5 h-5 animate-spin text-white/80 z-10" />
                )}
              </div>

              {/* Bottom info */}
              <div className="px-4 pb-5 pt-0 space-y-2.5">
                <h3 className="text-white font-semibold text-lg leading-tight text-center line-clamp-2">
                  {cardTitle}
                </h3>
                <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-2 mx-auto w-fit">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/30" />
                  )}
                  <span className="text-white text-sm font-medium truncate max-w-[90px]">
                    {authorName || 'Автор'}
                  </span>
                  <Eye className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white/70 text-sm">1337</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


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
            key={`preset-${i}`}
            onClick={() => onUpdate(g, image)}
            className={cn(
              'aspect-square rounded-lg border-2 transition-all hover:scale-110',
              gradient === g ? 'border-primary ring-1 ring-primary' : 'border-transparent'
            )}
            style={{ background: g }}
          />
        ))}

        {/* Custom saved gradients */}
        {customGradients.map((g, i) => (
          <div key={`custom-${i}`} className="relative group">
            <button
              onClick={() => onUpdate(g, image)}
              className={cn(
                'aspect-square rounded-lg border-2 transition-all hover:scale-110 w-full',
                gradient === g ? 'border-primary ring-1 ring-primary' : 'border-transparent'
              )}
              style={{ background: g }}
            />
            <button
              onClick={() => handleDeleteCustomGradient(g)}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
        ))}

        {/* Custom gradient button */}
        <Popover open={gradientPopoverOpen} onOpenChange={setGradientPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-all hover:scale-110 flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <CustomGradientBuilder
              onChange={(g) => onUpdate(g, image)}
              onSave={handleSaveGradient}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ArticleCoverEditor;

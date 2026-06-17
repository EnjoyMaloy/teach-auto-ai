import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Instagram, Send, Youtube } from 'lucide-react';
import { XIcon, ThreadsIcon } from '@/components/icons/BrandIcons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamMutations } from '@/hooks/useTeams';
import { Team } from '@/hooks/useWorkspace';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import {
  SOCIAL_LABELS,
  SOCIAL_PLACEHOLDERS,
  SocialPlatform,
  validateSocialUrl,
} from '@/lib/socialLinks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SOCIAL_PLATFORMS: SocialPlatform[] = ['instagram', 'telegram', 'youtube', 'x', 'threads'];

const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  telegram: Send,
  youtube: Youtube,
  x: XIcon,
  threads: ThreadsIcon,
};

interface Props {
  team: Team;
  canEdit: boolean;
}

export default function TeamSettingsForm({ team, canEdit }: Props) {
  const { updateTeam } = useTeamMutations(team.id);
  const { refresh } = useWorkspace();

  const [name, setName] = useState(team.name);
  const [descriptionRu, setDescriptionRu] = useState(team.description_ru || team.description || '');
  const [descriptionEn, setDescriptionEn] = useState(team.description_en || '');
  const [descLang, setDescLang] = useState<'ru' | 'en'>('ru');
  const [socials, setSocials] = useState<Record<SocialPlatform, string>>({
    instagram: team.instagram_url || '',
    telegram: team.telegram_url || '',
    youtube: team.youtube_url || '',
    x: team.x_url || '',
    threads: team.threads_url || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(team.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(team.name);
    setDescriptionRu(team.description_ru || team.description || '');
    setDescriptionEn(team.description_en || '');
    setAvatarPreview(team.avatar_url);
    setAvatarFile(null);
    setSocials({
      instagram: team.instagram_url || '',
      telegram: team.telegram_url || '',
      youtube: team.youtube_url || '',
      x: team.x_url || '',
      threads: team.threads_url || '',
    });
  }, [team.id]);

  const handleAvatarPick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const isDirty =
    name.trim() !== team.name ||
    (descriptionRu || '') !== (team.description_ru || team.description || '') ||
    (descriptionEn || '') !== (team.description_en || '') ||
    socials.instagram !== (team.instagram_url || '') ||
    socials.telegram !== (team.telegram_url || '') ||
    socials.youtube !== (team.youtube_url || '') ||
    socials.x !== (team.x_url || '') ||
    socials.threads !== (team.threads_url || '') ||
    !!avatarFile;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Введите название команды');
      return;
    }

    // Validate social links on submit
    const validatedSocials: Record<SocialPlatform, string> = { ...socials };
    for (const p of SOCIAL_PLATFORMS) {
      const val = socials[p].trim();
      if (val) {
        const validated = validateSocialUrl(p, val);
        if (validated === null) {
          toast.error(`Неверная ссылка для ${SOCIAL_LABELS[p]}`);
          return;
        }
        validatedSocials[p] = validated;
      } else {
        validatedSocials[p] = '';
      }
    }

    setSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'png';
        const path = `team-avatars/${team.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('course-images')
          .upload(path, avatarFile, { upsert: true });
        if (upErr) {
          toast.error('Не удалось загрузить аватар');
        } else {
          const { data } = supabase.storage.from('course-images').getPublicUrl(path);
          avatarUrl = data.publicUrl;
        }
      }

      await updateTeam.mutateAsync({
        name: name.trim(),
        description: descriptionRu.trim() || descriptionEn.trim() || null,
        description_ru: descriptionRu.trim() || null,
        description_en: descriptionEn.trim() || null,
        instagram_url: validatedSocials.instagram || null,
        telegram_url: validatedSocials.telegram || null,
        youtube_url: validatedSocials.youtube || null,
        x_url: validatedSocials.x || null,
        threads_url: validatedSocials.threads || null,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      });
      setAvatarFile(null);
      await refresh();
    } catch {
      /* toast handled in mutation */
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialChange = (platform: SocialPlatform, value: string) => {
    if (disabled) return;
    setSocials((s) => ({ ...s, [platform]: value }));
  };

  const disabled = !canEdit;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative size-20 rounded-full overflow-hidden border-2 border-dashed border-border group',
            disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-primary transition-colors'
          )}
        >
          {avatarPreview ? (
            <Avatar className="size-20">
              <AvatarImage src={avatarPreview} className="object-cover" />
              <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <Camera className="size-5" />
            </div>
          )}
          {!disabled && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="size-5" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
        />
        <div className="text-xs text-muted-foreground">
          {disabled ? 'Только админ может менять аватар' : 'Нажмите, чтобы заменить аватар'}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Название</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Описание</Label>
          <div className="flex bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setDescLang('ru')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                descLang === 'ru'
                  ? 'bg-[#0a0a0c] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setDescLang('en')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                descLang === 'en'
                  ? 'bg-[#0a0a0c] text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EN
            </button>
          </div>
        </div>
        {descLang === 'ru' ? (
          <Textarea
            value={descriptionRu}
            onChange={(e) => setDescriptionRu(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Команда, которая создаёт курсы..."
            disabled={disabled}
          />
        ) : (
          <Textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="A team that creates courses..."
            disabled={disabled}
          />
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Соцсети
        </Label>
        <div className="grid gap-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const Icon = SOCIAL_ICONS[p];
            return (
              <div
                key={p}
                className={cn(
                  'flex items-center gap-3 bg-muted/40 p-1.5 pl-3 rounded-xl border border-border/50 focus-within:border-primary/50 focus-within:bg-muted/60 transition-colors',
                  disabled && 'opacity-70'
                )}
              >
                <div className="flex items-center gap-2 text-muted-foreground shrink-0 w-24">
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{SOCIAL_LABELS[p]}</span>
                </div>
                <input
                  type="text"
                  value={socials[p]}
                  disabled={disabled}
                  onChange={(e) => handleSocialChange(p, e.target.value)}
                  placeholder={SOCIAL_PLACEHOLDERS[p]}
                  className="bg-transparent border-0 text-xs focus:outline-none focus:ring-0 w-full p-1 text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!isDirty || submitting}
            style={{ boxShadow: 'none' }}
            className="bg-white hover:bg-white/90 text-neutral-900 border-0 hover:translate-y-0"
          >
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Сохранить изменения
          </Button>
          {isDirty && !submitting && (
            <span className="text-xs text-muted-foreground">Есть несохранённые изменения</span>
          )}
        </div>
      )}
    </div>
  );
}

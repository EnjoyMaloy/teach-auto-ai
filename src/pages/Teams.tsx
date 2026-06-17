import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Shield, Camera, Loader2, X, Instagram, Send, Youtube, Check, Mail } from 'lucide-react';
import { XIcon, ThreadsIcon } from '@/components/icons/BrandIcons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCreateTeam } from '@/hooks/useTeams';
import { useMyInvitations, useRespondToInvitation } from '@/hooks/useTeamInvitations';
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

interface SocialChipProps {
  platform: SocialPlatform;
  value: string;
  onChange: (v: string) => void;
}

function SocialChip({ platform, value, onChange }: SocialChipProps) {
  const Icon = SOCIAL_ICONS[platform];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const isSet = !!value;

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onChange('');
      setOpen(false);
      return;
    }
    const v = validateSocialUrl(platform, trimmed);
    if (v === null) {
      toast.error(`Неверная ссылка ${SOCIAL_LABELS[platform]}`);
      return;
    }
    onChange(v || '');
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title={SOCIAL_LABELS[platform]}
          className={cn(
            'relative size-10 rounded-full flex items-center justify-center transition-colors border',
            isSet
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
          )}
        >
          <Icon className="size-4" />
          {!isSet && (
            <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-background border border-border flex items-center justify-center">
              <Plus className="size-2.5" />
            </span>
          )}
          {isSet && (
            <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-background border border-border flex items-center justify-center text-primary">
              <Check className="size-2.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-2">
          <Label className="text-xs">{SOCIAL_LABELS[platform]}</Label>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={SOCIAL_PLACEHOLDERS[platform]}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="flex justify-between gap-2 pt-1">
            {isSet ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <X className="size-3 mr-1" /> Убрать
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" size="sm" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Teams() {
  const navigate = useNavigate();
  const { teams, isLoading, refresh, setCurrentTeamId } = useWorkspace();
  const { data: myInvitations = [] } = useMyInvitations();
  const { accept, decline } = useRespondToInvitation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [socials, setSocials] = useState<Record<SocialPlatform, string>>({
    instagram: '',
    telegram: '',
    youtube: '',
    x: '',
    threads: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTeam = useCreateTeam();

  const handleAccept = async (invitationId: string) => {
    try {
      const teamId = await accept.mutateAsync(invitationId);
      await refresh();
      if (teamId) {
        setCurrentTeamId(teamId);
        navigate(`/teams/${teamId}`);
      }
    } catch {}
  };


  const resetForm = () => {
    setName('');
    setDescriptionRu('');
    setDescriptionEn('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setSocials({ instagram: '', telegram: '', youtube: '', x: '', threads: '' });
  };

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

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Введите название команды');
      return;
    }

    setSubmitting(true);
    try {
      const team = await createTeam.mutateAsync({
        name: name.trim(),
        description_ru: descriptionRu.trim() || null,
        description_en: descriptionEn.trim() || null,
        instagram_url: socials.instagram || null,
        telegram_url: socials.telegram || null,
        youtube_url: socials.youtube || null,
        x_url: socials.x || null,
        threads_url: socials.threads || null,
      });

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'png';
        const path = `team-avatars/${team.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('course-images')
          .upload(path, avatarFile, { upsert: true });
        if (upErr) {
          toast.error('Команда создана, но не удалось загрузить аватар');
        } else {
          const { data } = supabase.storage.from('course-images').getPublicUrl(path);
          await supabase.from('teams').update({ avatar_url: data.publicUrl }).eq('id', team.id);
        }
      }

      await refresh();
      setOpen(false);
      resetForm();
      setCurrentTeamId(team.id);
      navigate(`/teams/${team.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Ошибка создания');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 px-4 md:px-10 lg:px-16 xl:px-24 py-4 md:py-6">
      <div className="h-16 md:h-2" />
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Команды</h1>
          <p className="text-sm text-muted-foreground">
            Общее пространство для работы над курсами и инструкциями
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          style={{ boxShadow: 'none' }}
          className="h-11 px-5 rounded-2xl bg-white hover:bg-white/90 text-neutral-900 text-sm shrink-0 border-0 hover:translate-y-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать команду
        </Button>
      </div>

      {myInvitations.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="size-4 text-primary" />
            Приглашения в команды
            <span className="text-xs text-muted-foreground">({myInvitations.length})</span>
          </div>
          <div className="space-y-2">
            {myInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-4 rounded-2xl border border-primary/30 bg-primary/5"
              >
                <Avatar className="size-10">
                  {inv.team_avatar_url && <AvatarImage src={inv.team_avatar_url} />}
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold rounded-full">
                    {inv.team_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    Приглашение в «{inv.team_name}»
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    От {inv.inviter_name || inv.inviter_email || 'администратора'} ·{' '}
                    {inv.role === 'admin' ? 'Admin' : 'Member'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => decline.mutate(inv.id)}
                  disabled={decline.isPending || accept.isPending}
                >
                  Отклонить
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv.id)}
                  disabled={accept.isPending || decline.isPending}
                  style={{ boxShadow: 'none' }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 hover:translate-y-0"
                >
                  <Check className="size-4 mr-1" /> Принять
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}


      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="size-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">У вас пока нет команд</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Создайте команду, чтобы делиться курсами и инструкциями с коллегами
          </p>
          <Button onClick={() => setOpen(true)} variant="secondary">
            <Plus className="size-4 mr-2" />
            Создать первую команду
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="text-left p-5 rounded-2xl border border-sidebar-border bg-sidebar hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <Avatar className="size-10">
                  {team.avatar_url && <AvatarImage src={team.avatar_url} />}
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold rounded-full">
                    {team.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {team.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Shield className="size-3" /> Admin
                  </span>
                )}
              </div>
              <div className="font-medium truncate">{team.name}</div>
              {team.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {team.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-w-md bg-[#0a0a0d] border-border/60">
          <DialogHeader>
            <DialogTitle>Новая команда</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Avatar — click to pick or replace */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative size-24 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <Camera className="size-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="size-5" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Моя команда"
                maxLength={80}
                autoFocus
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
                  placeholder="Команда, которая создаёт курсы..."
                  rows={2}
                  maxLength={500}
                />
              ) : (
                <Textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="A team that creates courses..."
                  rows={2}
                  maxLength={500}
                />
              )}
            </div>


            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Соцсети <span className="normal-case tracking-normal text-muted-foreground/70">— опционально</span>
              </Label>
              <div className="flex items-center gap-2">
                {SOCIAL_PLATFORMS.map((p) => (
                  <SocialChip
                    key={p}
                    platform={p}
                    value={socials[p]}
                    onChange={(v) => setSocials((s) => ({ ...s, [p]: v }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Crown, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useTeamMembers, useTeamMutations } from '@/hooks/useTeams';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teams, refresh, setCurrentTeamId } = useWorkspace();
  const team = useMemo(() => teams.find((t) => t.id === teamId), [teams, teamId]);
  const isAdmin = team?.role === 'admin';

  const { data: members = [], isLoading } = useTeamMembers(teamId || null);
  const { addMember, removeMember, updateRole, deleteTeam } = useTeamMutations(teamId || null);

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  if (!team) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <Button variant="ghost" onClick={() => navigate('/teams')} className="mb-4">
          <ArrowLeft className="size-4 mr-2" /> К командам
        </Button>
        <div className="text-muted-foreground">Команда не найдена.</div>
      </div>
    );
  }

  const adminCount = members.filter((m) => m.role === 'admin').length;

  const handleAdd = async () => {
    if (!email.trim()) return;
    try {
      await addMember.mutateAsync({ email, role });
      setEmail('');
      setRole('member');
      setAddOpen(false);
    } catch {}
  };

  const handleRemove = async (memberId: string, memberRole: string) => {
    if (memberRole === 'admin' && adminCount <= 1) {
      toast.error('Нельзя удалить последнего администратора');
      return;
    }
    if (!confirm('Удалить участника из команды?')) return;
    await removeMember.mutateAsync(memberId);
  };

  const handleLeave = async () => {
    const me = members.find((m) => m.user_id === user?.id);
    if (!me) return;
    if (me.role === 'admin' && adminCount <= 1) {
      toast.error('Назначьте другого администратора, прежде чем выйти');
      return;
    }
    if (!confirm('Выйти из команды?')) return;
    await removeMember.mutateAsync(me.id);
    setCurrentTeamId(null);
    await refresh();
    navigate('/teams');
  };

  const handleDelete = async () => {
    if (!confirm('Удалить команду навсегда? Курсы и инструкции команды останутся, но станут личными у их авторов.')) return;
    await deleteTeam.mutateAsync();
    setCurrentTeamId(null);
    await refresh();
    navigate('/teams');
  };

  return (
    <div className="container max-w-4xl mx-auto px-6 py-8">
      <Button variant="ghost" onClick={() => navigate('/teams')} className="mb-4">
        <ArrowLeft className="size-4 mr-2" /> К командам
      </Button>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="size-14">
            {team.avatar_url && <AvatarImage src={team.avatar_url} />}
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-lg rounded-full">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate">{team.name}</h1>
            {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
            {(team.instagram_url || team.telegram_url || team.youtube_url || team.x_url) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { url: team.instagram_url, label: 'Instagram' },
                  { url: team.telegram_url, label: 'Telegram' },
                  { url: team.youtube_url, label: 'YouTube' },
                  { url: team.x_url, label: 'X' },
                ]
                  .filter((s) => s.url)
                  .map((s) => (
                    <a
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="inline-flex bg-muted rounded-lg p-1 h-auto gap-0">
          {([
            { id: 'members', name: 'Участники' },
            { id: 'settings', name: 'Настройки' },
          ] as const).map((opt) => (
            <TabsTrigger
              key={opt.id}
              value={opt.id}
              className="px-4 py-1.5 text-xs font-medium rounded-md text-muted-foreground data-[state=active]:bg-[#0a0a0c] data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground transition-colors"
            >
              {opt.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{members.length} участн.</div>
            {isAdmin && (
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="size-4 mr-2" /> Добавить
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-muted-foreground">Загрузка...</div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => {
                const isMe = m.user_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-sidebar-border bg-sidebar"
                  >
                    <Avatar className="size-9">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                      <AvatarFallback>
                        {(m.name || m.email || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {m.name || m.email || 'Пользователь'}
                        {isMe && <span className="ml-2 text-xs text-muted-foreground">(вы)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </div>
                    {isAdmin && !isMe ? (
                      <Select
                        value={m.role}
                        onValueChange={(v: 'admin' | 'member') => {
                          if (m.role === 'admin' && v === 'member' && adminCount <= 1) {
                            toast.error('Нужен хотя бы один администратор');
                            return;
                          }
                          updateRole.mutate({ memberId: m.id, role: v });
                        }}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
                        {m.role === 'admin' ? <Crown className="size-3" /> : <UserIcon className="size-3" />}
                        {m.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    )}
                    {isAdmin && !isMe && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(m.id, m.role)}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={handleLeave} className="border">
              <LogOut className="size-4 mr-2" /> Выйти из команды
            </Button>
            {isAdmin && (
              <Button
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="size-4 mr-2" /> Удалить команду
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить участника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email пользователя</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Пользователь должен быть уже зарегистрирован.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={role} onValueChange={(v: 'admin' | 'member') => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member — может всё, кроме удаления</SelectItem>
                  <SelectItem value="admin">Admin — полный доступ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Отмена</Button>
            <Button onClick={handleAdd} disabled={addMember.isPending}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

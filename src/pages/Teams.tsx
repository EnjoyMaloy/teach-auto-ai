import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCreateTeam } from '@/hooks/useTeams';
import { toast } from 'sonner';

export default function Teams() {
  const navigate = useNavigate();
  const { teams, isLoading, refresh, setCurrentTeamId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const createTeam = useCreateTeam();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Введите название команды');
      return;
    }
    try {
      const team = await createTeam.mutateAsync({ name: name.trim(), description: desc.trim() });
      await refresh();
      setOpen(false);
      setName('');
      setDesc('');
      setCurrentTeamId(team.id);
      navigate(`/teams/${team.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Ошибка создания');
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Команды</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Общее пространство для работы над курсами и инструкциями
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4 mr-2" />
          Создать команду
        </Button>
      </div>

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
              className="text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold">
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
                {team.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Crown className="size-3" /> Admin
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая команда</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Моя команда" />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="О чём ваша команда..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={createTeam.isPending}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

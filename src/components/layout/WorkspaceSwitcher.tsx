import { ChevronsUpDown, Home, Users, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';

export default function WorkspaceSwitcher() {
  const { teams, currentTeamId, currentTeam, setCurrentTeamId } = useWorkspace();
  const { user } = useAuth();

  const personalName =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split('@')[0] : 'Личное');
  const personalAvatar =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    null;

  const label = currentTeam ? currentTeam.name : personalName;
  const avatarUrl = currentTeam ? currentTeam.avatar_url : personalAvatar;
  const initials = (label || '??').slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-md text-[13px] font-medium border border-sidebar-border bg-sidebar text-foreground hover:bg-muted transition-colors max-w-[220px]"
        >
          <Avatar className="size-6">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="size-3 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuItem onClick={() => setCurrentTeamId(null)}>
          <Home className="mr-2 size-4" />
          <span className="truncate">{personalName}</span>
          {!currentTeamId && <Check className="ml-auto size-3.5 text-primary" />}
        </DropdownMenuItem>
        {teams.length > 0 && <DropdownMenuSeparator />}
        {teams.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => setCurrentTeamId(t.id)}>
            <Users className="mr-2 size-4" />
            <span className="truncate">{t.name}</span>
            {currentTeamId === t.id && <Check className="ml-auto size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

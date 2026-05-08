import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  role: 'admin' | 'member';
}

interface WorkspaceContextType {
  teams: Team[];
  isLoading: boolean;
  currentTeamId: string | null; // null = personal
  currentTeam: Team | null;
  setCurrentTeamId: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEY = 'current_workspace_team_id';

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeamId, setCurrentTeamIdState] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored !== 'null' ? stored : null;
  });

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('role, teams!inner(id, name, description, avatar_url)')
      .eq('user_id', user.id);

    if (!error && data) {
      const list: Team[] = data.map((row: any) => ({
        id: row.teams.id,
        name: row.teams.name,
        description: row.teams.description,
        avatar_url: row.teams.avatar_url,
        role: row.role,
      }));
      setTeams(list);
      // If current team no longer accessible, fall back to personal
      if (currentTeamId && !list.some((t) => t.id === currentTeamId)) {
        setCurrentTeamIdState(null);
        localStorage.setItem(STORAGE_KEY, 'null');
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setCurrentTeamId = (id: string | null) => {
    setCurrentTeamIdState(id);
    localStorage.setItem(STORAGE_KEY, id ?? 'null');
  };

  const currentTeam = useMemo(
    () => teams.find((t) => t.id === currentTeamId) ?? null,
    [teams, currentTeamId]
  );

  return (
    <WorkspaceContext.Provider
      value={{ teams, isLoading, currentTeamId, currentTeam, setCurrentTeamId, refresh: fetchTeams }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

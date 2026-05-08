import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const teamKeys = {
  all: ['teams'] as const,
  members: (teamId: string) => ['teams', teamId, 'members'] as const,
};

export const useTeamMembers = (teamId: string | null) => {
  return useQuery({
    queryKey: teamKeys.members(teamId || ''),
    enabled: !!teamId,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('id, user_id, role, created_at')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!members?.length) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', userIds);

      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return members.map((m: any) => {
        const p = map.get(m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          created_at: m.created_at,
          email: p?.email ?? null,
          name: p?.name ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });
    },
  });
};

export const useTeamMutations = (teamId: string | null) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const addMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'member' }) => {
      if (!teamId) throw new Error('No team');
      const trimmed = email.trim().toLowerCase();
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmed)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) throw new Error('Пользователь с таким email не найден. Он должен сначала зарегистрироваться.');

      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, user_id: profile.id, role });
      if (error) {
        if (error.code === '23505') throw new Error('Пользователь уже в команде');
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId || '') });
      toast.success('Участник добавлен');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId || '') });
      toast.success('Участник удалён');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'member' }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId || '') });
      toast.success('Роль обновлена');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const updateTeam = useMutation({
    mutationFn: async (patch: { name?: string; description?: string | null; avatar_url?: string | null }) => {
      if (!teamId) throw new Error('No team');
      const { error } = await supabase.from('teams').update(patch).eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace'] });
      toast.success('Команда обновлена');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const deleteTeam = useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error('No team');
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Команда удалена'),
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  return { addMember, removeMember, updateRole, updateTeam, deleteTeam, currentUserId: user?.id };
};

export interface CreateTeamInput {
  name: string;
  description?: string;
  avatar_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  youtube_url?: string | null;
  x_url?: string | null;
}

export const useCreateTeam = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: input.name,
          description: input.description || null,
          avatar_url: input.avatar_url || null,
          instagram_url: input.instagram_url || null,
          telegram_url: input.telegram_url || null,
          youtube_url: input.youtube_url || null,
          x_url: input.x_url || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
};

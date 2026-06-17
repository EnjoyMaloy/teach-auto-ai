import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  invited_by: string;
  created_at: string;
}

export interface MyInvitation extends TeamInvitation {
  team_name: string;
  team_avatar_url: string | null;
  inviter_name: string | null;
  inviter_email: string | null;
}

export const invitationKeys = {
  team: (teamId: string) => ['team-invitations', teamId] as const,
  mine: ['my-invitations'] as const,
};

// Admin: pending invitations for a team
export const useTeamInvitations = (teamId: string | null) => {
  return useQuery({
    queryKey: invitationKeys.team(teamId || ''),
    enabled: !!teamId,
    queryFn: async (): Promise<TeamInvitation[]> => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TeamInvitation[];
    },
  });
};

// Current user's pending invitations
export const useMyInvitations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: invitationKeys.mine,
    enabled: !!user,
    queryFn: async (): Promise<MyInvitation[]> => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      const teamIds = Array.from(new Set(data.map((d: any) => d.team_id)));
      const inviterIds = Array.from(new Set(data.map((d: any) => d.invited_by)));

      const [{ data: teams }, { data: profiles }] = await Promise.all([
        supabase.from('teams').select('id, name, avatar_url').in('id', teamIds),
        supabase.from('profiles').select('id, name, email').in('id', inviterIds),
      ]);

      const tMap = new Map((teams || []).map((t: any) => [t.id, t]));
      const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return data.map((d: any) => {
        const t = tMap.get(d.team_id);
        const p = pMap.get(d.invited_by);
        return {
          ...d,
          team_name: t?.name || 'Команда',
          team_avatar_url: t?.avatar_url || null,
          inviter_name: p?.name || null,
          inviter_email: p?.email || null,
        } as MyInvitation;
      });
    },
  });
};

export const useInvitationMutations = (teamId: string | null) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'member' }) => {
      if (!teamId) throw new Error('No team');
      if (!user) throw new Error('Not authenticated');
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) throw new Error('Введите email');

      // Check if user is already a member
      const { data: foundId } = await supabase.rpc('find_user_id_by_email', { _email: trimmed });
      if (foundId) {
        const { data: existing } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', foundId as string)
          .maybeSingle();
        if (existing) throw new Error('Пользователь уже в команде');
      }

      const { error } = await supabase
        .from('team_invitations')
        .insert({ team_id: teamId, email: trimmed, role, invited_by: user.id });
      if (error) {
        if (error.code === '23505') throw new Error('Приглашение уже отправлено');
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.team(teamId || '') });
      toast.success('Приглашение отправлено');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const cancel = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.team(teamId || '') });
      toast.success('Приглашение отменено');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  return { invite, cancel };
};

export const useRespondToInvitation = () => {
  const qc = useQueryClient();

  const accept = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('accept_team_invitation', {
        _invitation_id: invitationId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.mine });
      qc.invalidateQueries({ queryKey: ['workspace'] });
      toast.success('Вы вступили в команду');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  const decline = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.rpc('decline_team_invitation', {
        _invitation_id: invitationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.mine });
      toast.success('Приглашение отклонено');
    },
    onError: (e: any) => toast.error(e.message || 'Ошибка'),
  });

  return { accept, decline };
};

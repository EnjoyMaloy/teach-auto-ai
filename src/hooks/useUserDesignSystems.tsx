import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DesignSystemConfig } from '@/types/designSystem';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface UserDesignSystem {
  id: string;
  name: string;
  description: string | null;
  config: DesignSystemConfig;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface UseUserDesignSystemsResult {
  systems: UserDesignSystem[];
  isLoading: boolean;
  createSystem: (name: string, description: string, config: DesignSystemConfig) => Promise<UserDesignSystem | null>;
  updateSystem: (id: string, updates: Partial<Omit<UserDesignSystem, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<boolean>;
  deleteSystem: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useUserDesignSystems = (): UseUserDesignSystemsResult => {
  const { user } = useAuth();
  const [systems, setSystems] = useState<UserDesignSystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSystems = useCallback(async () => {
    if (!user) {
      setSystems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_design_systems')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      const parsed = (data || []).map(item => ({
        ...item,
        config: item.config as unknown as DesignSystemConfig,
      }));

      setSystems(parsed);
    } catch (err) {
      console.error('Error fetching user design systems:', err);
      toast.error('Ошибка загрузки личных тем');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const createSystem = async (
    name: string,
    description: string,
    config: DesignSystemConfig
  ): Promise<UserDesignSystem | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_design_systems')
        .insert([{
          name,
          description: description || null,
          config: JSON.parse(JSON.stringify(config)),
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      const newSystem = {
        ...data,
        config: data.config as unknown as DesignSystemConfig,
      };

      setSystems(prev => [...prev, newSystem]);
      toast.success('Личная тема создана');
      return newSystem;
    } catch (err) {
      console.error('Error creating user design system:', err);
      toast.error('Ошибка создания личной темы');
      return null;
    }
  };

  const updateSystem = async (
    id: string,
    updates: Partial<Omit<UserDesignSystem, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.config !== undefined) updateData.config = updates.config;

      const { error } = await supabase
        .from('user_design_systems')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setSystems(prev => prev.map(s =>
        s.id === id
          ? { ...s, ...updates, updated_at: new Date().toISOString() }
          : s
      ));

      toast.success('Личная тема обновлена');
      return true;
    } catch (err) {
      console.error('Error updating user design system:', err);
      toast.error('Ошибка обновления личной темы');
      return false;
    }
  };

  const deleteSystem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_design_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSystems(prev => prev.filter(s => s.id !== id));
      toast.success('Личная тема удалена');
      return true;
    } catch (err) {
      console.error('Error deleting user design system:', err);
      toast.error('Ошибка удаления личной темы');
      return false;
    }
  };

  return {
    systems,
    isLoading,
    createSystem,
    updateSystem,
    deleteSystem,
    refetch: fetchSystems,
  };
};

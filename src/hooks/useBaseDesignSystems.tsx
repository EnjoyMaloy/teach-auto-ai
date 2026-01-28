import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DesignSystemConfig } from '@/types/designSystem';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface BaseDesignSystem {
  id: string;
  name: string;
  description: string | null;
  config: DesignSystemConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface UseBaseDesignSystemsResult {
  systems: BaseDesignSystem[];
  isLoading: boolean;
  createSystem: (name: string, description: string, config: DesignSystemConfig) => Promise<BaseDesignSystem | null>;
  updateSystem: (id: string, updates: Partial<Omit<BaseDesignSystem, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteSystem: (id: string) => Promise<boolean>;
  setDefault: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useBaseDesignSystems = (): UseBaseDesignSystemsResult => {
  const [systems, setSystems] = useState<BaseDesignSystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSystems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('base_design_systems')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;

      // Parse config from JSONB
      const parsed = (data || []).map(item => ({
        ...item,
        config: item.config as unknown as DesignSystemConfig,
      }));

      setSystems(parsed);
    } catch (err) {
      console.error('Error fetching base design systems:', err);
      toast.error('Ошибка загрузки базовых дизайн-систем');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const createSystem = async (
    name: string, 
    description: string, 
    config: DesignSystemConfig
  ): Promise<BaseDesignSystem | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        name,
        description: description || null,
        config: JSON.parse(JSON.stringify(config)) as Json,
        created_by: userData.user?.id,
      };
      
      const { data, error } = await supabase
        .from('base_design_systems')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newSystem = {
        ...data,
        config: data.config as unknown as DesignSystemConfig,
      };

      setSystems(prev => [...prev, newSystem]);
      toast.success('Дизайн-система создана');
      return newSystem;
    } catch (err) {
      console.error('Error creating base design system:', err);
      toast.error('Ошибка создания дизайн-системы');
      return null;
    }
  };

  const updateSystem = async (
    id: string, 
    updates: Partial<Omit<BaseDesignSystem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.config !== undefined) updateData.config = updates.config as unknown as Record<string, unknown>;
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;

      const { error } = await supabase
        .from('base_design_systems')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setSystems(prev => prev.map(s => 
        s.id === id 
          ? { ...s, ...updates, updated_at: new Date().toISOString() } 
          : s
      ));
      
      toast.success('Дизайн-система обновлена');
      return true;
    } catch (err) {
      console.error('Error updating base design system:', err);
      toast.error('Ошибка обновления дизайн-системы');
      return false;
    }
  };

  const deleteSystem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('base_design_systems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSystems(prev => prev.filter(s => s.id !== id));
      toast.success('Дизайн-система удалена');
      return true;
    } catch (err) {
      console.error('Error deleting base design system:', err);
      toast.error('Ошибка удаления дизайн-системы');
      return false;
    }
  };

  const setDefault = async (id: string): Promise<boolean> => {
    try {
      // First, unset any existing default
      await supabase
        .from('base_design_systems')
        .update({ is_default: false })
        .eq('is_default', true);

      // Then set the new default
      const { error } = await supabase
        .from('base_design_systems')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setSystems(prev => prev.map(s => ({
        ...s,
        is_default: s.id === id,
      })));

      toast.success('Дизайн-система по умолчанию обновлена');
      return true;
    } catch (err) {
      console.error('Error setting default design system:', err);
      toast.error('Ошибка установки дизайн-системы по умолчанию');
      return false;
    }
  };

  return {
    systems,
    isLoading,
    createSystem,
    updateSystem,
    deleteSystem,
    setDefault,
    refetch: fetchSystems,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ModelSettings {
  text_model: string;
  image_model: string;
}

export interface PromptSettings {
  research: string;
  structure: string;
  content: string;
  chat: string;
  subblock_ai: string;
}

interface AdminSettings {
  models: ModelSettings;
  prompts: PromptSettings;
}

const DEFAULT_MODELS: ModelSettings = {
  text_model: 'gemini-2.5-pro',
  image_model: 'gemini-3-pro-image-preview',
};

const DEFAULT_PROMPTS: PromptSettings = {
  research: '',
  structure: '',
  content: '',
  chat: '',
  subblock_ai: '',
};

export const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Флагманская модель, лучшая для сложных рассуждений и длинного контекста' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Стабильная рабочая лошадка, очень дешевая и надежная для массовых курсов' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Максимально облегченная и быстрая модель для простых текстовых задач' },
];

export const AVAILABLE_IMAGE_MODELS = [
  { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4 Ultra', description: 'Максимальное качество, поддержка разрешения до 2K/4K' },
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4', description: 'Стандартная версия четвертого поколения' },
  { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4 Fast', description: 'Самая быстрая и дешевая' },
  { value: 'gemini-3-pro-image', label: 'Gemini 3 Pro Image', description: 'Новая мультимодальная модель, лучше всех понимает длинные и сложные описания сцен' },
];

export const useAdminSettings = () => {
  const [models, setModels] = useState<ModelSettings>(DEFAULT_MODELS);
  const [prompts, setPrompts] = useState<PromptSettings>(DEFAULT_PROMPTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch models
      const { data: modelsData, error: modelsError } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'models')
        .maybeSingle();
      
      if (modelsError) throw modelsError;
      if (modelsData?.value) {
        setModels(modelsData.value as unknown as ModelSettings);
      }

      // Fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'prompts')
        .maybeSingle();
      
      if (promptsError) throw promptsError;
      if (promptsData?.value) {
        setPrompts(promptsData.value as unknown as PromptSettings);
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast.error('Ошибка загрузки настроек');
    } finally {
      setIsLoading(false);
    }
  };

  const saveModels = async (newModels: ModelSettings) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          key: 'models', 
          value: newModels as unknown as Json,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });
      
      if (error) throw error;
      
      setModels(newModels);
      toast.success('Модели сохранены');
    } catch (error) {
      console.error('Error saving models:', error);
      toast.error('Ошибка сохранения моделей');
    } finally {
      setIsSaving(false);
    }
  };

  const savePrompts = async (newPrompts: PromptSettings) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          key: 'prompts', 
          value: newPrompts as unknown as Json,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });
      
      if (error) throw error;
      
      setPrompts(newPrompts);
      toast.success('Промпты сохранены');
    } catch (error) {
      console.error('Error saving prompts:', error);
      toast.error('Ошибка сохранения промптов');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    models,
    prompts,
    isLoading,
    isSaving,
    saveModels,
    savePrompts,
    refetch: fetchSettings,
  };
};

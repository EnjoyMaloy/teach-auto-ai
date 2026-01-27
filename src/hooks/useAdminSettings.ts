import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ModelSettings {
  generate_course: string;
  generate_image: string;
  subblock_ai_text: string;
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
  generate_course: 'gemini-2.5-pro',
  generate_image: 'gemini-3-pro-image-preview',
  subblock_ai_text: 'gemini-2.5-flash',
};

const DEFAULT_PROMPTS: PromptSettings = {
  research: '',
  structure: '',
  content: '',
  chat: '',
  subblock_ai: '',
};

export const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Максимальное качество, медленнее' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Быстрый, хорошее качество' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Самый быстрый, базовое качество' },
];

export const AVAILABLE_IMAGE_MODELS = [
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', description: 'Высокое качество' },
  { value: 'gemini-2.5-flash-image', label: 'Nano Banana (Flash Image)', description: 'Быстрый, хорошее качество' },
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

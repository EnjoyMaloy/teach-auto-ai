import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { 
  ModelSettings as ModelSettingsType, 
  AVAILABLE_TEXT_MODELS, 
  AVAILABLE_IMAGE_MODELS 
} from '@/hooks/useAdminSettings';

interface ModelSettingsProps {
  models: ModelSettingsType;
  isSaving: boolean;
  onSave: (models: ModelSettingsType) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ models, isSaving, onSave }) => {
  const [localModels, setLocalModels] = React.useState<ModelSettingsType>(models);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setLocalModels(models);
    setHasChanges(false);
  }, [models]);

  const handleChange = (key: keyof ModelSettingsType, value: string) => {
    setLocalModels(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localModels);
    setHasChanges(false);
  };

  const modelConfigs = [
    {
      key: 'generate_course' as const,
      label: 'Генерация курсов (текст)',
      description: 'Используется для research, structure и content этапов',
      options: AVAILABLE_TEXT_MODELS,
    },
    {
      key: 'generate_image' as const,
      label: 'Генерация изображений',
      description: 'Единая модель для всех картинок (курсы и design-блоки)',
      options: AVAILABLE_IMAGE_MODELS,
    },
    {
      key: 'subblock_ai_text' as const,
      label: 'Design AI (текст)',
      description: 'Используется для текстовых ответов в редакторе блоков',
      options: AVAILABLE_TEXT_MODELS,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Модели</h2>
          <p className="text-muted-foreground">Настройка моделей Gemini для разных функций</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить
        </Button>
      </div>

      <div className="grid gap-4">
        {modelConfigs.map((config) => (
          <Card key={config.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{config.label}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={localModels[config.key]}
                onValueChange={(value) => handleChange(config.key, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModelSettings;

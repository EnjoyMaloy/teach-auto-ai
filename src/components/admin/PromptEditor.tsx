import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, FileText, Search, Layout, MessageSquare, Palette } from 'lucide-react';
import { PromptSettings } from '@/hooks/useAdminSettings';

interface PromptEditorProps {
  prompts: PromptSettings;
  isSaving: boolean;
  onSave: (prompts: PromptSettings) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompts, isSaving, onSave }) => {
  const [localPrompts, setLocalPrompts] = React.useState<PromptSettings>(prompts);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('research');

  React.useEffect(() => {
    setLocalPrompts(prompts);
    setHasChanges(false);
  }, [prompts]);

  const handleChange = (key: keyof PromptSettings, value: string) => {
    setLocalPrompts(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localPrompts);
    setHasChanges(false);
  };

  const promptConfigs = [
    {
      key: 'research' as const,
      label: 'Research Prompt',
      icon: Search,
      description: 'Промпт для этапа исследования темы',
    },
    {
      key: 'structure' as const,
      label: 'Structure Prompt',
      icon: Layout,
      description: 'Промпт для планирования структуры курса',
    },
    {
      key: 'content' as const,
      label: 'Content Prompt',
      icon: FileText,
      description: 'Промпт для генерации контента слайдов',
    },
    {
      key: 'chat' as const,
      label: 'Chat Prompt',
      icon: MessageSquare,
      description: 'Промпт для чат-ассистента в редакторе',
    },
    {
      key: 'subblock_ai' as const,
      label: 'Subblock AI Prompt',
      icon: Palette,
      description: 'Промпт для AI-редактора design-блоков',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Промпты</h2>
          <p className="text-muted-foreground">Редактирование системных промптов для AI</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {promptConfigs.map((config) => (
            <TabsTrigger key={config.key} value={config.key} className="gap-2">
              <config.icon className="w-4 h-4" />
              <span className="hidden md:inline">{config.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {promptConfigs.map((config) => (
          <TabsContent key={config.key} value={config.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="w-5 h-5" />
                  {config.label}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localPrompts[config.key]}
                  onChange={(e) => handleChange(config.key, e.target.value)}
                  placeholder={`Введите ${config.label.toLowerCase()}...`}
                  className="min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {localPrompts[config.key]?.length || 0} символов
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PromptEditor;

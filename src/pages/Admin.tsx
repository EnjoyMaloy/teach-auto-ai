import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import ModelSettings from '@/components/admin/ModelSettings';
import PromptEditor from '@/components/admin/PromptEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, FileCode, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'trupcgames@gmail.com';

const Admin: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { models, prompts, isLoading, isSaving, saveModels, savePrompts } = useAdminSettings();
  const [activeSection, setActiveSection] = useState('models');

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access control - redirect if not admin
  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Админ-панель</h1>
              <p className="text-sm text-muted-foreground">Управление AI-моделями и промптами</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Загрузка настроек...</span>
          </div>
        ) : (
          <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="models" className="gap-2">
                <Cpu className="w-4 h-4" />
                Модели
              </TabsTrigger>
              <TabsTrigger value="prompts" className="gap-2">
                <FileCode className="w-4 h-4" />
                Промпты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="models">
              <ModelSettings 
                models={models} 
                isSaving={isSaving} 
                onSave={saveModels} 
              />
            </TabsContent>

            <TabsContent value="prompts">
              <PromptEditor 
                prompts={prompts} 
                isSaving={isSaving} 
                onSave={savePrompts} 
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Admin;

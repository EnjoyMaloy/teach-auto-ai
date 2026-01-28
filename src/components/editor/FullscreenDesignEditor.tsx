import React, { useState } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { DesignSystemConfig } from '@/types/designSystem';
import { DesignSystemEditor } from './DesignSystemEditor';
import { DesignPreviewBlocks } from './DesignPreviewBlocks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FullscreenDesignEditorProps {
  config: DesignSystemConfig;
  onChange: (config: DesignSystemConfig) => void;
  onClose: () => void;
  isAdmin: boolean;
  courseTitle: string;
  selectedBaseSystemId: string | null;
  onBaseSystemSelect: (id: string | null) => void;
}

export const FullscreenDesignEditor: React.FC<FullscreenDesignEditorProps> = ({
  config,
  onChange,
  onClose,
  isAdmin,
  courseTitle,
  selectedBaseSystemId,
  onBaseSystemSelect,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with breadcrumbs */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        <nav className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <div className="h-5 w-px bg-border" />
          <button
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Мастерская
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-muted-foreground max-w-[200px] truncate">
            {courseTitle}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-sm font-semibold text-foreground">
            Дизайн-система
          </span>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Settings */}
        <div className="w-[420px] min-w-[380px] border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Настройки</h2>
            <p className="text-xs text-muted-foreground">Настройте внешний вид курса</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <DesignSystemEditor
                config={config}
                onChange={onChange}
                isAdmin={isAdmin}
                selectedBaseSystemId={selectedBaseSystemId}
                onBaseSystemSelect={onBaseSystemSelect}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card">
            <h2 className="font-semibold text-foreground">Предпросмотр</h2>
            <p className="text-xs text-muted-foreground">
              Так будет выглядеть ваш курс на всех типах блоков
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <DesignPreviewBlocks config={config} />
          </div>
        </div>
      </div>
    </div>
  );
};

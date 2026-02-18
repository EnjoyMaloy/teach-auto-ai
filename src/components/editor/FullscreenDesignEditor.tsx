import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, User, Cloud, RefreshCw, Check, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DesignSystemConfig } from '@/types/designSystem';
import { DesignSystemEditor } from './DesignSystemEditor';
import { DesignPreviewBlocks } from './DesignPreviewBlocks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SaveStatus } from './design-system/SaveStatusIndicator';

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
  isAdmin: realIsAdmin,
  courseTitle,
  selectedBaseSystemId,
  onBaseSystemSelect,
}) => {
  
  
  // Test mode toggle - allows switching between admin and regular user view
  const { theme, setTheme } = useTheme();
  const [isTestModeAdmin, setIsTestModeAdmin] = useState(realIsAdmin);
  
  // Save status indicator
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const lastConfigRef = useRef<string>(JSON.stringify(config));
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use test mode value for display, but only if real user is admin
  const effectiveIsAdmin = realIsAdmin ? isTestModeAdmin : false;

  // Track config changes for save status
  useEffect(() => {
    const currentConfig = JSON.stringify(config);
    if (currentConfig !== lastConfigRef.current) {
      // Config changed, show saving status (autosave in Editor.tsx handles persistence)
      setSaveStatus('saving');
      lastConfigRef.current = currentConfig;
      
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // After debounce period, show saved
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
        
        // Hide saved status after 2 seconds
        if (statusTimeoutRef.current) {
          clearTimeout(statusTimeoutRef.current);
        }
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 850); // Slightly longer than debounce to ensure save completed
    }
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [config, selectedBaseSystemId]);


  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with breadcrumbs */}
      <header className="h-14 bg-secondary dark:bg-black/10 flex items-center justify-between px-4 flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">Дизайн</span>
          </div>
        </div>

        {/* Cloud save status - centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Cloud className={cn(
              "w-5 h-5 transition-colors",
              saveStatus === 'saved' ? "text-emerald-500" : "text-muted-foreground"
            )} />
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-3 h-3 text-primary animate-spin absolute bottom-0.5 right-0.5" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3 h-3 text-emerald-500 absolute bottom-0.5 right-0.5" />
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role toggle for testing (only visible to real admins) */}
          {realIsAdmin && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <User className={cn("w-4 h-4", !isTestModeAdmin && "text-blue-500")} />
                <span className={cn("text-xs font-medium", !isTestModeAdmin && "text-blue-600")}>
                  Юзер
                </span>
              </div>
              <Switch
                checked={isTestModeAdmin}
                onCheckedChange={setIsTestModeAdmin}
                className="data-[state=checked]:bg-pink-500"
              />
              <div className="flex items-center gap-2">
                <Shield className={cn("w-4 h-4", isTestModeAdmin && "text-pink-500")} />
                <span className={cn("text-xs font-medium", isTestModeAdmin && "text-pink-600")}>
                  Админ
                </span>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main content - 3 columns */}
      <div className="flex-1 flex overflow-hidden isolate">
        <DesignSystemEditor
          config={config}
          onChange={onChange}
          isAdmin={effectiveIsAdmin}
          selectedBaseSystemId={selectedBaseSystemId}
          onBaseSystemSelect={onBaseSystemSelect}
          onRenderSplit={(themes, details) => (
            <>
              {/* Left: Theme selector */}
              <div className="w-[320px] max-w-[320px] shrink-0 grow-0 bg-secondary dark:bg-black/10 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden [&>[data-radix-scroll-area-viewport]]:!max-w-[320px]">
                  <div className="p-5 overflow-hidden max-w-[320px]">{themes}</div>
                </ScrollArea>
              </div>

              {/* Middle: Detailed settings */}
              <div className="w-[440px] max-w-[440px] shrink-0 grow-0 bg-secondary dark:bg-black/10 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden">
                  <div className="p-5 overflow-hidden">{details}</div>
                </ScrollArea>
              </div>

              {/* Right: Preview */}
              <div className="flex-1 min-w-0 flex flex-col bg-secondary dark:bg-black/10 overflow-hidden">
                <div className="flex-1 overflow-hidden m-2 rounded-2xl bg-background">
                  <DesignPreviewBlocks config={config} />
                </div>
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Undo2, Redo2, Eye, 
  Share2, Check, X, Palette, ChevronRight, Map,
  Cloud, RefreshCw, PanelLeft
} from 'lucide-react';
import { Course, Lesson, LessonsDisplayType } from '@/types/course';
import { DesignSystemConfig } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublishDialog } from './PublishDialog';
import { AIGeneratorDialog } from './AIGeneratorDialog';
import { FullscreenDesignEditor } from './FullscreenDesignEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { useAIGeneration } from '@/hooks/useAIGeneration';

interface EditorHeaderProps {
  course: Course;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
  isAISidebarOpen?: boolean;
  onToggleAISidebar?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDesignSystem: (config: DesignSystemConfig) => void;
  onUpdateLessonsDisplayType?: (type: LessonsDisplayType) => void;
  onAIGenerate?: (lessons: Lesson[]) => void;
  onBack?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  course,
  canUndo,
  canRedo,
  isSaving,
  hasUnsavedChanges = false,
  lastSavedAt,
  isAISidebarOpen = false,
  onToggleAISidebar,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onUpdateTitle,
  onUpdateDesignSystem,
  onUpdateLessonsDisplayType,
  onAIGenerate,
  onBack,
}) => {
  const { isAdmin } = useUserRole();
  const { state: aiState, isDialogOpen, setDialogOpen, showCompletionFlash } = useAIGeneration();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [selectedBaseSystemId, setSelectedBaseSystemId] = useState<string | null>(
    course.designSystem?.themeId || null
  );

  // Sync selectedBaseSystemId with course.designSystem.themeId when it changes
  useEffect(() => {
    const themeId = course.designSystem?.themeId || null;
    if (themeId !== selectedBaseSystemId) {
      setSelectedBaseSystemId(themeId);
    }
  }, [course.designSystem?.themeId]);

  // Theme selection is now handled by DesignSystemEditor which calls onChange with full config
  const handleBaseSystemSelect = (id: string | null) => {
    setSelectedBaseSystemId(id);
    // Note: The actual config is applied by DesignSystemEditor.handleBaseSystemSelect
    // which calls onChange with the full theme config including themeId
  };

  const handleStartEditing = () => {
    setEditedTitle(course.title);
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    setEditedTitle(course.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  const handlePublishClick = () => {
    onPublish();
    setShowPublishDialog(true);
  };

  const currentDisplayType = course.lessonsDisplayType || 'circle_map';

  // Mini preview component for map type
  const MapTypePreview: React.FC<{ type: LessonsDisplayType; isSelected: boolean; onClick: () => void }> = ({ 
    type, 
    isSelected, 
    onClick 
  }) => {
    const primaryColor = course.designSystem?.primaryColor || '262 83% 58%';
    const mutedColor = course.designSystem?.mutedColor || '240 5% 96%';
    const successColor = course.designSystem?.successColor || '142 71% 45%';
    
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex-1 p-3 rounded-xl border-2 transition-all hover:border-primary/50",
          isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
      >
        {/* Preview */}
        <div 
          className="h-32 rounded-lg mb-2 p-3 overflow-hidden"
          style={{ backgroundColor: `hsl(${mutedColor} / 0.5)` }}
        >
          {type === 'circle_map' ? (
            // Duolingo circles preview
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: `hsl(${successColor})`, color: 'white' }}
                >
                  ✓
                </div>
              </div>
              <div 
                className="w-1 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${mutedColor})` }}
              />
              <div className="relative" style={{ marginLeft: '20px' }}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                  style={{ 
                    backgroundColor: `hsl(${primaryColor})`, 
                    color: 'white',
                    boxShadow: `0 2px 0 0 hsl(${primaryColor} / 0.4)`
                  }}
                >
                  2
                </div>
              </div>
              <div 
                className="w-1 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${mutedColor})` }}
              />
              <div className="relative" style={{ marginRight: '20px' }}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs opacity-50"
                  style={{ backgroundColor: `hsl(${mutedColor})`, color: '#888' }}
                >
                  🔒
                </div>
              </div>
            </div>
          ) : (
            // List preview
            <div className="flex flex-col gap-1.5">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-1.5 rounded-md"
                  style={{ 
                    backgroundColor: i === 1 
                      ? `hsl(${successColor} / 0.15)` 
                      : i === 2 
                        ? 'white' 
                        : `hsl(${mutedColor} / 0.5)`,
                    opacity: i === 3 ? 0.5 : 1,
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center text-[8px]"
                    style={{ 
                      backgroundColor: i === 1 
                        ? `hsl(${successColor} / 0.3)` 
                        : `hsl(${mutedColor})`,
                    }}
                  >
                    {i === 1 ? '✓' : i === 3 ? '🔒' : '📚'}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="h-1.5 rounded-full w-3/4"
                      style={{ backgroundColor: `hsl(${mutedColor})` }}
                    />
                    <div 
                      className="h-1 rounded-full w-1/2 mt-1"
                      style={{ backgroundColor: `hsl(${mutedColor} / 0.5)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Label */}
        <p className={cn(
          "text-sm font-medium text-center",
          isSelected ? "text-primary" : "text-muted-foreground"
        )}>
          {type === 'circle_map' ? 'Кружки' : 'Список'}
        </p>
      </button>
    );
  };

  return (
    <>
      <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 gap-4">
        {/* Left section - Sidebar trigger + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          {/* AI Sidebar Toggle - simple icon */}
          {onToggleAISidebar && (
            <button
              onClick={onToggleAISidebar}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isAISidebarOpen 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1 min-w-0">
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Мастерская
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 w-48 text-sm border-border/50"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancelEditing}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span 
                className="text-sm font-medium text-foreground truncate max-w-[200px] cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={handleStartEditing}
                title="Двойной клик для редактирования"
              >
                {course.title}
              </span>
            )}
          </nav>

          <div className="w-px h-5 bg-border/50 ml-1" />

          {/* Design & Map buttons */}
          <button 
            onClick={() => setShowDesignSystem(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
            Дизайн
          </button>

          {onUpdateLessonsDisplayType && (
            <Popover open={showMapSettings} onOpenChange={setShowMapSettings}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Map className="w-3.5 h-3.5" />
                  Карта
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[320px] p-4" 
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Тип карты уроков</h4>
                    <p className="text-xs text-muted-foreground">
                      Как ученики будут видеть список уроков
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <MapTypePreview 
                      type="circle_map" 
                      isSelected={currentDisplayType === 'circle_map'}
                      onClick={() => {
                        onUpdateLessonsDisplayType('circle_map');
                      }}
                    />
                    <MapTypePreview 
                      type="list" 
                      isSelected={currentDisplayType === 'list'}
                      onClick={() => {
                        onUpdateLessonsDisplayType('list');
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Center section - Undo/Redo */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud save status - icon only */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <Cloud className={cn(
              "w-5 h-5 transition-colors",
              isSaving ? "text-muted-foreground" : 
              hasUnsavedChanges ? "text-amber-500" : 
              lastSavedAt ? "text-emerald-500" : "text-muted-foreground"
            )} />
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {isSaving ? (
                <RefreshCw className="w-3 h-3 text-primary animate-spin" />
              ) : hasUnsavedChanges ? (
                <X className="w-3 h-3 text-amber-500" />
              ) : lastSavedAt ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : null}
            </div>
          </div>

          <div className="w-px h-5 bg-border/50" />

          <button 
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Предпросмотр
          </button>

          <button 
            onClick={handlePublishClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Опубликовать
          </button>
        </div>
      </header>

      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        courseId={course.id}
        courseTitle={course.title}
        course={course}
        isLinkAccessible={(course as any).isLinkAccessible || false}
        isPublished={course.isPublished}
        moderationStatus={(course as any).moderationStatus || null}
        moderationComment={(course as any).moderationComment || null}
        onUpdate={() => window.location.reload()}
      />

      {/* Fullscreen Design Editor */}
      {showDesignSystem && (
        <FullscreenDesignEditor
          config={{
            primaryColor: course.designSystem?.primaryColor || '262 83% 58%',
            primaryForeground: course.designSystem?.primaryForeground || '0 0% 100%',
            backgroundColor: course.designSystem?.backgroundColor || '0 0% 100%',
            foregroundColor: course.designSystem?.foregroundColor || '240 10% 4%',
            cardColor: course.designSystem?.cardColor || '0 0% 100%',
            mutedColor: course.designSystem?.mutedColor || '240 5% 96%',
            accentColor: course.designSystem?.accentColor || '240 5% 96%',
            successColor: course.designSystem?.successColor || '142 71% 45%',
            partialColor: course.designSystem?.partialColor || '35 92% 50%',
            destructiveColor: course.designSystem?.destructiveColor || '0 84% 60%',
            fontFamily: course.designSystem?.fontFamily || 'Inter, system-ui, sans-serif',
            headingFontFamily: course.designSystem?.headingFontFamily || 'Inter, system-ui, sans-serif',
            customFonts: course.designSystem?.customFonts || [],
            borderRadius: course.designSystem?.borderRadius || '0.75rem',
            buttonStyle: course.designSystem?.buttonStyle || 'rounded',
            buttonDepth: course.designSystem?.buttonDepth || 'raised',
            backgroundPresetId: course.designSystem?.backgroundPresetId || 'white',
            backgroundType: course.designSystem?.backgroundType || 'solid',
            gradientFrom: course.designSystem?.gradientFrom || '262 83% 95%',
            gradientTo: course.designSystem?.gradientTo || '200 83% 95%',
            gradientAngle: course.designSystem?.gradientAngle || 135,
            sound: course.designSystem?.sound,
            designBlock: course.designSystem?.designBlock || {},
            mascot: course.designSystem?.mascot,
            themeBackgrounds: course.designSystem?.themeBackgrounds || [],
            defaultBackgroundId: course.designSystem?.defaultBackgroundId,
            themeId: course.designSystem?.themeId,
          }}
          onChange={onUpdateDesignSystem}
          onClose={() => setShowDesignSystem(false)}
          isAdmin={isAdmin}
          courseTitle={course.title}
          selectedBaseSystemId={selectedBaseSystemId}
          onBaseSystemSelect={handleBaseSystemSelect}
        />
      )}

      {/* AI Generator Dialog */}
      {onAIGenerate && (
        <AIGeneratorDialog
          open={isDialogOpen}
          onOpenChange={setDialogOpen}
          onGenerated={onAIGenerate}
          courseId={course.id}
          designSystem={course.designSystem}
        />
      )}
    </>
  );
};

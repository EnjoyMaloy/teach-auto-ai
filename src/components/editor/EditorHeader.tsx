import React, { useState, useEffect } from 'react';
import { 
  Undo2, Redo2, Eye, 
  Share2, Check, X, Palette, Map,
  Cloud, RefreshCw, PanelLeft, Volume2, VolumeX, Home, Sun, Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Course, Lesson, LessonsDisplayType } from '@/types/course';
import { DesignSystemConfig } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublishDialog } from './PublishDialog';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
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
  isPreviewMuted?: boolean;
  onToggleMute?: () => void;
  onToggleAISidebar?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDesignSystem: (config: DesignSystemConfig) => void;
  onUpdateLessonsDisplayType?: (type: LessonsDisplayType) => void;
  onAIGenerate?: (lessons: Lesson[], designConfig?: DesignSystemConfig, designSystemId?: string) => void;
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
  isPreviewMuted = false,
  onToggleMute,
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
  const { theme, setTheme } = useTheme();
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
          className="h-32 rounded-lg mb-2 p-3 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: 'hsl(0 0% 78%)' }}
        >
          {type === 'circle_map' ? (
            <div className="relative w-full h-full">
              {/* Owl silhouette - left side */}
              <svg className="absolute left-0.5 top-[30%]" style={{ opacity: 0.3 }} width="16" height="22" viewBox="0 0 32 44">
                <ellipse cx="16" cy="14" rx="12" ry="13" fill="hsl(0 0% 45%)"/>
                <path d="M6 4 L10 10" stroke="hsl(0 0% 45%)" strokeWidth="3" strokeLinecap="round"/>
                <path d="M26 4 L22 10" stroke="hsl(0 0% 45%)" strokeWidth="3" strokeLinecap="round"/>
                <ellipse cx="16" cy="34" rx="9" ry="10" fill="hsl(0 0% 45%)"/>
              </svg>
              {/* Owl silhouette - right side */}
              <svg className="absolute right-0.5 bottom-[20%]" style={{ opacity: 0.3 }} width="16" height="22" viewBox="0 0 32 44">
                <ellipse cx="16" cy="14" rx="12" ry="13" fill="hsl(0 0% 45%)"/>
                <path d="M6 4 L10 10" stroke="hsl(0 0% 45%)" strokeWidth="3" strokeLinecap="round"/>
                <path d="M26 4 L22 10" stroke="hsl(0 0% 45%)" strokeWidth="3" strokeLinecap="round"/>
                <ellipse cx="16" cy="34" rx="9" ry="10" fill="hsl(0 0% 45%)"/>
              </svg>
              {/* Zigzag circles */}
              <div className="flex flex-col items-start gap-1 h-full justify-center pl-4 pr-4">
                {/* 1 - completed (pastel green, bold check) */}
                <div className="flex w-full justify-start">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `hsl(${successColor} / 0.7)` }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                {/* 2 - active */}
                <div className="flex w-full justify-end">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(${primaryColor} / 0.6)` }}
                  />
                </div>
                {/* 3 - locked gray */}
                <div className="flex w-full justify-start">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(0 0% 60% / 0.5)` }}
                  />
                </div>
                {/* 4 - locked gray */}
                <div className="flex w-full justify-end">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(0 0% 60% / 0.5)` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-1.5 rounded-md"
                  style={{ 
                    backgroundColor: i === 1 
                      ? `hsl(${successColor} / 0.15)` 
                      : i === 2 
                        ? 'rgba(255,255,255,0.85)' 
                        : 'rgba(255,255,255,0.45)',
                    opacity: 1,
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{ 
                      backgroundColor: i === 1 
                        ? `hsl(${successColor} / 0.5)` 
                        : i === 2
                          ? 'hsl(0 0% 62%)'
                          : 'hsl(0 0% 68%)',
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <div 
                      className="h-1.5 rounded-full w-3/4"
                      style={{ backgroundColor: i === 1 ? 'hsl(0 0% 45%)' : 'hsl(0 0% 65%)' }}
                    />
                    <div 
                      className="h-1 rounded-full w-1/2"
                      style={{ backgroundColor: i === 1 ? 'hsl(0 0% 50%)' : 'hsl(0 0% 70%)' }}
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
      <header className="h-14 border-b border-border/5 dark:border-transparent bg-secondary/50 dark:bg-black/10 backdrop-blur-sm flex items-center justify-between px-4 gap-4 relative">
        {/* Left section - Sidebar trigger + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Academy logo - always visible, clickable to toggle sidebar */}
          {onToggleAISidebar && (
            <button
              onClick={onToggleAISidebar}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(265,60%,75%)] to-[hsl(265,60%,65%)] flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105"
            >
              <svg width="14" height="14" viewBox="0 1.5 15.22 15.5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.0069 1.94165H4.21278L0 16.8103H2.95308L3.94432 13.2583L4.74971 10.4911L6.29852 4.70887H8.92119L10.4494 10.4911L11.2754 13.2583L12.2666 16.8103H15.2197L11.0069 1.94165Z" fill="white"/>
                <path d="M9.06607 9.31335H6.1543V12.2251H9.06607V9.31335Z" fill="white"/>
              </svg>
            </button>
          )}

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
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Breadcrumb navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button onClick={onBack} className="flex items-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Home className="w-4 h-4" />
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {showDesignSystem ? (
                  <BreadcrumbLink asChild>
                    <button onClick={() => setShowDesignSystem(false)} className="transition-colors">
                      {course.title}
                    </button>
                  </BreadcrumbLink>
                ) : isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleSaveTitle}
                      className="h-7 w-48 text-sm border-border/50"
                      autoFocus
                    />
                  </div>
                ) : (
                  <BreadcrumbPage>
                    <span 
                      className="truncate max-w-[200px] cursor-pointer hover:text-primary transition-colors"
                      onDoubleClick={handleStartEditing}
                      title="Двойной клик для редактирования"
                    >
                      {course.title}
                    </span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {showDesignSystem && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Дизайн</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="w-px h-5 bg-border/50 ml-1" />

          {/* Design & Map buttons - icon only */}
          <button 
            onClick={() => setShowDesignSystem(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Дизайн"
          >
            <Palette className="w-4 h-4" />
          </button>

          {onUpdateLessonsDisplayType && (
            <Popover open={showMapSettings} onOpenChange={setShowMapSettings}>
              <PopoverTrigger asChild>
                <button 
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Карта"
                >
                  <Map className="w-4 h-4" />
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

        {/* Center section - Undo/Redo + Sound + Cloud */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
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

          <div className="w-px h-5 bg-border/50 mx-1" />

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={isPreviewMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isPreviewMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
           )}

          {/* Cloud save status */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <Cloud className={cn(
              "w-5 h-5 transition-colors",
              isSaving ? "text-muted-foreground" : 
              hasUnsavedChanges ? "text-amber-500" : 
              lastSavedAt ? "text-emerald-500" : "text-muted-foreground"
            )} />
            {isSaving ? (
              <RefreshCw className="w-3 h-3 text-primary animate-spin absolute bottom-0.5 right-0.5" />
            ) : hasUnsavedChanges ? null : lastSavedAt ? (
              <Check className="w-3 h-3 text-emerald-500 absolute bottom-0.5 right-0.5" />
            ) : null}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
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

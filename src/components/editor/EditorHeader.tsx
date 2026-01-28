import React, { useState } from 'react';
import { 
  Undo2, Redo2, Eye, 
  Share2, Loader2, Pencil, Check, X, Palette, ChevronRight, Map, Sparkles
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

interface EditorHeaderProps {
  course: Course;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedBaseSystemId, setSelectedBaseSystemId] = useState<string | null>(
    (course.designSystem as any)?.baseSystemId || null
  );

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
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
        {/* Left section - Breadcrumbs */}
        <div className="flex items-center gap-2">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1">
            <button
              onClick={onBack}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Мастерская
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-64 font-semibold"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSaveTitle}
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancelEditing}
                  className="h-7 w-7 text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <span 
                className="text-sm font-semibold text-foreground line-clamp-1 max-w-[300px] cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={handleStartEditing}
                title="Двойной клик для редактирования"
              >
                {course.title}
              </span>
            )}
          </nav>

          {/* Design System Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => setShowDesignSystem(true)}
          >
            <Palette className="w-4 h-4 mr-1" />
            Дизайн
          </Button>

          {/* Map Settings Button */}
          {onUpdateLessonsDisplayType && (
            <Popover open={showMapSettings} onOpenChange={setShowMapSettings}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Map className="w-4 h-4 mr-1" />
                  Карта
                </Button>
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
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl p-1.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border/50" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Auto-save status */}
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-primary font-medium">Сохранение...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-600 font-medium">Не сохранено</span>
            </div>
          ) : lastSavedAt ? (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Сохранено</span>
            </div>
          ) : null}

          <div className="h-6 w-px bg-border" />

          {/* AI Generator Button */}
          {onAIGenerate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAIGenerator(true)}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles className="w-4 h-4" />
              AI
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-1" />
            Предпросмотр
          </Button>

          <Button size="sm" onClick={handlePublishClick}>
            <Share2 className="w-4 h-4 mr-1" />
            Опубликовать
          </Button>
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
            destructiveColor: course.designSystem?.destructiveColor || '0 84% 60%',
            fontFamily: course.designSystem?.fontFamily || 'Inter, system-ui, sans-serif',
            headingFontFamily: course.designSystem?.headingFontFamily || 'Inter, system-ui, sans-serif',
            borderRadius: course.designSystem?.borderRadius || '0.75rem',
            buttonStyle: course.designSystem?.buttonStyle || 'rounded',
            buttonDepth: course.designSystem?.buttonDepth || 'raised',
            backgroundPresetId: course.designSystem?.backgroundPresetId || 'white',
            backgroundType: course.designSystem?.backgroundType || 'solid',
            gradientFrom: course.designSystem?.gradientFrom || '262 83% 95%',
            gradientTo: course.designSystem?.gradientTo || '200 83% 95%',
            gradientAngle: course.designSystem?.gradientAngle || 135,
            sound: course.designSystem?.sound,
            designBlock: course.designSystem?.designBlock,
            mascot: course.designSystem?.mascot,
          }}
          onChange={onUpdateDesignSystem}
          onClose={() => setShowDesignSystem(false)}
          isAdmin={isAdmin}
          courseTitle={course.title}
          selectedBaseSystemId={selectedBaseSystemId}
          onBaseSystemSelect={setSelectedBaseSystemId}
        />
      )}

      {/* AI Generator Dialog */}
      {onAIGenerate && (
        <AIGeneratorDialog
          open={showAIGenerator}
          onOpenChange={setShowAIGenerator}
          onGenerated={onAIGenerate}
          courseId={course.id}
        />
      )}
    </>
  );
};

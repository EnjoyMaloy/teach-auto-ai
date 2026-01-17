import React, { useState } from 'react';
import { 
  Undo2, Redo2, Eye, 
  Share2, Loader2, Pencil, Check, X, Palette, ChevronRight
} from 'lucide-react';
import { Course } from '@/types/course';
import { DesignSystemConfig } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublishDialog } from './PublishDialog';
import { DesignSystemEditor } from './DesignSystemEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);

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
              <div className="flex items-center gap-1.5 group">
                <span className="text-sm font-semibold text-foreground line-clamp-1 max-w-[200px]">
                  {course.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleStartEditing}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </nav>

          {/* Design System Button */}
          <Popover open={showDesignSystem} onOpenChange={setShowDesignSystem}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <Palette className="w-4 h-4 mr-1" />
                Дизайн
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[500px] p-0" 
              align="start"
              side="bottom"
              sideOffset={8}
            >
              <ScrollArea className="h-[70vh]">
                <div className="p-4">
                  <DesignSystemEditor
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
                      sound: course.designSystem?.sound,
                    }}
                    onChange={onUpdateDesignSystem}
                  />
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
        isLinkAccessible={(course as any).isLinkAccessible || false}
        isPublished={course.isPublished}
        moderationStatus={(course as any).moderationStatus || null}
        moderationComment={(course as any).moderationComment || null}
        onUpdate={() => window.location.reload()}
      />
    </>
  );
};
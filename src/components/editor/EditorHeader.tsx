import React, { useState } from 'react';
import { 
  Undo2, Redo2, Eye, Save, 
  Share2, Clock, Loader2, Pencil, Check, X, ArrowLeft, Palette, CloudOff, Cloud
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
        {/* Left section */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="border-border hover:bg-primary hover:border-primary hover:text-white transition-all gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Мастерская
            </Button>
          )}
          
          <div className="h-6 w-px bg-border" />
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 w-72 font-bold text-lg"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSaveTitle}
                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCancelEditing}
                className="h-8 w-8 text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="font-bold text-lg text-foreground line-clamp-1">{course.title}</h1>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleStartEditing}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

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
      />
    </>
  );
};
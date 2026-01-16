import React, { useState } from 'react';
import { 
  Undo2, Redo2, Eye, Save, 
  Share2, Clock, Loader2, Pencil, Check, X
} from 'lucide-react';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublishDialog } from './PublishDialog';

interface EditorHeaderProps {
  course: Course;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onUpdateTitle: (title: string) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  course,
  canUndo,
  canRedo,
  isSaving,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onUpdateTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ai to-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 w-64 font-bold"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSaveTitle}
                  className="h-7 w-7 text-success hover:text-success"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancelEditing}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-bold text-foreground line-clamp-1">{course.title}</h1>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleStartEditing}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{course.lessons.length} уроков</span>
              <span>•</span>
              <span>{course.estimatedMinutes} мин</span>
              {course.currentVersion > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    v{course.currentVersion}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center section - Undo/Redo */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-md"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-md"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>

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
import React from 'react';
import { 
  Undo2, Redo2, Eye, Save, 
  Share2, Clock, Loader2
} from 'lucide-react';
import { Course } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}) => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ai to-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        
        <div>
          <h1 className="font-bold text-foreground line-clamp-1">{course.title}</h1>
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

        <Button size="sm" onClick={onPublish}>
          <Share2 className="w-4 h-4 mr-1" />
          Опубликовать
        </Button>
      </div>
    </header>
  );
};

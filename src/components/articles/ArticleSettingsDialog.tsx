import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ArticleCoverEditor from './ArticleCoverEditor';

interface ArticleSettingsDialogProps {
  title: string;
  titleEn: string;
  coverGradient: string | null;
  coverImage: string | null;
  articleId: string;
  onTitleChange: (title: string) => void;
  onTitleEnChange: (titleEn: string) => void;
  onCoverUpdate: (gradient: string | null, image: string | null) => void;
}

const ArticleSettingsDialog: React.FC<ArticleSettingsDialogProps> = ({
  title,
  titleEn,
  coverGradient,
  coverImage,
  articleId,
  onTitleChange,
  onTitleEnChange,
  onCoverUpdate,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-xl h-10 w-10 shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground border-0">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки инструкции</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Titles */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title-ru">Название (RU)</Label>
              <Input
                id="title-ru"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Название на русском..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-en">Название (EN)</Label>
              <Input
                id="title-en"
                value={titleEn}
                onChange={(e) => onTitleEnChange(e.target.value)}
                placeholder="English title..."
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Cover */}
          <ArticleCoverEditor
            gradient={coverGradient}
            image={coverImage}
            articleId={articleId}
            onUpdate={onCoverUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleSettingsDialog;

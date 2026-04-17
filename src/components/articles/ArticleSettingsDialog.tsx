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
import ArticleCoverEditor, { ARTICLE_GRADIENTS } from './ArticleCoverEditor';

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
          {/* Banner preview */}
          {(() => {
            const gradient =
              coverGradient ||
              ARTICLE_GRADIENTS[Math.abs(articleId.charCodeAt(0)) % ARTICLE_GRADIENTS.length];
            return (
              <div
                className="w-full rounded-2xl overflow-hidden border border-border shadow-md flex items-center gap-3 p-4"
                style={{ background: gradient }}
              >
                <h3
                  className="flex-1 text-white font-semibold text-lg leading-tight line-clamp-3"
                  style={{ fontFamily: '"Wix Madefor Display", system-ui, sans-serif' }}
                >
                  {title || 'Новая инструкция'}
                </h3>
                <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt=""
                      className="max-h-full max-w-full object-contain drop-shadow-lg"
                    />
                  )}
                </div>
              </div>
            );
          })()}

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

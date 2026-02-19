import React, { useState, useEffect } from 'react';
import { Copy, Check, Bot, ExternalLink, Loader2, MessageCircle, BookOpen, RefreshCw, Compass, X, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types/course';
import { usePublishing } from '@/hooks/usePublishing';
import { COURSE_CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  course?: Course;
  isPublished?: boolean;
  category?: string | null;
  onUpdate?: () => void;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  course,
  isPublished = false,
  category = null,
  onUpdate,
}) => {
  const [copiedTelegram, setCopiedTelegram] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [telegramDeployed, setTelegramDeployed] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(null);
  const [hasPublished, setHasPublished] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category);
  const [isUpdatingCatalog, setIsUpdatingCatalog] = useState(false);
  
  const { isPublishing, publishCourse, hasPublishedVersion } = usePublishing();

  const publishedUrl = 'https://teach-auto-ai.lovable.app';
  const webUrl = `${publishedUrl}/course/${courseId}`;

  const [actualIsPublished, setActualIsPublished] = useState(isPublished);

  const [isEditingCategory, setIsEditingCategory] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      hasPublishedVersion(courseId).then(setHasPublished);
      setSelectedCategory(category);
      // Fetch actual publish status from DB
      supabase
        .from('courses')
        .select('is_published, category')
        .eq('id', courseId)
        .single()
        .then(({ data }) => {
          if (data) {
            setActualIsPublished(data.is_published ?? false);
            setSelectedCategory(data.category ?? category);
          }
        });
    }
  }, [open, courseId, category]);

  const handleCopyTelegramLink = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopiedTelegram(true);
      toast.success('URL для Mini App скопирован!');
      setTimeout(() => setCopiedTelegram(false), 2000);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleCopyBotLink = async () => {
    if (!botLink) return;
    try {
      await navigator.clipboard.writeText(botLink);
      toast.success('Ссылка на бота скопирована!');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  // Publish or update course to Explore catalog
  const handlePublishToExplore = async () => {
    if (!selectedCategory) {
      toast.error('Выберите раздел для публикации');
      return;
    }
    if (!course) return;

    setIsUpdatingCatalog(true);
    try {
      // Publish content to published_lessons/slides
      const success = await publishCourse(course);
      if (!success) throw new Error('Failed to publish content');

      // Update course metadata
      const { error } = await supabase
        .from('courses')
        .update({
          is_published: true,
          category: selectedCategory,
          published_at: new Date().toISOString(),
          is_link_accessible: true,
        })
        .eq('id', courseId);

      if (error) throw error;

      setHasPublished(true);
      setActualIsPublished(true);
      toast.success(actualIsPublished ? 'Курс обновлён в комьюнити' : 'Курс опубликован в комьюнити!');
      onUpdate?.();
    } catch (error) {
      console.error('Error publishing to explore:', error);
      toast.error('Ошибка публикации');
    } finally {
      setIsUpdatingCatalog(false);
    }
  };

  // Unified update for both Explore and Telegram
  const handleUnifiedUpdate = async () => {
    if (!course) return;
    setIsUpdatingCatalog(true);
    try {
      const success = await publishCourse(course);
      if (success) {
        setHasPublished(true);
        toast.success('Публичная версия обновлена');
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Ошибка обновления');
    } finally {
      setIsUpdatingCatalog(false);
    }
  };

  const handleDeployTelegram = async () => {
    if (!telegramToken.trim()) {
      toast.error('Введите API ключ Telegram бота');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Ensure published version exists
      if (!hasPublished && course) {
        const success = await publishCourse(course);
        if (!success) throw new Error('Failed to publish');
        setHasPublished(true);
      }

      // Also make link accessible for TG
      await supabase
        .from('courses')
        .update({ is_link_accessible: true })
        .eq('id', courseId);

      const { data, error } = await supabase.functions.invoke('deploy-telegram-bot', {
        body: {
          botToken: telegramToken.trim(),
          courseId,
          courseTitle,
          webAppUrl: webUrl,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error('Ошибка развёртывания', { description: data.details || data.error });
        return;
      }

      setBotUsername(data.botUsername);
      setBotLink(data.botLink);
      setTelegramDeployed(true);
      toast.success('Курс развёрнут в Telegram!', {
        description: `Бот @${data.botUsername} готов к использованию`,
      });
    } catch (error) {
      console.error('Deploy error:', error);
      toast.error('Ошибка развёртывания', { description: 'Проверьте правильность токена' });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleResetTelegram = () => {
    setTelegramDeployed(false);
    setTelegramToken('');
    setBotUsername(null);
    setBotLink(null);
  };

  const showUpdateButton = actualIsPublished && hasPublished;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Опубликовать курс</DialogTitle>
          <DialogDescription>
            Выберите способ публикации курса "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        {/* Unified Update Button - shown when course is already published */}
        {showUpdateButton && (
          <button
            onClick={handleUnifiedUpdate}
            disabled={isUpdatingCatalog || isPublishing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isUpdatingCatalog || isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Обновить публичную версию
          </button>
        )}

        <Tabs defaultValue="explore" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Комьюнити
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Telegram
            </TabsTrigger>
          </TabsList>

          {/* Explore / Catalog Tab */}
          <TabsContent value="explore" className="space-y-4 mt-4">
            {actualIsPublished ? (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-3">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Курс опубликован в комьюнити</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Category dropdown */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-green-300 dark:border-green-700 bg-green-100/50 dark:bg-green-900/30 text-sm text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors min-w-0">
                        {(() => {
                          const cat = COURSE_CATEGORIES.find(c => c.id === (selectedCategory || category));
                          return cat ? (
                            <>
                              <cat.icon className="w-3.5 h-3.5" />
                              {cat.name}
                            </>
                          ) : 'Выбрать раздел';
                        })()}
                        <Pencil className="w-3 h-3 ml-auto opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1.5" align="start">
                      {COURSE_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={async () => {
                            setSelectedCategory(cat.id);
                            await supabase
                              .from('courses')
                              .update({ category: cat.id })
                              .eq('id', courseId);
                            toast.success(`Раздел изменён на «${cat.name}»`);
                            onUpdate?.();
                          }}
                          className={cn(
                            "flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-sm transition-colors",
                            (selectedCategory || category) === cat.id
                              ? "bg-primary/10 text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <cat.icon className="w-4 h-4" />
                          {cat.name}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  {/* Unpublish button */}
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from('courses')
                        .update({ is_published: false, category: null })
                        .eq('id', courseId);
                      if (error) {
                        toast.error('Ошибка снятия с публикации');
                        return;
                      }
                      setActualIsPublished(false);
                      setSelectedCategory(null);
                      toast.success('Курс убран из комьюнити');
                      onUpdate?.();
                    }}
                    className="px-2.5 py-1.5 rounded-md border border-green-300 dark:border-green-700 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors whitespace-nowrap"
                  >
                    Снять с публикации
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Курс будет доступен всем в комьюнити. Выберите категорию:
                  </p>
                </div>

                {/* Category selector */}
                <div className="space-y-2">
                  <Label>Раздел каталога</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COURSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                          selectedCategory === cat.id
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <cat.icon className="w-4 h-4 flex-shrink-0" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handlePublishToExplore}
                  disabled={isUpdatingCatalog || isPublishing || !selectedCategory}
                >
                  {isUpdatingCatalog || isPublishing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Опубликовать в комьюнити
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="space-y-4 mt-4">
            {telegramDeployed ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Mini App развёрнут!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Курс доступен в боте <span className="font-medium text-foreground">@{botUsername}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Ссылка на бота</Label>
                  <div className="flex gap-2">
                    <Input
                      value={botLink || ''}
                      readOnly
                      className="bg-muted font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyBotLink}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => window.open(botLink || '', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Открыть в Telegram
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResetTelegram}
                  >
                    Сменить бота
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Курс станет доступен как Mini App в вашем Telegram-боте. Меню, команды и описание настроятся автоматически.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Токен бота</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Создайте бота или получите токен у{' '}
                    <a 
                      href="https://t.me/BotFather" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @BotFather
                    </a>
                    {' '}→ /mybots → API Token
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleDeployTelegram}
                  disabled={isDeploying || !telegramToken.trim()}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Развёртывание...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Развернуть Mini App
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

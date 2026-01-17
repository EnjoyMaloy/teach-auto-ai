import React, { useState, useEffect } from 'react';
import { Copy, Check, Globe, Bot, ExternalLink, Loader2, MessageCircle, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  isLinkAccessible?: boolean;
  isPublished?: boolean;
  moderationStatus?: string | null;
  moderationComment?: string | null;
  onUpdate?: () => void;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  isLinkAccessible = false,
  isPublished = false,
  moderationStatus = null,
  moderationComment = null,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedTelegram, setCopiedTelegram] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [telegramDeployed, setTelegramDeployed] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const publishedUrl = 'https://teach-auto-ai.lovable.app';
  const webUrl = `${publishedUrl}/course/${courseId}`;
  const previewUrl = `${window.location.origin}/course/${courseId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      toast.success('Ссылка скопирована!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

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

  const handleToggleLinkAccess = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_link_accessible: !isLinkAccessible })
        .eq('id', courseId);

      if (error) throw error;

      toast.success(isLinkAccessible ? 'Доступ по ссылке закрыт' : 'Курс доступен по ссылке');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating link access:', error);
      toast.error('Ошибка обновления');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitForModeration = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          moderation_status: 'pending',
          submitted_for_moderation_at: new Date().toISOString(),
          moderation_comment: null,
        })
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Курс отправлен на модерацию');
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting for moderation:', error);
      toast.error('Ошибка отправки на модерацию');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeployTelegram = async () => {
    if (!telegramToken.trim()) {
      toast.error('Введите API ключ Telegram бота');
      return;
    }

    setIsDeploying(true);
    
    try {
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
        toast.error('Ошибка развёртывания', {
          description: data.details || data.error,
        });
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
      toast.error('Ошибка развёртывания', {
        description: 'Проверьте правильность токена',
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Опубликовать курс</DialogTitle>
          <DialogDescription>
            Выберите способ публикации курса "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              По ссылке
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              В каталог
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Telegram
            </TabsTrigger>
          </TabsList>

          {/* Link Access Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                Курс будет доступен всем, у кого есть ссылка. Модерация не требуется.
              </p>
              
              <div className={`p-3 rounded-lg border ${isLinkAccessible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isLinkAccessible ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Globe className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-medium">
                      {isLinkAccessible ? 'Доступ открыт' : 'Доступ закрыт'}
                    </span>
                  </div>
                  <Button
                    variant={isLinkAccessible ? "outline" : "default"}
                    size="sm"
                    onClick={handleToggleLinkAccess}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isLinkAccessible ? (
                      'Закрыть доступ'
                    ) : (
                      'Открыть доступ'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isLinkAccessible && (
              <div className="space-y-2">
                <Label>Ссылка на курс</Label>
                <div className="flex gap-2">
                  <Input
                    value={webUrl}
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button className="w-full mt-2" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Открыть в новой вкладке
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4 mt-4">
            {isPublished ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Курс опубликован в каталоге</span>
                </div>
                <p className="text-sm text-green-600">
                  Курс доступен всем пользователям платформы
                </p>
              </div>
            ) : moderationStatus === 'pending' ? (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">На модерации</span>
                </div>
                <p className="text-sm text-yellow-600">
                  Курс проверяется модератором. Это может занять некоторое время.
                </p>
              </div>
            ) : moderationStatus === 'rejected' ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Требуются исправления</strong>
                    <p className="mt-1">{moderationComment || 'Комментарий модератора отсутствует'}</p>
                  </AlertDescription>
                </Alert>
                <Button 
                  className="w-full" 
                  onClick={handleSubmitForModeration}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Отправить на повторную модерацию
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Курс будет проверен модератором перед публикацией в каталоге.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Модератор проверит качество контента</li>
                    <li>После одобрения курс появится в каталоге</li>
                    <li>Вы получите уведомление о решении</li>
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSubmitForModeration}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Отправить на модерацию
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
              <>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="font-medium text-sm text-foreground mb-2">
                      1. Настройте Mini App в @BotFather:
                    </p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside mb-3">
                      <li>Откройте @BotFather → /mybots → выберите бота</li>
                      <li>Bot Settings → Menu Button → Configure menu button</li>
                      <li>Введите название кнопки (например: "🎓 Открыть курс")</li>
                      <li>Отправьте URL ниже:</li>
                    </ol>
                    <div className="flex gap-2">
                      <Input
                        value={webUrl}
                        readOnly
                        className="bg-background font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyTelegramLink}
                        className="shrink-0"
                      >
                        {copiedTelegram ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram-token">2. Введите API ключ бота</Label>
                    <Input
                      id="telegram-token"
                      type="password"
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Токен можно получить у <a 
                        href="https://t.me/BotFather" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @BotFather
                      </a> → /mybots → API Token
                    </p>
                  </div>
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState } from 'react';
import { Copy, Check, Globe, Bot, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
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

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [telegramDeployed, setTelegramDeployed] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botLink, setBotLink] = useState<string | null>(null);

  const webUrl = `${window.location.origin}/course/${courseId}`;

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

  const handleCopyBotLink = async () => {
    if (!botLink) return;
    try {
      await navigator.clipboard.writeText(botLink);
      toast.success('Ссылка на бота скопирована!');
    } catch {
      toast.error('Не удалось скопировать ссылку');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Опубликовать курс</DialogTitle>
          <DialogDescription>
            Выберите способ публикации курса "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="web" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Веб-ссылка
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Telegram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="space-y-4 mt-4">
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
            </div>

            <Button className="w-full" onClick={() => window.open(webUrl, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть в новой вкладке
            </Button>
          </TabsContent>

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
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">API ключ Telegram бота</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Создайте бота у <a 
                      href="https://t.me/BotFather" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @BotFather
                    </a> и скопируйте токен
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Что произойдёт:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Бот получит кнопку "Открыть курс"</li>
                    <li>Курс откроется как Mini App прямо в Telegram</li>
                    <li>Ученики смогут проходить курс без выхода из мессенджера</li>
                  </ul>
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
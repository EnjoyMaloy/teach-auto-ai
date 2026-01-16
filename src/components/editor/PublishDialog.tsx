import React, { useState } from 'react';
import { Copy, Check, Globe, Bot, ExternalLink, Loader2 } from 'lucide-react';
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

  const handleDeployTelegram = async () => {
    if (!telegramToken.trim()) {
      toast.error('Введите API ключ Telegram бота');
      return;
    }

    setIsDeploying(true);
    
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsDeploying(false);
    setTelegramDeployed(true);
    toast.success('Курс развёрнут в Telegram!', {
      description: 'Бот готов к использованию',
    });
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
                  className="bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
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
            <div className="space-y-2">
              <Label htmlFor="telegram-token">API ключ Telegram бота</Label>
              <Input
                id="telegram-token"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                disabled={telegramDeployed}
              />
              <p className="text-xs text-muted-foreground">
                Получите ключ у @BotFather в Telegram
              </p>
            </div>

            {telegramDeployed ? (
              <div className="p-4 rounded-lg bg-success-light border border-success/30">
                <div className="flex items-center gap-2 text-success">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Бот развёрнут!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Курс доступен в вашем Telegram боте как Mini App
                </p>
              </div>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
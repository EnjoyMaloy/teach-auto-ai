import React, { useState, useRef, useEffect } from 'react';
import { SubBlock } from '@/types/designBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

interface SubBlockAIChatProps {
  subBlock: SubBlock;
  onUpdate: (updates: Partial<SubBlock>) => void;
  onClose?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const SubBlockAIChat: React.FC<SubBlockAIChatProps> = ({
  subBlock,
  onUpdate,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subblock-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            currentSubBlock: subBlock,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || 'Готово!' 
      }]);

      // Apply updates if present
      if (data.updates && Object.keys(data.updates).length > 0) {
        onUpdate(data.updates);
        toast.success('Изменения применены');
      }

    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Произошла ошибка. Попробуйте ещё раз.' 
      }]);
      toast.error('Ошибка соединения с ИИ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all flex items-center gap-2 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">ИИ-ассистент</p>
          <p className="text-xs text-muted-foreground truncate">
            Опишите, что хотите изменить
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">ИИ-ассистент</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-48 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Примеры запросов:
            </p>
            <div className="mt-2 space-y-1">
              {[
                'Сделай текст более кратким',
                'Добавь эмодзи в начало',
                'Измени стиль на более формальный',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  className="block w-full text-xs text-primary/80 hover:text-primary py-1 px-2 rounded hover:bg-primary/5 transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'text-xs p-2 rounded-lg max-w-[90%]',
              msg.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {msg.content}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Думаю...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Что изменить..."
            className="min-h-[36px] max-h-20 text-xs resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubBlockAIChat;

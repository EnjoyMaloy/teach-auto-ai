import React, { useState, useRef, useEffect } from 'react';
import { SubBlock } from '@/types/designBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DesignAIChatProps {
  blockId: string;
  subBlocks: SubBlock[];
  onReplaceAllBlocks: (blocks: SubBlock[]) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Store chat history per block
const chatHistoryStore: Record<string, ChatMessage[]> = {};

export const DesignAIChat: React.FC<DesignAIChatProps> = ({
  blockId,
  subBlocks,
  onReplaceAllBlocks,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => 
    chatHistoryStore[blockId] || []
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to store when messages change
  useEffect(() => {
    chatHistoryStore[blockId] = messages;
  }, [messages, blockId]);

  // Load history when blockId changes
  useEffect(() => {
    setMessages(chatHistoryStore[blockId] || []);
  }, [blockId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    delete chatHistoryStore[blockId];
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const timestamp = Date.now();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);
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
            allSubBlocks: subBlocks,
            conversationHistory: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content
            })),
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
        content: data.message || 'Готово!',
        timestamp: Date.now()
      }]);

      // Handle new blocks
      if (data.newBlocks && Array.isArray(data.newBlocks) && data.newBlocks.length > 0) {
        const blocksWithIds = data.newBlocks.map((block: Partial<SubBlock>, index: number) => ({
          ...block,
          id: crypto.randomUUID(),
          order: index,
        })) as SubBlock[];
        
        onReplaceAllBlocks(blocksWithIds);
        toast.success(`Создано ${blocksWithIds.length} элементов`);
      } else if (data.updates && Object.keys(data.updates).length > 0) {
        // If there are updates but no target block specified, apply to all text/heading blocks
        toast.info('Укажите конкретный блок для изменения');
      }

    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Произошла ошибка. Попробуйте ещё раз.',
        timestamp: Date.now()
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

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">ИИ-дизайнер</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Очистить историю"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Опишите, какой слайд хотите создать:
            </p>
            <div className="space-y-1">
              {[
                'Сделай слайд про DeFi с таблицей сравнения',
                'Добавь заголовок и 3 пункта преимуществ',
                'Создай карточку с иконкой и описанием',
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  className="block w-full text-xs text-primary/80 hover:text-primary py-1.5 px-2 rounded hover:bg-primary/5 transition-colors text-left"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={`${msg.timestamp}-${i}`}
            className={cn(
              'text-xs p-2.5 rounded-lg max-w-[95%]',
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
            Генерирую дизайн...
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
            placeholder="Опишите, что создать или изменить..."
            className="min-h-[40px] max-h-24 text-xs resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex-shrink-0"
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

export default DesignAIChat;

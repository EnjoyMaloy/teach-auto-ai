import React, { useState, useRef, useEffect } from 'react';
import { SubBlock } from '@/types/designBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Loader2, Sparkles, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
// Store expanded state per block
const expandedStateStore: Record<string, boolean> = {};

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
  const [isExpanded, setIsExpanded] = useState(() => 
    expandedStateStore[blockId] ?? true
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to store when messages change
  useEffect(() => {
    chatHistoryStore[blockId] = messages;
  }, [messages, blockId]);

  // Save expanded state
  useEffect(() => {
    expandedStateStore[blockId] = isExpanded;
  }, [isExpanded, blockId]);

  // Load history when blockId changes
  useEffect(() => {
    setMessages(chatHistoryStore[blockId] || []);
    setIsExpanded(expandedStateStore[blockId] ?? true);
  }, [blockId]);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

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
          id: block.id || crypto.randomUUID(),
          order: index,
        })) as SubBlock[];
        
        onReplaceAllBlocks(blocksWithIds);
        toast.success(`Обновлено ${blocksWithIds.length} элементов`);
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
    <div className="flex flex-col bg-gradient-to-t from-primary/5 to-transparent border-t border-primary/20">
      {/* Collapsed header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">ИИ-дизайнер</span>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearHistory();
              }}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Очистить историю"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* Messages area */}
          <div className="max-h-64 overflow-y-auto px-3 pb-2 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Опишите, что хотите создать:
                </p>
                <div className="space-y-1">
                  {[
                    'Структурируй этот текст красиво',
                    'Добавь заголовок и 3 пункта',
                    'Сделай таблицу сравнения',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(example)}
                      className="block w-full text-xs text-primary/70 hover:text-primary py-1.5 px-2 rounded hover:bg-primary/5 transition-colors text-left"
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
                  'text-xs p-2.5 rounded-lg max-w-[90%]',
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
                Генерирую...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 pb-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите изменения..."
                className="min-h-[44px] max-h-24 text-sm resize-none rounded-xl"
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 flex-shrink-0 rounded-xl"
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
      )}
    </div>
  );
};

export default DesignAIChat;

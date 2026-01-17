import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide } from '@/types/course';
import { 
  Sparkles, 
  Loader2, 
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isApplying?: boolean;
}

interface AIChatPanelProps {
  course: Course;
  selectedLesson?: Lesson | null;
  selectedSlide?: Slide | null;
  onApplyChanges: (updatedLessons: Lesson[]) => void;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  course,
  selectedLesson,
  selectedSlide,
  onApplyChanges,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я помогу улучшить ваш курс. Вы можете попросить меня:\n\n• Улучшить текст слайда\n• Добавить новые вопросы\n• Сделать контент интереснее\n• Исправить ошибки\n\nОпишите, что хотите изменить.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContext = () => {
    const context: string[] = [];
    
    context.push(`Курс: "${course.title}"`);
    if (course.description) {
      context.push(`Описание: ${course.description}`);
    }
    
    context.push(`\nУроков в курсе: ${course.lessons.length}`);
    
    if (selectedLesson) {
      context.push(`\nВыбранный урок: "${selectedLesson.title}"`);
      context.push(`Слайдов в уроке: ${selectedLesson.slides.length}`);
      
      // Add slide summaries
      selectedLesson.slides.forEach((slide, idx) => {
        const preview = slide.content?.substring(0, 100) || '';
        context.push(`  Слайд ${idx + 1} (${slide.type}): ${preview}...`);
      });
    }
    
    if (selectedSlide) {
      context.push(`\nВыбранный слайд:`);
      context.push(`  Тип: ${selectedSlide.type}`);
      context.push(`  Контент: ${selectedSlide.content}`);
      if (selectedSlide.options) {
        context.push(`  Варианты ответов: ${JSON.stringify(selectedSlide.options)}`);
      }
      if (selectedSlide.explanation) {
        context.push(`  Объяснение: ${selectedSlide.explanation}`);
      }
    }
    
    return context.join('\n');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      const fullMessage = `Контекст курса:
${context}

Запрос пользователя: ${userMessage.content}

Если пользователь просит изменить контент, верни JSON с изменениями в формате:
{
  "action": "update_slide" | "add_slide" | "update_lesson",
  "changes": { ... },
  "explanation": "Что было изменено"
}

Если это просто вопрос — отвечай текстом.`;

      const response = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: fullMessage, 
          mode: 'chat' 
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Ошибка при обращении к AI');
      }

      const content = response.data?.content || 'Извините, не удалось получить ответ.';
      
      // Check if response contains JSON with changes
      let parsedResponse = null;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Not JSON, just text response
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: parsedResponse?.explanation || content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there are changes to apply, show apply button
      if (parsedResponse?.action && parsedResponse?.changes) {
        // For now, just show what would change
        // In future, implement actual changes
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Ошибка: ${err instanceof Error ? err.message : 'Не удалось получить ответ'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          AI Ассистент
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px] h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Ассистент</h3>
            <p className="text-xs text-muted-foreground">
              {selectedLesson ? `Урок: ${selectedLesson.title}` : 'Помощь с курсом'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsMinimized(true)}
            className="h-7 w-7"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                {message.role === 'user' 
                  ? <User className="w-4 h-4" /> 
                  : <Bot className="w-4 h-4" />
                }
              </div>
              <div className={cn(
                "max-w-[280px] rounded-xl px-3 py-2 text-sm",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted rounded-tl-sm"
              )}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className={cn(
                  "text-[10px] mt-1 block",
                  message.role === 'user' 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                )}>
                  {message.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите, что хотите улучшить..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Shift+Enter для новой строки • Enter для отправки
        </p>
      </div>
    </div>
  );
};

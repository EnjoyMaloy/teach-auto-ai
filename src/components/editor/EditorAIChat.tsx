import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Course, Slide, Lesson } from '@/types/course';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EditorAIChatProps {
  course: Course;
  selectedLesson: Lesson | null;
  selectedSlide: Slide | null;
  onUpdateCourse: (updates: Partial<Course>) => void;
  onUpdateSlide: (slideId: string, updates: Partial<Slide>) => void;
  onAddLesson: (lesson: Partial<Lesson>) => void;
}

export const EditorAIChat: React.FC<EditorAIChatProps> = ({
  course,
  selectedLesson,
  selectedSlide,
  onUpdateCourse,
  onUpdateSlide,
  onAddLesson,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я помогу тебе с курсом. Спроси меня о:\n\n• Улучшении слайдов\n• Создании новых уроков\n• Идеях для контента\n• Проверке качества',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    let context = `Текущий курс: "${course.title}"\n`;
    context += `Описание: ${course.description}\n`;
    context += `Уроков: ${course.lessons.length}\n\n`;

    if (selectedLesson) {
      context += `Выбранный урок: "${selectedLesson.title}"\n`;
      context += `Слайдов в уроке: ${selectedLesson.slides.length}\n\n`;
    }

    if (selectedSlide) {
      context += `Выбранный слайд (${selectedSlide.type}):\n`;
      context += `Контент: ${selectedSlide.content}\n`;
      if (selectedSlide.options) {
        context += `Варианты: ${selectedSlide.options.map(o => o.text).join(', ')}\n`;
      }
      if (selectedSlide.explanation) {
        context += `Объяснение: ${selectedSlide.explanation}\n`;
      }
    }

    return context;
  };

  const callAI = async (userMessage: string) => {
    const context = buildContext();
    
    const { data, error } = await supabase.functions.invoke('generate-course', {
      body: { 
        userMessage: `${context}\n\nЗапрос пользователя: ${userMessage}`,
        agentRole: 'assistant',
        mode: 'chat'
      }
    });

    if (error) {
      throw new Error(error.message || 'Ошибка AI');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data.content;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await callAI(currentInput);
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка AI');
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: '❌ Произошла ошибка. Попробуй ещё раз.',
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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        variant="ai"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-ai/10 to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ai to-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Ассистент</h3>
            <p className="text-xs text-muted-foreground">Помощь с курсом</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Context indicator */}
      {(selectedLesson || selectedSlide) && (
        <div className="px-3 py-2 bg-muted/50 border-b border-border">
          <p className="text-xs text-muted-foreground">
            {selectedSlide 
              ? `📍 Слайд: ${selectedSlide.content.substring(0, 30)}...`
              : selectedLesson 
                ? `📚 Урок: ${selectedLesson.title}`
                : null
            }
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-ai to-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              <div className="whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-ai to-primary flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-secondary text-secondary-foreground rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Спроси что-нибудь..."
            className="flex-1 px-3 py-2 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            variant="ai"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIMessage, CourseStructure } from '@/types/course';
import { initialAIMessages } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface AIChatProps {
  onCourseGenerated: (structure: CourseStructure) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onCourseGenerated }) => {
  const [messages, setMessages] = useState<AIMessage[]>(initialAIMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<'planner' | 'builder' | 'reviewer'>('planner');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    // Simulate Planner response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const plannerResponse: AIMessage = {
      id: `msg-${Date.now()}-planner`,
      role: 'assistant',
      agentRole: 'planner',
      content: `📋 **Анализирую запрос...**\n\nВы хотите курс на тему, связанную с "${userMessage}". Формирую структуру курса.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, plannerResponse]);
    setCurrentAgent('builder');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const courseStructure: CourseStructure = {
      title: 'DeFi для начинающих',
      description: 'Изучите основы децентрализованных финансов за 10 минут',
      targetAudience: 'Новички в криптовалютах',
      estimatedMinutes: 10,
      lessons: [
        {
          title: 'Что такое DeFi?',
          description: 'Базовые понятия',
          slidesCount: 5,
          slideTypes: ['text', 'image_text', 'single_choice', 'true_false', 'fill_blank'],
        },
        {
          title: 'Основные протоколы',
          description: 'Uniswap, Aave, Compound',
          slidesCount: 6,
          slideTypes: ['text', 'image_text', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank'],
        },
        {
          title: 'Риски и безопасность',
          description: 'Защита активов',
          slidesCount: 4,
          slideTypes: ['text', 'single_choice', 'true_false', 'fill_blank'],
        },
      ],
    };

    const builderResponse: AIMessage = {
      id: `msg-${Date.now()}-builder`,
      role: 'assistant',
      agentRole: 'builder',
      content: `🏗️ **Структура готова!**\n\n**${courseStructure.title}**\n${courseStructure.description}\n\n📚 **${courseStructure.lessons.length} урока** • ⏱️ **~${courseStructure.estimatedMinutes} минут**\n\n${courseStructure.lessons.map((l, i) => `${i + 1}. **${l.title}** (${l.slidesCount} слайдов)`).join('\n')}`,
      timestamp: new Date(),
      metadata: { courseStructure },
    };
    setMessages(prev => [...prev, builderResponse]);
    setCurrentAgent('reviewer');

    await new Promise(resolve => setTimeout(resolve, 1500));

    const reviewerResponse: AIMessage = {
      id: `msg-${Date.now()}-reviewer`,
      role: 'assistant',
      agentRole: 'reviewer',
      content: `✅ **Проверка пройдена!**\n\n• Длина текстов оптимальна\n• Квизы логически корректны\n• Сложность подходит для новичков\n\n🎉 Курс готов к редактированию!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, reviewerResponse]);
    
    setIsLoading(false);
    setCurrentAgent('planner');
    onCourseGenerated(courseStructure);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    simulateAIResponse(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentBadge = (agent?: 'planner' | 'builder' | 'reviewer') => {
    const badges = {
      planner: { label: 'Planner', color: 'bg-purple-100 text-purple-700' },
      builder: { label: 'Builder', color: 'bg-blue-100 text-blue-700' },
      reviewer: { label: 'Reviewer', color: 'bg-green-100 text-green-700' },
    };
    if (!agent) return null;
    const badge = badges[agent];
    return (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', badge.color)}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl shadow-medium overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-ai/5 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ai to-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">AI Course Generator</h2>
            <p className="text-sm text-muted-foreground">Опишите курс — я создам его</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-fade-up',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ai to-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-secondary text-secondary-foreground rounded-tl-sm'
              )}
            >
              {message.agentRole && (
                <div className="mb-2">{getAgentBadge(message.agentRole)}</div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-up">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ai to-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {currentAgent === 'planner' && 'Planner анализирует...'}
                  {currentAgent === 'builder' && 'Builder создаёт контент...'}
                  {currentAgent === 'reviewer' && 'Reviewer проверяет...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите курс, который хотите создать..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-sm placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon-lg"
            variant="ai"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Пример: "Сделай курс про DeFi для новичков на 10 минут"
        </p>
      </div>
    </div>
  );
};

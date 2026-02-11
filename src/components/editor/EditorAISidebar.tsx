import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, MessageSquare, Wand2, Loader2, Check, 
  AlertCircle, Search, Brain, Layers, BookOpen, CheckCircle2, 
  Image, Clock, RotateCcw, PartyPopper, Send, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { Lesson, CourseDesignSystem } from '@/types/course';
import { useAIGeneration, GenerationStep, getGenerationDuration } from '@/hooks/useAIGeneration';
import { supabase } from '@/integrations/supabase/client';

interface EditorAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  designSystem?: CourseDesignSystem;
  selectedBlock: Block | null;
  onAIGenerate: (lessons: Lesson[]) => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
}

type SidebarMode = 'chat' | 'generate' | 'edit-block';

export const EditorAISidebar: React.FC<EditorAISidebarProps> = ({
  isOpen,
  onClose,
  courseId,
  designSystem,
  selectedBlock,
  onAIGenerate,
  onUpdateBlock,
}) => {
  const [mode, setMode] = useState<SidebarMode>('chat');
  const [chatInput, setChatInput] = useState('');
  const [editInput, setEditInput] = useState('');
  const [isEditingBlock, setIsEditingBlock] = useState(false);

  // Course generation state
  const {
    state,
    startGeneration,
    cancelGeneration,
    resetGeneration,
    updateStep,
    setSteps,
    completeGeneration,
    abortController,
    setDesignSystem,
  } = useAIGeneration();

  const [localPrompt, setLocalPrompt] = useState('');
  const [localSkipImages, setLocalSkipImages] = useState(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    setDesignSystem(designSystem);
  }, [designSystem, setDesignSystem]);

  const isGenerating = state.status === 'generating';
  const isCompleted = state.status === 'completed';
  const isError = state.status === 'error';
  const duration = getGenerationDuration(state.startTime, state.endTime);

  // Quick suggestions
  const quickSuggestions = [
    { icon: BookOpen, label: 'Создать курс', action: () => setMode('generate') },
    { icon: Wand2, label: 'Редактировать блок', action: () => selectedBlock && setMode('edit-block') },
  ];

  const editSuggestions = selectedBlock ? [
    'Сделай текст короче',
    'Добавь эмодзи',
    'Сделай более формальным',
    'Переведи на английский',
  ] : [];

  const handleEditBlock = async () => {
    if (!selectedBlock || !editInput.trim()) return;
    
    setIsEditingBlock(true);
    try {
      const response = await supabase.functions.invoke('subblock-ai', {
        body: {
          prompt: editInput,
          context: {
            blockType: selectedBlock.type,
            currentContent: selectedBlock.content,
            currentSubBlocks: selectedBlock.subBlocks,
          },
          type: 'edit',
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.content) {
        onUpdateBlock({ content: result.content });
      }
      if (result.subBlocks) {
        onUpdateBlock({ subBlocks: result.subBlocks });
      }

      setEditInput('');
    } catch (error) {
      console.error('Block edit error:', error);
    } finally {
      setIsEditingBlock(false);
    }
  };

  // Render step icon
  const getStepIcon = (step: GenerationStep) => {
    if (step.status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (step.status === 'active') return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    if (step.status === 'error') return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const getStepIconByType = (id: string) => {
    switch (id) {
      case 'research': return <Search className="w-4 h-4" />;
      case 'structure': return <Layers className="w-4 h-4" />;
      case 'content': return <Brain className="w-4 h-4" />;
      case 'images': return <Image className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div 
      className={cn(
        "h-full flex flex-col border-r border-border/5 dark:border-transparent bg-secondary/50 dark:bg-white/[0.02] backdrop-blur-sm transition-all duration-300 ease-out overflow-hidden",
        isOpen ? "w-[380px]" : "w-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-ai flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">AI Помощник</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Mode: Chat (default) */}
          {mode === 'chat' && !isGenerating && !isCompleted && (
            <>
              {/* Quick actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Что сделать?
                </p>
                <div className="grid gap-2">
                  {quickSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={suggestion.action}
                      disabled={suggestion.label === 'Редактировать блок' && !selectedBlock}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border border-border bg-card',
                        'hover:border-primary/50 hover:bg-primary/5 transition-all text-left',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <suggestion.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{suggestion.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.label === 'Редактировать блок' && !selectedBlock 
                            ? 'Сначала выберите блок'
                            : suggestion.label === 'Создать курс'
                              ? 'Сгенерировать уроки и контент'
                              : 'Изменить выбранный блок'
                          }
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected block info */}
              {selectedBlock && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Выбранный блок:</p>
                  <p className="font-medium text-foreground">
                    {BLOCK_CONFIGS[selectedBlock.type]?.labelRu || selectedBlock.type}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Mode: Generate Course */}
          {mode === 'generate' && !isGenerating && !isCompleted && !isError && (
            <div className="space-y-4">
              <button 
                onClick={() => setMode('chat')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Назад
              </button>

              <div>
                <h3 className="font-semibold text-foreground mb-1">Создать курс с AI</h3>
                <p className="text-sm text-muted-foreground">
                  Опишите тему и AI сгенерирует уроки и контент
                </p>
              </div>

              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="Например: Курс по основам Python для начинающих..."
                rows={4}
                className="resize-none"
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipImages"
                  checked={localSkipImages}
                  onCheckedChange={(checked) => setLocalSkipImages(checked === true)}
                />
                <Label htmlFor="skipImages" className="text-sm text-muted-foreground cursor-pointer">
                  Быстрый режим (без иллюстраций)
                </Label>
              </div>

              <Button
                onClick={() => {
                  if (!localPrompt.trim()) return;
                  startGeneration(localPrompt, localSkipImages);
                  // Start generation logic here (same as AIGeneratorDialog)
                }}
                disabled={!localPrompt.trim()}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Сгенерировать курс
              </Button>
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Генерируем курс:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{state.prompt}</p>
              </div>

              <div className="space-y-2">
                {state.steps.map((step) => (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      step.status === 'active' && "bg-primary/5 border border-primary/20",
                      step.status === 'completed' && "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
                      step.status === 'error' && "bg-destructive/5 border border-destructive/20",
                      step.status === 'pending' && "opacity-50"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{getStepIconByType(step.id)}</span>
                        <span className={cn(
                          "font-medium text-sm",
                          step.status === 'completed' && "text-emerald-700 dark:text-emerald-400",
                          step.status === 'error' && "text-destructive"
                        )}>
                          {step.label}
                        </span>
                      </div>
                      {step.message && (
                        <p className={cn(
                          "text-xs mt-0.5",
                          step.status === 'error' ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={cancelGeneration}
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
              >
                Отменить генерацию
              </Button>
            </div>
          )}

          {/* Completed state */}
          {isCompleted && state.generatedLessons && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <PartyPopper className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Курс успешно создан!
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-600">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {state.generatedLessons.length} уроков
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {duration} сек
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLocalPrompt(state.prompt);
                    resetGeneration();
                  }}
                  className="flex-1 gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Новый
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onAIGenerate(state.generatedLessons!);
                    resetGeneration();
                    setMode('chat');
                  }}
                  className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" />
                  Применить
                </Button>
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Ошибка генерации</span>
                </div>
                <p className="text-sm text-destructive/80">{state.error}</p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setLocalPrompt(state.prompt);
                  resetGeneration();
                }}
                className="w-full"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {/* Mode: Edit Block */}
          {mode === 'edit-block' && selectedBlock && (
            <div className="space-y-4">
              <button 
                onClick={() => setMode('chat')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Назад
              </button>

              <div>
                <h3 className="font-semibold text-foreground mb-1">Редактировать блок</h3>
                <p className="text-sm text-muted-foreground">
                  {BLOCK_CONFIGS[selectedBlock.type]?.labelRu}
                </p>
              </div>

              {/* Quick edit suggestions */}
              <div className="flex flex-wrap gap-2">
                {editSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setEditInput(suggestion)}
                    className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder="Опишите что изменить..."
                  rows={3}
                  className="resize-none pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditBlock();
                    }
                  }}
                />
                <Button
                  size="icon-sm"
                  onClick={handleEditBlock}
                  disabled={!editInput.trim() || isEditingBlock}
                  className="absolute bottom-2 right-2"
                >
                  {isEditingBlock ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom input for chat mode */}
      {mode === 'chat' && !isGenerating && !isCompleted && (
        <div className="p-4 border-t border-border">
          <div className="relative">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Задайте вопрос..."
              rows={2}
              className="resize-none pr-12"
            />
            <Button
              size="icon-sm"
              onClick={() => {
                if (chatInput.trim()) {
                  setLocalPrompt(chatInput);
                  setMode('generate');
                }
              }}
              disabled={!chatInput.trim()}
              className="absolute bottom-2 right-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

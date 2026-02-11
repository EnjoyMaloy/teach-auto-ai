import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Wand2, Loader2, Check, 
  AlertCircle, Search, Brain, Layers, BookOpen, CheckCircle2, 
  Image, Clock, RotateCcw, PartyPopper, Send, CornerDownLeft,
  Plus, MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type SidebarMode = 'idle' | 'generate' | 'edit-block';

export const EditorAISidebar: React.FC<EditorAISidebarProps> = ({
  isOpen,
  onClose,
  courseId,
  designSystem,
  selectedBlock,
  onAIGenerate,
  onUpdateBlock,
}) => {
  const [mode, setMode] = useState<SidebarMode>('idle');
  const [chatInput, setChatInput] = useState('');
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [localSkipImages, setLocalSkipImages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    setDesignSystem(designSystem);
  }, [designSystem, setDesignSystem]);

  const isGenerating = state.status === 'generating';
  const isCompleted = state.status === 'completed';
  const isError = state.status === 'error';
  const duration = getGenerationDuration(state.startTime, state.endTime);

  // Auto-scroll to bottom when steps update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.steps, isCompleted, isError]);

  const handleSubmit = () => {
    if (!chatInput.trim()) return;
    
    if (mode === 'generate') {
      setLocalPrompt(chatInput);
      startGeneration(chatInput, localSkipImages);
      setChatInput('');
    } else if (mode === 'edit-block' && selectedBlock) {
      handleEditBlock(chatInput);
      setChatInput('');
    }
  };

  const handleEditBlock = async (prompt: string) => {
    if (!selectedBlock || !prompt.trim()) return;
    
    setIsEditingBlock(true);
    try {
      const response = await supabase.functions.invoke('subblock-ai', {
        body: {
          message: prompt,
          currentSubBlock: {
            type: selectedBlock.type,
            content: selectedBlock.content,
          },
          allSubBlocks: selectedBlock.subBlocks || [],
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
    } catch (error) {
      console.error('Block edit error:', error);
    } finally {
      setIsEditingBlock(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleMode = (newMode: SidebarMode) => {
    setMode(prev => prev === newMode ? 'idle' : newMode);
  };

  // Step icon helpers
  const getStepIcon = (step: GenerationStep) => {
    if (step.status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (step.status === 'active') return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    if (step.status === 'error') return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const getStepIconByType = (id: string) => {
    switch (id) {
      case 'research': return <Search className="w-3.5 h-3.5" />;
      case 'structure': return <Layers className="w-3.5 h-3.5" />;
      case 'content': return <Brain className="w-3.5 h-3.5" />;
      case 'images': return <Image className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getPlaceholder = () => {
    if (mode === 'generate') return 'Опишите тему курса...';
    if (mode === 'edit-block') {
      if (!selectedBlock) return 'Сначала выберите блок справа...';
      return 'Опишите что изменить...';
    }
    return 'Design anything...';
  };

  const isInputDisabled = mode === 'edit-block' && !selectedBlock;

  return (
    <div 
      className={cn(
        "h-full flex flex-col bg-secondary/50 dark:bg-white/[0.02] backdrop-blur-sm transition-all duration-300 ease-out overflow-hidden",
        isOpen ? "w-[380px]" : "w-0"
      )}
    >
      {/* Header - Logo mark */}
      <div className="flex items-center px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(265,60%,75%)] to-[hsl(265,60%,65%)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 1.5 15.22 15.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.0069 1.94165H4.21278L0 16.8103H2.95308L3.94432 13.2583L4.74971 10.4911L6.29852 4.70887H8.92119L10.4494 10.4911L11.2754 13.2583L12.2666 16.8103H15.2197L11.0069 1.94165Z" fill="white"/>
            <path d="M9.06607 9.31335H6.1543V12.2251H9.06607V9.31335Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Chat / Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Idle state - nothing selected */}
          {mode === 'idle' && !isGenerating && !isCompleted && !isError && (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground text-center px-8">
                Выберите действие внизу, чтобы начать
              </p>
            </div>
          )}

          {/* Edit block mode - waiting for selection */}
          {mode === 'edit-block' && !selectedBlock && !isGenerating && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center px-4">
                Выберите блок на таймлайне справа для редактирования
              </p>
            </div>
          )}

          {/* Edit block mode - block selected */}
          {mode === 'edit-block' && selectedBlock && !isGenerating && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
                <p className="text-xs text-muted-foreground mb-0.5">Выбранный блок:</p>
                <p className="font-medium text-foreground text-sm">
                  {BLOCK_CONFIGS[selectedBlock.type]?.labelRu || selectedBlock.type}
                </p>
              </div>
              {isEditingBlock && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Редактирую блок...
                </div>
              )}
            </div>
          )}

          {/* Generate mode - pre-generation settings */}
          {mode === 'generate' && !isGenerating && !isCompleted && !isError && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  id="skipImages"
                  checked={localSkipImages}
                  onCheckedChange={(checked) => setLocalSkipImages(checked === true)}
                />
                <Label htmlFor="skipImages" className="text-sm text-muted-foreground cursor-pointer">
                  Быстрый режим (без иллюстраций)
                </Label>
              </div>
            </div>
          )}

          {/* Generating - steps as chat messages */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Генерирую курс:</p>
                <p className="text-sm text-foreground line-clamp-2">{state.prompt}</p>
              </div>

              {state.steps.map((step) => (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl transition-colors text-sm",
                    step.status === 'active' && "bg-primary/5",
                    step.status === 'completed' && "bg-emerald-500/5",
                    step.status === 'error' && "bg-destructive/5",
                    step.status === 'pending' && "opacity-40"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{getStepIconByType(step.id)}</span>
                      <span className={cn(
                        "font-medium",
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

              <button
                onClick={cancelGeneration}
                className="w-full text-sm text-destructive hover:text-destructive/80 py-2 transition-colors"
              >
                Отменить генерацию
              </button>
            </div>
          )}

          {/* Completed */}
          {isCompleted && state.generatedLessons && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <PartyPopper className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Курс создан!
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
                    setChatInput(state.prompt);
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
                    setMode('idle');
                  }}
                  className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" />
                  Применить
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Ошибка</span>
                </div>
                <p className="text-sm text-destructive/80">{state.error}</p>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setChatInput(state.prompt);
                  resetGeneration();
                }}
                className="w-full"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Bottom input area */}
      {!isGenerating && !isCompleted && (
        <div className="p-3">
          <div className="bg-black/[0.06] dark:bg-[#232326] rounded-2xl border border-border/20 dark:border-white/[0.08]">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={isInputDisabled}
              className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-2.5 pb-2.5">
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
                  title="Ещё"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMode('generate')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    mode === 'generate'
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  Создать курс
                </button>
                <button
                  onClick={() => toggleMode('edit-block')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    mode === 'edit-block'
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  Ред. блок
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!chatInput.trim() || isInputDisabled}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 rounded-lg hover:bg-foreground/5"
                title="Отправить"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

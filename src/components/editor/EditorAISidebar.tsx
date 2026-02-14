import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Wand2, Loader2, Check, 
  AlertCircle, Search, Brain, Layers, BookOpen, CheckCircle2, 
  Image, Clock, RotateCcw, PartyPopper, Send, CornerDownLeft, Square,
  Plus, MousePointerClick, Palette, GraduationCap, Pencil, BookPlus,
  ImageOff, ImageIcon,
  icons as lucideIcons
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { Lesson, CourseDesignSystem } from '@/types/course';
import { useAIGeneration, GenerationStep, getGenerationDuration } from '@/hooks/useAIGeneration';
import { useGenerateCourse } from '@/hooks/useGenerateCourse';
import { supabase } from '@/integrations/supabase/client';
import { useBaseDesignSystems } from '@/hooks/useBaseDesignSystems';

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
  const [selectedDesignSystemId, setSelectedDesignSystemId] = useState<string | null>(null);
  const [lessonCount, setLessonCount] = useState(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium'); // kept for API compat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { systems: designSystems, isLoading: isLoadingDS } = useBaseDesignSystems();

  const {
    state,
    cancelGeneration,
    resetGeneration,
    setDesignSystem,
  } = useAIGeneration();
  
  const { runGeneration } = useGenerateCourse(courseId);

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
      runGeneration(chatInput, localSkipImages);
      setChatInput('');
    } else if (mode === 'edit-block' && selectedBlock) {
      handleEditBlock(chatInput);
      setChatInput('');
    }
  };

  const isQuizBlock = (type: string) => 
    ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider'].includes(type);

  const handleEditBlock = async (prompt: string) => {
    if (!selectedBlock || !prompt.trim()) return;
    
    setIsEditingBlock(true);
    try {
      const isQuiz = isQuizBlock(selectedBlock.type);
      
      // Build request body based on block type
      const body: Record<string, unknown> = { message: prompt };
      
      if (isQuiz) {
        // Send full quiz block data
        body.blockData = {
          type: selectedBlock.type,
          content: selectedBlock.content,
          options: selectedBlock.options,
          correctAnswer: selectedBlock.correctAnswer,
          explanation: selectedBlock.explanation,
          explanationCorrect: selectedBlock.explanationCorrect,
          explanationPartial: selectedBlock.explanationPartial,
          hints: selectedBlock.hints,
          blankWord: selectedBlock.blankWord,
          matchingPairs: selectedBlock.matchingPairs,
          orderingItems: selectedBlock.orderingItems,
          correctOrder: selectedBlock.correctOrder,
          sliderMin: selectedBlock.sliderMin,
          sliderMax: selectedBlock.sliderMax,
          sliderCorrect: selectedBlock.sliderCorrect,
          sliderStep: selectedBlock.sliderStep,
        };
      } else {
        // Design block - send sub-blocks
        body.currentSubBlock = {
          type: selectedBlock.type,
          content: selectedBlock.content,
        };
        body.allSubBlocks = selectedBlock.subBlocks || [];
      }

      const response = await supabase.functions.invoke('subblock-ai', { body });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (isQuiz && result.blockUpdates) {
        // Apply quiz field updates
        onUpdateBlock(result.blockUpdates);
      } else if (result.newBlocks && Array.isArray(result.newBlocks)) {
        // Apply design sub-blocks
        onUpdateBlock({ subBlocks: result.newBlocks });
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
        <div className="p-4 space-y-3 h-full">
          {/* Idle state - nothing selected */}
          {mode === 'idle' && !isGenerating && !isCompleted && !isError && (
            <div className="flex items-center justify-center min-h-[60vh]">
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
              <div className="p-3 rounded-xl bg-muted/50 border border-border/10">
                <p className="text-xs text-muted-foreground mb-1">Выбранный блок:</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const iconName = BLOCK_CONFIGS[selectedBlock.type]?.icon;
                    const IconComp = iconName ? lucideIcons[iconName as keyof typeof lucideIcons] : null;
                    return IconComp ? <IconComp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : null;
                  })()}
                  <p className="font-medium text-foreground text-sm">
                    {BLOCK_CONFIGS[selectedBlock.type]?.labelRu || selectedBlock.type}
                  </p>
                </div>
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
            <div className="space-y-4 px-1">
              {/* Design System selector */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Palette className="w-3.5 h-3.5" />
                  Дизайн-система
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {designSystems.map((ds) => {
                    const dsConfig = ds.config;
                    const isSelected = selectedDesignSystemId === ds.id;
                    const primaryHsl = dsConfig.primaryColor;
                    const successHsl = dsConfig.successColor || '142 71% 45%';
                    const destructiveHsl = dsConfig.destructiveColor || '0 84% 60%';
                    const bgHsl = dsConfig.backgroundColor || '0 0% 100%';
                    const fgHsl = dsConfig.foregroundColor || '0 0% 10%';
                    const mutedHsl = dsConfig.mutedColor || '240 5% 96%';
                    const btnRadius = dsConfig.buttonStyle === 'pill' ? '9999px' : dsConfig.buttonStyle === 'square' ? '0' : '4px';

                    return (
                      <button
                        key={ds.id}
                        onClick={() => setSelectedDesignSystemId(
                          selectedDesignSystemId === ds.id ? null : ds.id
                        )}
                        className={cn(
                          "group relative rounded-xl overflow-hidden transition-all duration-200 text-left",
                          isSelected 
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" 
                            : "ring-1 ring-border/60 hover:ring-border hover:shadow-sm"
                        )}
                        style={{ backgroundColor: `hsl(${bgHsl})` }}
                      >
                        {/* Mini app screen */}
                        <div className="px-2.5 pt-2.5 pb-2 space-y-2">
                          {/* Title bar - theme name in its font */}
                          <p 
                            className="text-[11px] font-bold truncate leading-none"
                            style={{ 
                              fontFamily: dsConfig.headingFontFamily || dsConfig.fontFamily || 'inherit',
                              color: `hsl(${fgHsl})`,
                            }}
                          >
                            {ds.name}
                          </p>
                          
                          {/* Body text placeholder */}
                          <p 
                            className="text-[7px] leading-tight opacity-50"
                            style={{ 
                              fontFamily: dsConfig.fontFamily || 'inherit',
                              color: `hsl(${fgHsl})`,
                            }}
                          >
                            Пример текста курса
                          </p>

                          {/* Button + color dots row */}
                          <div className="flex items-center justify-between">
                            {/* Mini button */}
                            <div 
                              className="h-4 px-2.5 flex items-center justify-center"
                              style={{ 
                                backgroundColor: `hsl(${primaryHsl})`,
                                borderRadius: btnRadius,
                                boxShadow: dsConfig.buttonDepth === 'raised' 
                                  ? `0 2px 0 0 hsl(${primaryHsl} / 0.35)` 
                                  : 'none',
                              }}
                            >
                              <span className="text-[7px] font-semibold" style={{ color: `hsl(${dsConfig.primaryForeground || '0 0% 100%'})` }}>Далее</span>
                            </div>
                            
                            {/* Color dots */}
                            <div className="flex items-center gap-0.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${primaryHsl})` }} />
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${successHsl})` }} />
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${destructiveHsl})` }} />
                            </div>
                          </div>
                        </div>

                        {/* Selected overlay check */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Illustrations toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Иллюстрации
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setLocalSkipImages(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                      !localSkipImages
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    С картинками
                  </button>
                  <button
                    onClick={() => setLocalSkipImages(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                      localSkipImages
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <ImageOff className="w-3.5 h-3.5" />
                    Быстро
                  </button>
                </div>
              </div>

              {/* Lesson count */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  Кол-во уроков
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 5, 7].map((count) => (
                    <button
                      key={count}
                      onClick={() => setLessonCount(count)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                        lessonCount === count
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generating - chat-style AI messages */}
          {isGenerating && (
            <div className="space-y-3">
              {/* User message bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-sm">
                  {state.prompt}
                </div>
              </div>

              {/* AI response bubble with steps */}
              <div className="flex justify-start">
                <div className="max-w-[90%] px-3.5 py-3 rounded-2xl rounded-tl-md bg-muted/50 text-foreground text-sm space-y-2">
                  {state.steps.map((step) => (
                    <div 
                      key={step.id}
                      className={cn(
                        "flex items-center gap-2 transition-opacity",
                        step.status === 'pending' && "opacity-30"
                      )}
                    >
                      <div className="flex-shrink-0">{getStepIcon(step)}</div>
                      <span className={cn(
                        "text-sm",
                        step.status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                        step.status === 'active' && "text-foreground font-medium",
                        step.status === 'error' && "text-destructive"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  <div className="flex items-center gap-1 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
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

      {/* Bottom input area - always visible */}
      {!isCompleted && (
        <div className="p-3">
          <div className="bg-black/[0.06] dark:bg-[#232326] rounded-2xl border border-border/20 dark:border-white/[0.08]">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={isGenerating ? undefined : handleKeyDown}
              placeholder={isGenerating ? 'Генерация...' : getPlaceholder()}
              disabled={isInputDisabled || isGenerating}
              className="w-full bg-transparent px-4 pt-3 pb-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
                  title="Ещё"
                  disabled={isGenerating}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMode('generate')}
                  disabled={isGenerating}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    mode === 'generate'
                      ? "bg-[hsl(45,90%,88%)] text-[hsl(45,80%,30%)] dark:bg-[hsl(45,70%,25%)] dark:text-[hsl(45,90%,75%)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                    isGenerating && "opacity-50 pointer-events-none"
                  )}
                >
                  <BookPlus className="w-3 h-3" />
                  Создать курс
                </button>
                <button
                  onClick={() => toggleMode('edit-block')}
                  disabled={isGenerating}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    mode === 'edit-block'
                      ? "bg-[hsl(270,60%,90%)] text-[hsl(270,50%,35%)] dark:bg-[hsl(270,40%,25%)] dark:text-[hsl(270,60%,75%)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                    isGenerating && "opacity-50 pointer-events-none"
                  )}
                >
                  <Pencil className="w-3 h-3" />
                  Ред. блок
                </button>
              </div>
              {isGenerating ? (
                <button
                  onClick={cancelGeneration}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Остановить"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!chatInput.trim() || isInputDisabled}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 rounded-lg hover:bg-foreground/5"
                  title="Отправить"
                >
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

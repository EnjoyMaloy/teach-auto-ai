import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, MessageSquare, Wand2, Loader2, Check, 
  AlertCircle, Search, Brain, Layers, BookOpen, CheckCircle2, 
  Image, Clock, RotateCcw, PartyPopper, Send, CornerDownLeft, Square,
  Plus, MousePointerClick, Palette, GraduationCap, Pencil, BookPlus,
  ImageOff, ImageIcon, Star, Zap,
  icons as lucideIcons
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { Lesson, CourseDesignSystem } from '@/types/course';
import { DesignSystemConfig } from '@/types/designSystem';
import { useAIGeneration, GenerationStep, getGenerationDuration } from '@/hooks/useAIGeneration';
import { useGenerateCourse } from '@/hooks/useGenerateCourse';
import { supabase } from '@/integrations/supabase/client';
import { useBaseDesignSystems } from '@/hooks/useBaseDesignSystems';
import aiMascot from '@/assets/ai-mascot.svg';
import aiMascotDark from '@/assets/ai-mascot-dark.svg';

// ── Unified message type ──────────────────────────────────

interface UnifiedMessage {
  id: string;
  type: 'user' | 'assistant' | 'generation' | 'completion' | 'error';
  content: string;
  timestamp: number;
  steps?: GenerationStep[];
  isGenerating?: boolean;
  lessonCount?: number;
  duration?: number;
}

// ── Props ─────────────────────────────────────────────────

interface EditorAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  designSystem?: CourseDesignSystem;
  selectedBlock: Block | null;
  selectedLessonOrder?: number;
  selectedBlockOrder?: number;
  allBlocks?: Block[];
  onAIGenerate: (lessons: Lesson[], designConfig?: DesignSystemConfig, designSystemId?: string) => void;
  onUpdateBlock: (updates: Partial<Block>) => void;
  initialMode?: 'generate';
  onBeforeGenerate?: () => Promise<boolean>;
}

type SidebarMode = 'idle' | 'generate' | 'edit-block';

export const EditorAISidebar: React.FC<EditorAISidebarProps> = ({
  isOpen,
  onClose,
  courseId,
  designSystem,
  selectedBlock,
  selectedLessonOrder,
  selectedBlockOrder,
  allBlocks,
  onAIGenerate,
  onUpdateBlock,
  initialMode,
  onBeforeGenerate,
}) => {
  const [mode, setMode] = useState<SidebarMode>(initialMode === 'generate' ? 'generate' : 'idle');
  const [chatInput, setChatInput] = useState('');
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [localSkipImages, setLocalSkipImages] = useState(false);
  const [imageModel, setImageModel] = useState<'gemini-3-pro' | 'gemini-2.5-flash'>('gemini-3-pro');
  const [selectedDesignSystemId, setSelectedDesignSystemId] = useState<string | null>(null);
  const [lessonCount, setLessonCount] = useState(3);

  // ── Unified messages state ──────────────────────────────
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAppliedRef = useRef(false);
  const completionAddedRef = useRef(false);
  const generationMsgIdRef = useRef<string | null>(null);
  
  const { systems: designSystems, isLoading: isLoadingDS } = useBaseDesignSystems();

  const {
    state,
    cancelGeneration,
    resetGeneration,
    setDesignSystem,
  } = useAIGeneration();
  
  const { runGeneration } = useGenerateCourse(courseId);

  useEffect(() => {
    setDesignSystem(designSystem);
  }, [designSystem, setDesignSystem]);

  useEffect(() => {
    if (initialMode === 'generate' && isOpen) {
      setMode('generate');
    }
  }, [initialMode, isOpen]);

  const isGenerating = state.status === 'generating';
  const isCompleted = state.status === 'completed';
  const isError = state.status === 'error';
  const duration = getGenerationDuration(state.startTime, state.endTime);

  // ── Sync generation progress into unified messages ──────
  useEffect(() => {
    if (!generationMsgIdRef.current) return;
    if (state.status === 'generating' && state.steps.length > 0) {
      const msgId = generationMsgIdRef.current;
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, steps: [...state.steps], isGenerating: true } : m
      ));
    }
  }, [state.steps, state.status]);

  // ── Add completion message when generation finishes ─────
  useEffect(() => {
    if (isCompleted && state.generatedLessons && !completionAddedRef.current) {
      completionAddedRef.current = true;
      // Mark generation message as done
      if (generationMsgIdRef.current) {
        const msgId = generationMsgIdRef.current;
        setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, isGenerating: false, steps: [...state.steps] } : m
        ));
      }
      // Add completion message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'completion',
        content: 'Курс создан!',
        timestamp: Date.now(),
        lessonCount: state.generatedLessons!.length,
        duration,
      }]);
    }
    if (!isCompleted) {
      completionAddedRef.current = false;
    }
  }, [isCompleted, state.generatedLessons, state.steps, duration]);

  // ── Add error message ───────────────────────────────────
  useEffect(() => {
    if (isError && state.error) {
      if (generationMsgIdRef.current) {
        const msgId = generationMsgIdRef.current;
        setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, isGenerating: false } : m
        ));
      }
      setMessages(prev => {
        // Avoid duplicate error messages
        const last = prev[prev.length - 1];
        if (last?.type === 'error') return prev;
        return [...prev, {
          id: crypto.randomUUID(),
          type: 'error',
          content: state.error || 'Неизвестная ошибка',
          timestamp: Date.now(),
        }];
      });
    }
  }, [isError, state.error]);

  // ── Auto-apply generated lessons (once) ─────────────────
  useEffect(() => {
    if (isCompleted && state.generatedLessons && !hasAppliedRef.current) {
      hasAppliedRef.current = true;
      const selectedDS = designSystems.find(ds => ds.id === selectedDesignSystemId);
      onAIGenerate(state.generatedLessons, selectedDS?.config, selectedDS?.id);
    }
    if (!isCompleted) {
      hasAppliedRef.current = false;
    }
  }, [isCompleted, state.generatedLessons, onAIGenerate, designSystems, selectedDesignSystemId]);

  // ── Auto-scroll ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Submit handler ──────────────────────────────────────
  const handleSubmit = async () => {
    if (!chatInput.trim()) return;
    
    // Add user message to unified list
    const userMsg: UnifiedMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    if (mode === 'generate') {
      if (isCompleted) resetGeneration();
      if (onBeforeGenerate) {
        const ok = await onBeforeGenerate();
        if (!ok) return;
      }
      // Add generation message placeholder
      const genMsgId = crypto.randomUUID();
      generationMsgIdRef.current = genMsgId;
      setMessages(prev => [...prev, {
        id: genMsgId,
        type: 'generation',
        content: '',
        timestamp: Date.now(),
        steps: [],
        isGenerating: true,
      }]);
      const selectedDS = designSystems.find(ds => ds.id === selectedDesignSystemId);
      runGeneration(chatInput, localSkipImages, lessonCount, selectedDS?.config, selectedDS?.id, imageModel);
      setChatInput('');
      // Switch to idle so chat history is shown instead of settings
      setMode('idle');
    } else if (mode === 'edit-block' && selectedBlock) {
      setChatInput('');
      await handleEditBlock(chatInput);
    } else {
      // idle or edit-block without selection -> free chat
      setChatInput('');
      await handleFreeChat(chatInput);
    }
  };

  const isQuizBlock = (type: string) => 
    ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider'].includes(type);

  const handleEditBlock = async (prompt: string) => {
    if (!selectedBlock || !prompt.trim()) return;
    
    setIsEditingBlock(true);
    // Add loading indicator as assistant message
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: loadingId, type: 'assistant', content: '...', timestamp: Date.now() }]);

    try {
      const isQuiz = isQuizBlock(selectedBlock.type);
      const body: Record<string, unknown> = { message: prompt };
      
      if (isQuiz) {
        body.blockData = {
          type: selectedBlock.type, content: selectedBlock.content, options: selectedBlock.options,
          correctAnswer: selectedBlock.correctAnswer, explanation: selectedBlock.explanation,
          explanationCorrect: selectedBlock.explanationCorrect, explanationPartial: selectedBlock.explanationPartial,
          hints: selectedBlock.hints, blankWord: selectedBlock.blankWord, matchingPairs: selectedBlock.matchingPairs,
          orderingItems: selectedBlock.orderingItems, correctOrder: selectedBlock.correctOrder,
          sliderMin: selectedBlock.sliderMin, sliderMax: selectedBlock.sliderMax,
          sliderCorrect: selectedBlock.sliderCorrect, sliderStep: selectedBlock.sliderStep,
        };
      } else {
        body.currentSubBlock = { type: selectedBlock.type, content: selectedBlock.content };
        body.allSubBlocks = selectedBlock.subBlocks || [];
      }

      // Include conversation history
      body.conversationHistory = messages.filter(m => m.type === 'user' || m.type === 'assistant').slice(-10).map(m => ({
        role: m.type as 'user' | 'assistant', content: m.content,
      }));

      const response = await supabase.functions.invoke('subblock-ai', { body });
      if (response.error) throw response.error;

      const result = response.data;
      const aiMessage = result.message || 'Готово!';
      
      // Replace loading message with actual response
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: aiMessage } : m));
      
      if (isQuiz && result.blockUpdates) {
        onUpdateBlock(result.blockUpdates);
      } else if (result.newBlocks && Array.isArray(result.newBlocks)) {
        onUpdateBlock({ subBlocks: result.newBlocks });
      }
    } catch (error) {
      console.error('Block edit error:', error);
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: 'Ошибка. Попробуйте снова.' } : m));
    } finally {
      setIsEditingBlock(false);
    }
  };

  const handleFreeChat = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsEditingBlock(true);
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: loadingId, type: 'assistant', content: '...', timestamp: Date.now() }]);
    
    try {
      const body: Record<string, unknown> = { 
        message: prompt,
        conversationHistory: messages.filter(m => m.type === 'user' || m.type === 'assistant').slice(-10).map(m => ({
          role: m.type as 'user' | 'assistant', content: m.content,
        })),
      };
      
      if (selectedBlock) {
        const isQuiz = isQuizBlock(selectedBlock.type);
        if (isQuiz) {
          body.blockData = {
            type: selectedBlock.type, content: selectedBlock.content, options: selectedBlock.options,
            correctAnswer: selectedBlock.correctAnswer, explanation: selectedBlock.explanation,
            explanationCorrect: selectedBlock.explanationCorrect, explanationPartial: selectedBlock.explanationPartial,
            hints: selectedBlock.hints, blankWord: selectedBlock.blankWord, matchingPairs: selectedBlock.matchingPairs,
            orderingItems: selectedBlock.orderingItems, correctOrder: selectedBlock.correctOrder,
            sliderMin: selectedBlock.sliderMin, sliderMax: selectedBlock.sliderMax,
            sliderCorrect: selectedBlock.sliderCorrect, sliderStep: selectedBlock.sliderStep,
          };
        } else {
          body.currentSubBlock = { type: selectedBlock.type, content: selectedBlock.content };
          body.allSubBlocks = selectedBlock.subBlocks || [];
        }
      } else if (allBlocks && allBlocks.length > 0) {
        const firstDesignBlock = allBlocks.find(b => b.type === 'design');
        if (firstDesignBlock) {
          body.allSubBlocks = firstDesignBlock.subBlocks || [];
        }
      }

      const response = await supabase.functions.invoke('subblock-ai', { body });
      if (response.error) throw response.error;

      const result = response.data;
      const aiMessage = result.message || 'Готово!';
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: aiMessage } : m));
      
      if (selectedBlock) {
        const isQuiz = isQuizBlock(selectedBlock.type);
        if (isQuiz && result.blockUpdates) {
          onUpdateBlock(result.blockUpdates);
        } else if (result.newBlocks && Array.isArray(result.newBlocks)) {
          onUpdateBlock({ subBlocks: result.newBlocks });
        }
      } else if (result.newBlocks && Array.isArray(result.newBlocks)) {
        onUpdateBlock({ subBlocks: result.newBlocks });
      }
    } catch (error) {
      console.error('Free chat error:', error);
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: 'Ошибка. Попробуйте снова.' } : m));
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
    if (isCompleted) resetGeneration();
    setMode(prev => prev === newMode ? 'idle' : newMode);
  };

  // ── Step rendering helpers ──────────────────────────────

  const getStepIcon = (step: GenerationStep) => {
    if (step.status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (step.status === 'active') return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    if (step.status === 'error') return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const getPlaceholder = () => {
    if (mode === 'generate') return 'Опишите тему курса...';
    if (mode === 'edit-block') {
      if (!selectedBlock) return 'Сначала выберите блок справа...';
      return 'Опишите что изменить...';
    }
    return selectedBlock 
      ? 'Опишите что хотите изменить...' 
      : 'Напишите что хотите поправить...';
  };

  const isInputDisabled = mode === 'edit-block' && !selectedBlock;

  // Show generation settings when mode is generate AND no active/completed generation
  const showGenerationSettings = mode === 'generate' && !isGenerating && !isCompleted && !isError;

  // ── Render a single unified message ─────────────────────
  const renderMessage = (msg: UnifiedMessage) => {
    switch (msg.type) {
      case 'user':
        return (
          <div key={msg.id} className="flex justify-end">
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-sm">
              {msg.content}
            </div>
          </div>
        );

      case 'assistant':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-muted/50 text-foreground text-sm">
              {msg.content === '...' ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Думаю...
                </div>
              ) : msg.content}
            </div>
          </div>
        );

      case 'generation':
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-[90%] px-3.5 py-3 rounded-2xl rounded-tl-md bg-muted/50 text-foreground text-sm space-y-3">
              {msg.isGenerating && (
                <div className="flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">Создаю курс</span>
                </div>
              )}
              {!msg.isGenerating && (!msg.steps || msg.steps.length === 0) && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Запускаю генерацию...</span>
                </div>
              )}
              {msg.steps && msg.steps.length > 0 && (
                <div className="space-y-1.5">
                  {msg.steps.map((step) => {
                    const progressMatch = step.message?.match(/(\d+)\s*(?:из|\/)\s*(\d+)/);
                    const progressPercent = progressMatch 
                      ? (parseInt(progressMatch[1]) / parseInt(progressMatch[2])) * 100 
                      : 0;

                    return (
                      <div key={step.id} className="space-y-1">
                        <div className={cn(
                          "flex items-center gap-2 py-1 px-2 rounded-lg transition-all",
                          step.status === 'pending' && "opacity-30",
                          step.status === 'completed' && "bg-emerald-500/10",
                        )}>
                          <div className="flex-shrink-0">{getStepIcon(step)}</div>
                          <span className={cn(
                            "text-sm",
                            step.status === 'completed' && "text-emerald-600 dark:text-emerald-400 font-medium",
                            step.status === 'active' && "text-foreground font-medium",
                            step.status === 'error' && "text-destructive"
                          )}>
                            {step.label}
                          </span>
                        </div>
                        {step.status === 'active' && step.id === 'images' && step.message && (
                          <div className="pl-8 pr-2 space-y-1.5">
                            <p className="text-xs text-muted-foreground">{step.message}</p>
                            <div className="progress-striped h-2 rounded-full overflow-hidden bg-[hsl(220,70%,95%)] dark:bg-[hsl(220,40%,20%)]">
                              <div 
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'completion':
        return (
          <div key={msg.id} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Курс создан!
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-emerald-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {msg.lessonCount} уроков
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {msg.duration} сек
              </span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={msg.id} className="space-y-3">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Ошибка</span>
              </div>
              <p className="text-sm text-destructive/80">{msg.content}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Find the last user message before this error and put it back
                const lastUser = [...messages].reverse().find(m => m.type === 'user');
                if (lastUser) setChatInput(lastUser.content);
                resetGeneration();
              }}
              className="w-full"
            >
              Попробовать снова
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "h-full flex flex-col bg-secondary/50 dark:bg-black/10 backdrop-blur-sm transition-all duration-300 ease-out overflow-hidden",
        isOpen ? "w-[380px]" : "w-0"
      )}
    >
      {/* Spacer for header alignment */}
      <div className="h-3" />

      {/* Generation settings panel - above chat when in generate mode */}
      {showGenerationSettings && (
        <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 pb-2">
          <div className="space-y-6 px-1">
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
                  const bgHsl = dsConfig.backgroundColor || '0 0% 100%';
                  const fgHsl = dsConfig.foregroundColor || '0 0% 10%';
                  const btnRadius = dsConfig.buttonStyle === 'pill' ? '9999px' : dsConfig.buttonStyle === 'square' ? '0' : '4px';
                  
                  const db = dsConfig.designBlock;
                  const dot1Hsl = db?.buttonBgColor || primaryHsl;
                  const fifthBg = dsConfig.themeBackgrounds?.[4];
                  const dot2Hsl = fifthBg
                    ? (fifthBg.type === 'solid' ? fifthBg.color || bgHsl : fifthBg.from || bgHsl)
                    : bgHsl;
                  const dot3Hsl = db?.backdropDarkColor || '0 0% 0% / 0.9';

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
                      <div className="px-2.5 pt-2.5 pb-2 space-y-2">
                        <p 
                          className="text-[11px] font-bold truncate leading-none"
                          style={{ 
                            fontFamily: dsConfig.headingFontFamily || dsConfig.fontFamily || 'inherit',
                            color: `hsl(${fgHsl})`,
                          }}
                        >
                          {ds.name}
                        </p>
                        <p 
                          className="text-[8px] leading-tight opacity-50"
                          style={{ 
                            fontFamily: dsConfig.fontFamily || 'inherit',
                            color: `hsl(${fgHsl})`,
                          }}
                        >
                          Пример текста курса в этой теме
                        </p>
                        <div className="flex items-center justify-between">
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
                            <span className="text-[7px] font-semibold uppercase" style={{ color: `hsl(${dsConfig.primaryForeground || '0 0% 100%'})` }}>Далее</span>
                          </div>
                          <div className="flex items-center -space-x-1.5">
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[3]" style={{ backgroundColor: `hsl(${dot1Hsl})` }} />
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[2]" style={{ backgroundColor: `hsl(${dot2Hsl})` }} />
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[1]" style={{ backgroundColor: `hsl(${dot3Hsl})` }} />
                          </div>
                        </div>
                      </div>
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
                  onClick={() => { setLocalSkipImages(false); setImageModel('gemini-3-pro'); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    !localSkipImages && imageModel === 'gemini-3-pro'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Star className="w-3.5 h-3.5" />
                  Детальные
                </button>
                <button
                  onClick={() => { setLocalSkipImages(false); setImageModel('gemini-2.5-flash'); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    !localSkipImages && imageModel === 'gemini-2.5-flash'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Быстрые
                </button>
                <button
                  onClick={() => setLocalSkipImages(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    localSkipImages
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <ImageOff className="w-3.5 h-3.5" />
                  Без картинок
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
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setLessonCount(count)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                      lessonCount === count
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </ScrollArea>
      )}

      {/* Empty state - mascot (only when no messages at all) */}
      {messages.length === 0 && !showGenerationSettings && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <img src={aiMascot} alt="" className="w-32 h-32 object-contain mb-3 dark:hidden" />
          <img src={aiMascotDark} alt="" className="w-32 h-32 object-contain mb-3 hidden dark:block" />
          <p className="text-sm text-muted-foreground text-center px-8">
            Напишите что хотите изменить или выберите действие внизу
          </p>
        </div>
      )}

      {/* Edit block mode - waiting for selection hint */}
      {mode === 'edit-block' && !selectedBlock && messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center px-4">
            Выберите блок на таймлайне справа для редактирования
          </p>
        </div>
      )}

      {/* Chat messages area */}
      {messages.length > 0 && !showGenerationSettings && (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 flex flex-col space-y-3">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* Selected block chip - above input in edit mode */}
      {mode === 'edit-block' && selectedBlock && (
        <div className="px-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(270,60%,90%)]/60 dark:bg-[hsl(270,40%,25%)]/60 border border-[hsl(270,40%,80%)]/30 dark:border-[hsl(270,40%,40%)]/30">
            {(() => {
              const iconName = BLOCK_CONFIGS[selectedBlock.type]?.icon;
              const IconComp = iconName ? lucideIcons[iconName as keyof typeof lucideIcons] : null;
              return IconComp ? <IconComp className="w-3.5 h-3.5 text-[hsl(270,50%,50%)] dark:text-[hsl(270,60%,75%)] flex-shrink-0" /> : null;
            })()}
            <span className="text-xs font-medium text-[hsl(270,50%,35%)] dark:text-[hsl(270,60%,75%)] truncate">
              {selectedLessonOrder && selectedBlockOrder
                ? `Урок ${selectedLessonOrder} · Блок ${selectedBlockOrder} · `
                : ''
              }{BLOCK_CONFIGS[selectedBlock.type]?.labelRu || selectedBlock.type}
            </span>
          </div>
        </div>
      )}

      {/* Bottom input area - always visible */}
      <div className="p-3 pt-1.5">
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
                className="w-7 h-7 flex items-center justify-center rounded-full bg-foreground border border-border dark:bg-transparent dark:text-muted-foreground hover:opacity-80 transition-colors"
                title="Остановить"
              >
                <Square className="w-3 h-3 fill-current text-background dark:text-foreground" />
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
    </div>
  );
};

export default EditorAISidebar;

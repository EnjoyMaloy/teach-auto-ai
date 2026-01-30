import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Lesson, Slide, SlideType, CourseDesignSystem } from '@/types/course';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle,
  Search,
  Brain,
  Layers,
  BookOpen,
  CheckCircle2,
  Image,
  X,
  Minimize2,
  Clock,
  RotateCcw,
  PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIGeneration, GenerationStep, getGenerationDuration } from '@/hooks/useAIGeneration';

interface AIGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (lessons: Lesson[]) => void;
  courseId: string;
  designSystem?: CourseDesignSystem;
}

interface GeneratedSubBlock {
  type: string;
  order: number;
  content?: string;
  textAlign?: string;
  textSize?: string;
  fontWeight?: string;
  badgeText?: string;
  badgeVariant?: string;
  badgeSize?: string;
  badges?: { id: string; text: string; iconType: string; iconValue?: string }[];
  badgeLayout?: string;
  iconName?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  buttonVariant?: string;
  imageDescription?: string;
  imageUrl?: string;
  imageSize?: string;
  imageRotation?: number;
  textRotation?: number;
  backdrop?: string;
  backdropRounded?: boolean;
  highlight?: string;
  padding?: string;
  dividerStyle?: string;
  tableData?: { id: string; content: string }[][];
  tableStyle?: string;
  tableTextSize?: string;
  animationKeyword?: string;
  animationUrl?: string;
  animationType?: string;
  animationSize?: string;
  animationAutoplay?: boolean;
  animationLoop?: boolean;
}

interface GeneratedSlide {
  type: SlideType;
  content?: string;
  imageUrl?: string;
  imageDescription?: string;
  options?: string[];
  correctAnswer?: string | string[] | boolean | number;
  explanation?: string;
  explanationCorrect?: string;
  explanationPartial?: string;
  blankWord?: string;
  matchingPairs?: { id: string; left: string; right: string }[];
  orderingItems?: string[];
  correctOrder?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderCorrect?: number;
  sliderStep?: number;
  subBlocks?: GeneratedSubBlock[];
}

interface GeneratedLesson {
  title: string;
  description?: string;
  slides: GeneratedSlide[];
}

interface GeneratedCourse {
  title: string;
  description?: string;
  lessons: GeneratedLesson[];
}

// Helper to extract and fix JSON from AI response
const extractAndFixJson = (content: string): any => {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  
  // Remove any leading/trailing non-JSON characters
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }
  
  // Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try various fixes
    const fixes = [
      // Fix unescaped newlines in strings
      (s: string) => s.replace(/\n/g, '\\n'),
      // Fix trailing commas
      (s: string) => s.replace(/,(\s*[}\]])/g, '$1'),
      // Fix single quotes
      (s: string) => s.replace(/'/g, '"'),
      // Fix unquoted keys
      (s: string) => s.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'),
    ];
    
    for (const fix of fixes) {
      try {
        const fixed = fix(jsonStr);
        return JSON.parse(fixed);
      } catch {
        continue;
      }
    }
    
    throw new Error('Не удалось восстановить JSON после всех попыток');
  }
};

export const AIGeneratorDialog: React.FC<AIGeneratorDialogProps> = ({
  open,
  onOpenChange,
  onGenerated,
  courseId,
  designSystem,
}) => {
  const {
    state,
    startGeneration,
    cancelGeneration,
    resetGeneration,
    updateStep,
    setSteps,
    setStatus,
    setError,
    completeGeneration,
    abortController,
    setDesignSystem,
  } = useAIGeneration();

  const [localPrompt, setLocalPrompt] = React.useState('');
  const [localSkipImages, setLocalSkipImages] = React.useState(false);
  const isGeneratingRef = useRef(false);

  // Sync design system
  useEffect(() => {
    setDesignSystem(designSystem);
  }, [designSystem, setDesignSystem]);

  // Restore prompt when reopening after cancel
  useEffect(() => {
    if (open && state.status === 'cancelled') {
      setLocalPrompt(state.prompt);
    }
  }, [open, state.status, state.prompt]);

  // Extract color palette from design system for image generation
  const getColorPalette = (): { primary: string; accent: string; background: string } | null => {
    if (!designSystem) return null;
    
    const hslToColorName = (hsl: string): string => {
      if (!hsl) return '';
      const parts = hsl.split(' ').map(p => parseFloat(p));
      if (parts.length < 3) return hsl;
      
      const h = parts[0];
      const s = parts[1];
      const l = parts[2];
      
      let colorName = '';
      if (s < 10) {
        colorName = l > 50 ? 'light gray' : 'dark gray';
      } else if (h >= 0 && h < 30) colorName = 'red-orange';
      else if (h >= 30 && h < 60) colorName = 'orange-yellow';
      else if (h >= 60 && h < 90) colorName = 'yellow-green';
      else if (h >= 90 && h < 150) colorName = 'green';
      else if (h >= 150 && h < 210) colorName = 'cyan-teal';
      else if (h >= 210 && h < 270) colorName = 'blue-purple';
      else if (h >= 270 && h < 330) colorName = 'purple-magenta';
      else colorName = 'red-pink';
      
      if (l > 70) colorName = 'light ' + colorName;
      else if (l < 30) colorName = 'dark ' + colorName;
      
      return colorName;
    };
    
    return {
      primary: hslToColorName(designSystem.primaryColor || ''),
      accent: hslToColorName(designSystem.accentColor || designSystem.primaryColor || ''),
      background: hslToColorName(designSystem.backgroundColor || ''),
    };
  };

  const generateImageForSlide = async (slideContent: string, coursePrompt: string): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const colorPalette = getColorPalette();
      
      const response = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: coursePrompt,
          slideContext: slideContent,
          colorPalette: colorPalette,
        },
      });

      clearTimeout(timeoutId);

      if (response.error) {
        console.error('Image generation error:', response.error);
        return null;
      }

      return response.data?.imageUrl || null;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Image generation failed:', err);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!localPrompt.trim() || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    startGeneration(localPrompt, localSkipImages);
    
    const initialSteps: GenerationStep[] = [
      { id: 'research', label: 'Исследование темы', status: 'pending' },
      { id: 'structure', label: 'Планирование структуры', status: 'pending' },
      { id: 'content', label: 'Генерация контента', status: 'pending' },
      { id: 'images', label: 'Создание иллюстраций', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      // Check if cancelled
      const checkCancelled = () => {
        if (abortController.current?.signal.aborted) {
          throw new Error('CANCELLED');
        }
      };

      // Step 1: Research
      updateStep('research', { status: 'active', message: 'Изучаю тему...' });
      checkCancelled();
      
      const researchResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Исследуй тему: "${localPrompt}"`, 
          agentRole: 'research' 
        },
      });

      checkCancelled();

      if (researchResponse.error) {
        throw new Error(researchResponse.error.message || 'Ошибка при исследовании');
      }

      let researchData: any = {};
      try {
        const content = researchResponse.data?.content || '';
        researchData = extractAndFixJson(content);
      } catch (e) {
        console.log('Research parse warning:', e);
      }

      const factsCount = researchData.keyFacts?.length || 0;
      updateStep('research', { 
        status: 'completed', 
        message: `Найдено ${factsCount} ключевых фактов` 
      });

      // Step 2: Structure
      updateStep('structure', { status: 'active', message: 'Планирую структуру...' });
      checkCancelled();
      
      const structureResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `На основе исследования:\n${JSON.stringify(researchData)}\n\nЗапрос пользователя: "${localPrompt}"\n\nСпланируй структуру курса.`, 
          agentRole: 'structure' 
        },
      });

      checkCancelled();

      if (structureResponse.error) {
        throw new Error(structureResponse.error.message || 'Ошибка при планировании');
      }

      let structureData: any = {};
      try {
        const content = structureResponse.data?.content || '';
        structureData = extractAndFixJson(content);
      } catch (e) {
        console.log('Structure parse warning:', e);
      }

      const lessonsCount = structureData.lessons?.length || 0;
      updateStep('structure', { 
        status: 'completed', 
        message: `Создано ${lessonsCount} уроков` 
      });

      // Step 3: Content
      updateStep('content', { status: 'active', message: 'Генерирую контент...' });
      checkCancelled();

      const generateResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Исследование:\n${JSON.stringify(researchData)}\n\nСтруктура:\n${JSON.stringify(structureData)}\n\nСоздай полный контент для всех блоков.`, 
          agentRole: 'content' 
        },
      });

      checkCancelled();

      if (generateResponse.error) {
        throw new Error(generateResponse.error.message || 'Ошибка при генерации');
      }

      updateStep('content', { status: 'completed', message: 'Контент создан' });

      let courseData: GeneratedCourse;
      try {
        const content = generateResponse.data?.content || '';
        courseData = extractAndFixJson(content);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Не удалось распознать структуру курса');
      }

      if (!courseData.lessons || courseData.lessons.length === 0) {
        throw new Error('Курс не содержит уроков');
      }

      // Step 4: Images
      if (localSkipImages) {
        updateStep('images', { status: 'completed', message: 'Пропущено (быстрый режим)' });
      } else {
        updateStep('images', { status: 'active', message: 'Генерирую иллюстрации...' });
        checkCancelled();

        try {
          const slidesToIllustrate: { lessonIdx: number; slideIdx: number; subBlockIdx?: number; description: string }[] = [];
          
          courseData.lessons.forEach((lesson, lessonIdx) => {
            lesson.slides.forEach((slide, slideIdx) => {
              if (slide.type === 'image_text' && !slide.imageUrl) {
                slidesToIllustrate.push({
                  lessonIdx,
                  slideIdx,
                  description: slide.imageDescription || slide.content || lesson.title
                });
              }
              
              if (slide.type === 'design' && slide.subBlocks) {
                slide.subBlocks.forEach((sb: any, sbIdx: number) => {
                  if (sb.type === 'image' && sb.imageDescription && !sb.imageUrl) {
                    slidesToIllustrate.push({
                      lessonIdx,
                      slideIdx,
                      subBlockIdx: sbIdx,
                      description: sb.imageDescription
                    });
                  }
                });
              }
            });
          });

          const totalImages = slidesToIllustrate.length;
          
          if (totalImages === 0) {
            updateStep('images', { 
              status: 'completed', 
              message: 'Иллюстрации не требуются'
            });
          } else {
            let imagesGenerated = 0;
            let imageErrors = 0;
            
            const batchSize = 2;
            for (let i = 0; i < slidesToIllustrate.length; i += batchSize) {
              checkCancelled();
              
              const batch = slidesToIllustrate.slice(i, i + batchSize);
              
              try {
                const imagePromises = batch.map(async ({ lessonIdx, slideIdx, subBlockIdx, description }) => {
                  try {
                    const imageUrl = await generateImageForSlide(description, localPrompt);
                    if (imageUrl) {
                      if (subBlockIdx !== undefined) {
                        const subBlocks = courseData.lessons[lessonIdx].slides[slideIdx].subBlocks as any[];
                        if (subBlocks && subBlocks[subBlockIdx]) {
                          subBlocks[subBlockIdx].imageUrl = imageUrl;
                        }
                      } else {
                        courseData.lessons[lessonIdx].slides[slideIdx].imageUrl = imageUrl;
                      }
                      imagesGenerated++;
                    } else {
                      imageErrors++;
                    }
                  } catch {
                    imageErrors++;
                  }
                });

                await Promise.all(imagePromises);
              } catch (batchError) {
                console.error('Batch image error:', batchError);
              }
              
              updateStep('images', { 
                status: 'active',
                message: `Создано ${imagesGenerated}/${totalImages} иллюстраций`
              });
            }
            
            updateStep('images', { 
              status: 'completed', 
              message: imageErrors > 0 
                ? `Создано ${imagesGenerated} из ${totalImages} (${imageErrors} ошибок)`
                : `Создано ${imagesGenerated} иллюстраций`
            });
          }
        } catch (imageError) {
          if ((imageError as Error).message === 'CANCELLED') throw imageError;
          console.error('Image generation failed:', imageError);
          updateStep('images', { 
            status: 'completed', 
            message: 'Иллюстрации пропущены из-за ошибки'
          });
        }
      }

      checkCancelled();

      // Convert to Lesson/Slide format
      const lessons: Lesson[] = courseData.lessons.map((genLesson, lessonIndex) => {
        const lessonId = crypto.randomUUID();
        
        const slides: Slide[] = (genLesson.slides || []).map((genSlide, slideIndex) => {
          const subBlocks = genSlide.subBlocks?.map((sb, sbIndex) => ({
            id: crypto.randomUUID(),
            type: sb.type as any,
            order: sb.order || sbIndex + 1,
            content: sb.content,
            textAlign: sb.textAlign as any,
            textSize: sb.textSize as any,
            fontWeight: sb.fontWeight as any,
            badgeText: sb.badgeText,
            badgeVariant: sb.badgeVariant as any,
            badgeSize: sb.badgeSize as any,
            badges: sb.badges?.map(b => ({ ...b, id: crypto.randomUUID(), iconType: (b.iconType || 'none') as 'none' | 'emoji' | 'lucide' | 'custom' })),
            badgeLayout: sb.badgeLayout as any,
            iconName: sb.iconName,
            buttonLabel: sb.buttonLabel,
            buttonUrl: sb.buttonUrl,
            buttonVariant: sb.buttonVariant as any,
            imageUrl: sb.imageUrl,
            imageSize: sb.imageSize as any,
            imageRotation: sb.imageRotation,
            textRotation: sb.textRotation,
            backdrop: sb.backdrop as any,
            backdropRounded: sb.backdropRounded,
            highlight: sb.highlight as any,
            padding: sb.padding as any,
            dividerStyle: sb.dividerStyle as any,
            tableData: sb.tableData?.map(row => row.map(cell => ({ ...cell, id: crypto.randomUUID() }))),
            tableStyle: sb.tableStyle as any,
            tableTextSize: sb.tableTextSize as any,
            animationUrl: sb.animationUrl,
            animationType: sb.animationType as any,
            animationSize: sb.animationSize as any,
            animationAutoplay: sb.animationAutoplay,
            animationLoop: sb.animationLoop,
          }));

          return {
            id: crypto.randomUUID(),
            lessonId,
            type: genSlide.type || 'text',
            order: slideIndex + 1,
            content: genSlide.content || '',
            imageUrl: genSlide.imageUrl,
            subBlocks: genSlide.type === 'design' ? subBlocks : undefined,
            options: genSlide.options?.map(opt => ({
              id: crypto.randomUUID(),
              text: opt,
              isCorrect: Array.isArray(genSlide.correctAnswer) 
                ? genSlide.correctAnswer.includes(opt)
                : genSlide.correctAnswer === opt,
            })),
            correctAnswer: genSlide.correctAnswer,
            explanation: genSlide.explanation,
            explanationCorrect: genSlide.explanationCorrect,
            explanationPartial: genSlide.explanationPartial,
            blankWord: genSlide.blankWord,
            matchingPairs: genSlide.matchingPairs?.map(p => ({ ...p, id: crypto.randomUUID() })),
            orderingItems: genSlide.orderingItems,
            correctOrder: genSlide.correctOrder,
            sliderMin: genSlide.sliderMin,
            sliderMax: genSlide.sliderMax,
            sliderCorrect: genSlide.sliderCorrect,
            sliderStep: genSlide.sliderStep,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        return {
          id: lessonId,
          courseId,
          title: genLesson.title || `Урок ${lessonIndex + 1}`,
          description: genLesson.description || '',
          order: lessonIndex + 1,
          slides,
          estimatedMinutes: Math.ceil(slides.length * 0.5),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      completeGeneration(lessons);
      isGeneratingRef.current = false;

    } catch (err) {
      isGeneratingRef.current = false;
      
      if ((err as Error).message === 'CANCELLED') {
        // User cancelled - keep prompt for editing
        return;
      }
      
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      
      // Mark current active step as error
      setSteps(state.steps.map(step => 
        step.status === 'active' ? { ...step, status: 'error', message: errorMessage } : step
      ));
    }
  };

  const handleApplyGenerated = () => {
    if (state.generatedLessons) {
      onGenerated(state.generatedLessons);
      onOpenChange(false);
      resetGeneration();
      setLocalPrompt('');
    }
  };

  const handleNewGeneration = () => {
    resetGeneration();
  };

  const handleMinimize = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    cancelGeneration();
  };

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStepIconByType = (stepId: string) => {
    switch (stepId) {
      case 'research':
        return <Search className="w-4 h-4" />;
      case 'structure':
        return <Brain className="w-4 h-4" />;
      case 'content':
        return <Layers className="w-4 h-4" />;
      case 'images':
        return <Image className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const duration = getGenerationDuration(state.startTime, state.endTime);
  const isIdle = state.status === 'idle';
  const isGenerating = state.status === 'generating';
  const isCompleted = state.status === 'completed';
  const isCancelled = state.status === 'cancelled';
  const isError = state.status === 'error';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              {isCompleted ? (
                <PartyPopper className="w-5 h-5 text-emerald-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
              {isCompleted ? 'Курс готов!' : 'AI Генератор курса'}
            </DialogTitle>
            <DialogDescription>
              {isCompleted 
                ? `Создан за ${duration} секунд`
                : 'Опишите тему и AI создаст курс с уроками и слайдами'
              }
            </DialogDescription>
          </div>
          
          {/* Minimize button when generating */}
          {isGenerating && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMinimize}
              className="h-8 w-8 rounded-full"
              title="Свернуть"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Idle state - input form */}
          {(isIdle || isCancelled) && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isCancelled 
                    ? 'Генерация была отменена. Вы можете изменить запрос и попробовать снова.'
                    : 'Опишите тему курса и AI создаст структуру с уроками и слайдами'
                  }
                </p>
                <Textarea
                  placeholder="Например: Курс по основам Python для начинающих. Охватить переменные, циклы, функции и простые проекты."
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <Checkbox 
                  id="skipImages" 
                  checked={localSkipImages}
                  onCheckedChange={(checked) => setLocalSkipImages(checked === true)}
                />
                <Label 
                  htmlFor="skipImages" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Быстрый режим (без иллюстраций)
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onOpenChange(false);
                    if (isCancelled) resetGeneration();
                  }}
                >
                  {isCancelled ? 'Закрыть' : 'Отмена'}
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!localPrompt.trim()}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isCancelled ? 'Попробовать снова' : 'Сгенерировать'}
                </Button>
              </div>
            </>
          )}

          {/* Generating state - progress */}
          {isGenerating && state.steps.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
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
                      step.status === 'completed' && "bg-emerald-50 border border-emerald-200",
                      step.status === 'error' && "bg-destructive/5 border border-destructive/20",
                      step.status === 'pending' && "opacity-50"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {getStepIconByType(step.id)}
                        </span>
                        <span className={cn(
                          "font-medium text-sm",
                          step.status === 'completed' && "text-emerald-700",
                          step.status === 'error' && "text-destructive"
                        )}>
                          {step.label}
                        </span>
                      </div>
                      {step.message && (
                        <p className={cn(
                          "text-xs mt-0.5 line-clamp-2",
                          step.status === 'error' ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cancel button */}
              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                  Отменить генерацию
                </Button>
              </div>
            </div>
          )}

          {/* Completed state */}
          {isCompleted && state.generatedLessons && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">
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

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ваш запрос:</p>
                <p className="text-sm">{state.prompt}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleNewGeneration}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Создать новый
                </Button>
                <Button
                  onClick={handleApplyGenerated}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" />
                  Применить курс
                </Button>
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="space-y-3">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Ошибка генерации</span>
                </div>
                <p className="text-sm text-destructive/80">{state.error}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ваш запрос:</p>
                <p className="text-sm">{state.prompt}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLocalPrompt(state.prompt);
                    resetGeneration();
                  }}
                >
                  Попробовать снова
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Course, Lesson, Slide, SlideType } from '@/types/course';
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
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (lessons: Lesson[]) => void;
  courseId: string;
}

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
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
  iconName?: string;
  buttonLabel?: string;
  buttonVariant?: string;
}

interface GeneratedSlide {
  type: SlideType;
  content?: string;
  imageUrl?: string;
  imageDescription?: string; // AI-generated description for image generation
  options?: string[];
  correctAnswer?: string | string[] | boolean;
  explanation?: string;
  blankWord?: string;
  subBlocks?: GeneratedSubBlock[];
}

interface GeneratedLesson {
  title: string;
  description: string;
  slides: GeneratedSlide[];
}

interface GeneratedCourse {
  title: string;
  description: string;
  targetAudience: string;
  estimatedMinutes: number;
  lessons: GeneratedLesson[];
}

export const AIGeneratorDialog: React.FC<AIGeneratorDialogProps> = ({
  open,
  onOpenChange,
  onGenerated,
  courseId,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (stepId: string, updates: Partial<GenerationStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const generateImageForSlide = async (slideContent: string, coursePrompt: string): Promise<string | null> => {
    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: coursePrompt,
          slideContext: slideContent
        },
      });

      if (response.error) {
        console.error('Image generation error:', response.error);
        return null;
      }

      return response.data?.imageUrl || null;
    } catch (err) {
      console.error('Image generation failed:', err);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    // Initialize steps - new 4-step pipeline
    const initialSteps: GenerationStep[] = [
      { id: 'research', label: 'Исследование темы', status: 'pending' },
      { id: 'structure', label: 'Планирование структуры', status: 'pending' },
      { id: 'content', label: 'Генерация контента', status: 'pending' },
      { id: 'images', label: 'Создание иллюстраций', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      // Step 1: Research - gather facts about the topic
      updateStep('research', { status: 'active', message: 'Изучаю тему...' });
      
      const researchResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Исследуй тему: "${prompt}"`, 
          agentRole: 'research' 
        },
      });

      if (researchResponse.error) {
        throw new Error(researchResponse.error.message || 'Ошибка при исследовании');
      }

      let researchData: any = {};
      try {
        const content = researchResponse.data?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          researchData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('Research parse warning:', e);
      }

      const factsCount = researchData.keyFacts?.length || 0;
      updateStep('research', { 
        status: 'completed', 
        message: `Найдено ${factsCount} ключевых фактов` 
      });

      // Step 2: Structure - plan the course based on research
      updateStep('structure', { status: 'active', message: 'Планирую структуру...' });

      const structureResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Запрос пользователя: "${prompt}"

Исследование темы:
${JSON.stringify(researchData, null, 2)}

Создай структуру курса СТРОГО по требованиям пользователя. Если указано количество уроков или блоков - следуй им точно.`, 
          agentRole: 'structure' 
        },
      });

      if (structureResponse.error) {
        throw new Error(structureResponse.error.message || 'Ошибка при планировании');
      }

      let structureData: any = {};
      try {
        const content = structureResponse.data?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structureData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('Structure parse warning:', e);
      }

      const lessonsCount = structureData.lessons?.length || 0;
      const blocksCount = structureData.lessons?.reduce((acc: number, l: any) => acc + (l.blocks?.length || 0), 0) || 0;
      updateStep('structure', { 
        status: 'completed', 
        message: `${lessonsCount} уроков, ${blocksCount} блоков` 
      });

      // Step 3: Generate actual content for blocks
      updateStep('content', { status: 'active', message: 'Создаю контент...' });

      const generateResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Запрос пользователя: "${prompt}"

Структура курса:
${JSON.stringify(structureData, null, 2)}

Исследование:
${JSON.stringify(researchData, null, 2)}

Создай полный контент для КАЖДОГО блока по этой структуре. Следуй плану точно.`, 
          agentRole: 'content' 
        },
      });

      if (generateResponse.error) {
        throw new Error(generateResponse.error.message || 'Ошибка при генерации');
      }

      updateStep('content', { status: 'completed', message: 'Контент создан' });

      // Parse course data
      let courseData: GeneratedCourse;
      try {
        const content = generateResponse.data?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Не удалось найти JSON в ответе');
        }
        courseData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Не удалось распознать структуру курса');
      }

      if (!courseData.lessons || courseData.lessons.length === 0) {
        throw new Error('Курс не содержит уроков');
      }

      // Step 4: Generate images for all image_text slides (max 8)
      updateStep('images', { status: 'active', message: 'Генерирую иллюстрации...' });

      // Find ALL slides that need images (image_text type), limit to 8
      const slidesToIllustrate: { lessonIdx: number; slideIdx: number; description: string }[] = [];
      
      courseData.lessons.forEach((lesson, lessonIdx) => {
        lesson.slides.forEach((slide, slideIdx) => {
          // Generate images for image_text slides that have imageDescription
          if (slide.type === 'image_text' && !slide.imageUrl && slidesToIllustrate.length < 8) {
            slidesToIllustrate.push({
              lessonIdx,
              slideIdx,
              // Use imageDescription if available, otherwise fall back to content
              description: slide.imageDescription || slide.content || lesson.title
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
        // Generate images in parallel (batch of 2 at a time to avoid rate limits)
        let imagesGenerated = 0;
        let imageErrors = 0;
        
        // Process in smaller batches to avoid rate limits
        const batchSize = 2;
        for (let i = 0; i < slidesToIllustrate.length; i += batchSize) {
          const batch = slidesToIllustrate.slice(i, i + batchSize);
          
          try {
            const imagePromises = batch.map(async ({ lessonIdx, slideIdx, description }) => {
              try {
                // Use the detailed imageDescription for generation
                const imageUrl = await generateImageForSlide(description, prompt);
                if (imageUrl) {
                  courseData.lessons[lessonIdx].slides[slideIdx].imageUrl = imageUrl;
                  imagesGenerated++;
                  updateStep('images', { message: `Создано ${imagesGenerated} из ${totalImages} изображений...` });
                } else {
                  imageErrors++;
                }
                return imageUrl;
              } catch (err) {
                console.error('Image generation error:', err);
                imageErrors++;
                return null;
              }
            });

            await Promise.all(imagePromises);
          } catch (batchError) {
            console.error('Batch image generation error:', batchError);
            imageErrors += batch.length;
          }
          
          // Small delay between batches to avoid rate limits
          if (i + batchSize < slidesToIllustrate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Mark images step as completed (with warning if some failed)
        if (imagesGenerated > 0) {
          updateStep('images', { 
            status: 'completed', 
            message: imageErrors > 0 
              ? `${imagesGenerated} из ${totalImages} иллюстраций (${imageErrors} не удалось)`
              : `${imagesGenerated} иллюстраций создано`
          });
        } else {
          // All images failed - still continue but show warning
          updateStep('images', { 
            status: 'completed', 
            message: 'Не удалось создать иллюстрации (можно добавить позже)'
          });
        }
      }

      // Convert to our Lesson/Slide format
      const lessons: Lesson[] = courseData.lessons.map((genLesson, lessonIndex) => {
        const lessonId = crypto.randomUUID();
        
        const slides: Slide[] = (genLesson.slides || []).map((genSlide, slideIndex) => {
          // Process subBlocks for design type
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
            iconName: sb.iconName,
            buttonLabel: sb.buttonLabel,
            buttonVariant: sb.buttonVariant as any,
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
            blankWord: genSlide.blankWord,
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

      // Generation complete - no separate finalize step needed

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      onGenerated(lessons);
      onOpenChange(false);
      
      // Reset state
      setPrompt('');
      setSteps([]);

    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      
      // Mark current active step as error
      setSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error', message: errorMessage } : step
      ));
    } finally {
      setIsGenerating(false);
    }
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

  // Prevent closing dialog while generating
  const handleOpenChange = (newOpen: boolean) => {
    if (isGenerating && !newOpen) {
      // Don't allow closing while generating
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={!isGenerating}>
      <DialogContent 
        className={cn("sm:max-w-[500px]", isGenerating && "[&>button]:hidden")}
        onPointerDownOutside={(e) => isGenerating && e.preventDefault()}
        onEscapeKeyDown={(e) => isGenerating && e.preventDefault()}
        onInteractOutside={(e) => isGenerating && e.preventDefault()}
        onFocusOutside={(e) => isGenerating && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Генератор курса
          </DialogTitle>
          <DialogDescription>
            Опишите тему и AI создаст курс с уроками и слайдами
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input area */}
          {!isGenerating && steps.length === 0 && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Опишите тему курса и AI создаст структуру с уроками и слайдами
                </p>
                <Textarea
                  placeholder="Например: Курс по основам Python для начинающих. Охватить переменные, циклы, функции и простые проекты."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Сгенерировать
                </Button>
              </div>
            </>
          )}

          {/* Progress steps */}
          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Генерируем курс:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{prompt}</p>
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => (
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

              {error && !isGenerating && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSteps([]);
                      setError(null);
                    }}
                  >
                    Попробовать снова
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

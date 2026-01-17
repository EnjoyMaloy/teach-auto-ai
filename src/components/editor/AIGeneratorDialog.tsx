import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
    
    // Initialize steps
    const initialSteps: GenerationStep[] = [
      { id: 'plan', label: 'Планирование структуры', status: 'pending' },
      { id: 'generate', label: 'Генерация контента', status: 'pending' },
      { id: 'images', label: 'Создание иллюстраций', status: 'pending' },
      { id: 'finalize', label: 'Финализация курса', status: 'pending' },
    ];
    setSteps(initialSteps);

    try {
      // Step 1: Planning
      updateStep('plan', { status: 'active', message: 'Анализирую запрос...' });
      
      const planResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: prompt, 
          agentRole: 'planner' 
        },
      });

      if (planResponse.error) {
        throw new Error(planResponse.error.message || 'Ошибка при планировании');
      }

      updateStep('plan', { 
        status: 'completed', 
        message: planResponse.data?.content?.substring(0, 100) + '...' 
      });

      // Step 2: Generate content
      updateStep('generate', { status: 'active', message: 'Создаю уроки и слайды...' });

      const generateResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Создай полный курс по теме: "${prompt}". 

Требования:
- 2-4 урока
- 4-6 слайдов в каждом уроке
- Разные типы слайдов: text, single_choice, multiple_choice, true_false, fill_blank
- Краткий, понятный контент
- Интересные вопросы с объяснениями`, 
          agentRole: 'builder' 
        },
      });

      if (generateResponse.error) {
        throw new Error(generateResponse.error.message || 'Ошибка при генерации');
      }

      updateStep('generate', { status: 'completed', message: 'Контент создан' });

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

      // Step 3: Generate images for text slides
      updateStep('images', { status: 'active', message: 'Генерирую иллюстрации...' });

      // Find slides that could use images (first text slide of each lesson)
      const slidesToIllustrate: { lessonIdx: number; slideIdx: number; content: string }[] = [];
      
      courseData.lessons.forEach((lesson, lessonIdx) => {
        // Find first text slide in each lesson for illustration
        const textSlideIdx = lesson.slides.findIndex(s => s.type === 'text');
        if (textSlideIdx !== -1) {
          slidesToIllustrate.push({
            lessonIdx,
            slideIdx: textSlideIdx,
            content: lesson.slides[textSlideIdx].content
          });
        }
      });

      // Generate images in parallel (max 3 at a time)
      let imagesGenerated = 0;
      const imagePromises = slidesToIllustrate.slice(0, 3).map(async ({ lessonIdx, slideIdx, content }) => {
        const imageUrl = await generateImageForSlide(content, prompt);
        if (imageUrl) {
          courseData.lessons[lessonIdx].slides[slideIdx].imageUrl = imageUrl;
          // Change slide type to image_text if image was generated
          courseData.lessons[lessonIdx].slides[slideIdx].type = 'image_text' as SlideType;
          imagesGenerated++;
          updateStep('images', { message: `Создано ${imagesGenerated} изображений...` });
        }
        return imageUrl;
      });

      await Promise.all(imagePromises);

      updateStep('images', { 
        status: 'completed', 
        message: `${imagesGenerated} иллюстраций создано` 
      });

      // Step 4: Finalize
      updateStep('finalize', { status: 'active', message: 'Финализирую...' });

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

      updateStep('finalize', { status: 'completed', message: 'Готово!' });

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
      case 'plan':
        return <Brain className="w-4 h-4" />;
      case 'generate':
        return <Layers className="w-4 h-4" />;
      case 'images':
        return <Image className="w-4 h-4" />;
      case 'finalize':
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Генератор курса
          </DialogTitle>
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

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  badgeSize?: string;
  badges?: { id: string; text: string; iconType: string; iconValue?: string }[];
  badgeLayout?: string;
  iconName?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  buttonVariant?: string;
  imageDescription?: string;
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
  imageDescription?: string; // AI-generated description for image generation
  options?: string[];
  correctAnswer?: string | string[] | boolean | number;
  explanation?: string;
  explanationCorrect?: string;
  explanationPartial?: string;
  blankWord?: string;
  // Matching
  matchingPairs?: { id: string; left: string; right: string }[];
  // Ordering
  orderingItems?: string[];
  correctOrder?: string[];
  // Slider
  sliderMin?: number;
  sliderMax?: number;
  sliderCorrect?: number;
  sliderStep?: number;
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

// Helper to extract and fix JSON from AI response
const extractAndFixJson = (content: string): any => {
  if (!content || typeof content !== 'string') {
    console.error('extractAndFixJson received empty or invalid content:', content);
    throw new Error('Пустой ответ от AI');
  }

  console.log('Attempting to parse content length:', content.length);
  console.log('Content preview:', content.substring(0, 500));

  // Multiple strategies to find JSON
  let jsonStr = '';
  
  // Strategy 1: Find JSON in code blocks
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }
  
  // Strategy 2: Find any code block
  if (!jsonStr) {
    const anyBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
    if (anyBlockMatch) {
      jsonStr = anyBlockMatch[1];
    }
  }
  
  // Strategy 3: Find JSON object pattern (greedy - find the largest match)
  if (!jsonStr) {
    const firstBrace = content.indexOf('{');
    if (firstBrace !== -1) {
      jsonStr = content.substring(firstBrace);
    }
  }
  
  if (!jsonStr || jsonStr.trim().length === 0) {
    console.error('No JSON found in content. Full content:', content);
    throw new Error('JSON не найден в ответе');
  }
  
  // Clean up common issues
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')  // Remove trailing commas before }
    .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
    .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
    .replace(/\n\s*\.\.\.\s*\n/g, '\n')  // Remove ... ellipsis lines
    .replace(/"\s*\n\s*"/g, '", "')  // Fix broken string arrays
    .trim();
  
  // Try to parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // If it fails, try to fix truncated JSON
    console.warn('JSON parse failed, attempting aggressive fix...', e);
    console.log('Problematic JSON (first 1000 chars):', jsonStr.substring(0, 1000));
    
    // Try to find the last complete object/array
    let fixedJson = jsonStr;
    
    // Remove incomplete trailing content
    // Find patterns like: ,"incomplete  or {"incomplete  
    const incompletePatterns = [
      /,\s*"[^"]*$/,           // Trailing incomplete key
      /,\s*\{[^}]*$/,          // Trailing incomplete object
      /,\s*\[[^\]]*$/,         // Trailing incomplete array
      /:\s*"[^"]*$/,           // Trailing incomplete value
      /:\s*\{[^}]*$/,          // Trailing incomplete object value
    ];
    
    for (const pattern of incompletePatterns) {
      fixedJson = fixedJson.replace(pattern, '');
    }
    
    // Count brackets to find imbalance
    const openBraces = (fixedJson.match(/\{/g) || []).length;
    const closeBraces = (fixedJson.match(/\}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/\]/g) || []).length;
    
    console.log(`Bracket balance: { ${openBraces}/${closeBraces}, [ ${openBrackets}/${closeBrackets}`);
    
    // Add missing closing brackets in correct order
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixedJson += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixedJson += '}';
    }
    
    try {
      return JSON.parse(fixedJson);
    } catch (e2) {
      console.error('Aggressive fix also failed:', e2);
      console.log('Final attempt JSON:', fixedJson.substring(fixedJson.length - 500));
      
      // Last resort: try to extract at least partial data
      // Look for the lessons array specifically
      const lessonsMatch = fixedJson.match(/"lessons"\s*:\s*\[([\s\S]*)/);
      if (lessonsMatch) {
        const lessonsContent = lessonsMatch[1];
        // Find complete lesson objects
        const lessonObjects: any[] = [];
        let depth = 0;
        let start = -1;
        
        for (let i = 0; i < lessonsContent.length; i++) {
          const char = lessonsContent[i];
          if (char === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              try {
                const lessonStr = lessonsContent.substring(start, i + 1);
                const lesson = JSON.parse(lessonStr);
                lessonObjects.push(lesson);
              } catch {}
              start = -1;
            }
          }
        }
        
        if (lessonObjects.length > 0) {
          console.log(`Extracted ${lessonObjects.length} complete lessons from truncated response`);
          return {
            title: 'Сгенерированный курс',
            description: '',
            lessons: lessonObjects
          };
        }
      }
      
      throw new Error('Не удалось восстановить JSON после всех попыток');
    }
  }
};

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
  const [skipImages, setSkipImages] = useState(false);

  const updateStep = (stepId: string, updates: Partial<GenerationStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const generateImageForSlide = async (slideContent: string, coursePrompt: string): Promise<string | null> => {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds max

    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: coursePrompt,
          slideContext: slideContent
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

  // Resolve animation keyword to Lottie URL
  const resolveAnimationUrl = async (keyword: string): Promise<string | null> => {
    try {
      const response = await supabase.functions.invoke('lottiefiles-search', {
        body: { query: keyword, limit: 1 },
      });

      if (response.error || !response.data?.success) {
        console.error('Animation search error:', response.error);
        return null;
      }

      const animations = response.data.data || [];
      return animations[0]?.lottieUrl || null;
    } catch (err) {
      console.error('Animation resolution failed:', err);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    // Initialize steps - new 5-step pipeline
    const initialSteps: GenerationStep[] = [
      { id: 'research', label: 'Исследование темы', status: 'pending' },
      { id: 'structure', label: 'Планирование структуры', status: 'pending' },
      { id: 'content', label: 'Генерация контента', status: 'pending' },
      { id: 'animations', label: 'Загрузка анимаций', status: 'pending' },
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
        researchData = extractAndFixJson(content);
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
        structureData = extractAndFixJson(content);
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

      // Parse course data with robust JSON fixing
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

      // Step 4: Resolve animation keywords to Lottie URLs
      updateStep('animations', { status: 'active', message: 'Загружаю анимации...' });
      
      try {
        // Find all animation subBlocks with animationKeyword
        const animationsToResolve: { lessonIdx: number; slideIdx: number; subBlockIdx: number; keyword: string }[] = [];
        
        courseData.lessons.forEach((lesson, lessonIdx) => {
          lesson.slides.forEach((slide, slideIdx) => {
            if (slide.type === 'design' && slide.subBlocks) {
              slide.subBlocks.forEach((sb: any, sbIdx: number) => {
                if (sb.type === 'animation' && sb.animationKeyword && !sb.animationUrl) {
                  animationsToResolve.push({
                    lessonIdx,
                    slideIdx,
                    subBlockIdx: sbIdx,
                    keyword: sb.animationKeyword
                  });
                }
              });
            }
          });
        });

        console.log(`Found ${animationsToResolve.length} animations to resolve`);
        
        if (animationsToResolve.length === 0) {
          updateStep('animations', { status: 'completed', message: 'Анимации не требуются' });
        } else {
          let resolved = 0;
          // Resolve in batches of 3
          for (let i = 0; i < animationsToResolve.length; i += 3) {
            const batch = animationsToResolve.slice(i, i + 3);
            
            await Promise.all(batch.map(async ({ lessonIdx, slideIdx, subBlockIdx, keyword }) => {
              try {
                const url = await resolveAnimationUrl(keyword);
                if (url && courseData.lessons[lessonIdx]?.slides[slideIdx]?.subBlocks?.[subBlockIdx]) {
                  (courseData.lessons[lessonIdx].slides[slideIdx].subBlocks as any)[subBlockIdx].animationUrl = url;
                  resolved++;
                  updateStep('animations', { message: `Загружено ${resolved} из ${animationsToResolve.length}...` });
                }
              } catch (err) {
                console.error('Animation resolve error:', err);
              }
            }));
            
            // Small delay between batches
            if (i + 3 < animationsToResolve.length) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          
          updateStep('animations', { status: 'completed', message: `${resolved} анимаций загружено` });
        }
      } catch (animError) {
        console.error('Animation step error:', animError);
        updateStep('animations', { status: 'completed', message: 'Пропущено (ошибка)' });
      }

      // Step 5: Generate images for all image_text slides (max 8) - or skip if user chose fast mode
      if (skipImages) {
        updateStep('images', { status: 'completed', message: 'Пропущено (быстрый режим)' });
      } else {
        updateStep('images', { status: 'active', message: 'Генерирую иллюстрации...' });

        try {
          // Find ALL slides that need images (image_text type), limit to 8
          const slidesToIllustrate: { lessonIdx: number; slideIdx: number; description: string }[] = [];
          
          // Log all slide types for debugging
          console.log('=== Analyzing slides for image generation ===');
          courseData.lessons.forEach((lesson, lessonIdx) => {
            console.log(`Lesson ${lessonIdx + 1}: ${lesson.title}`);
            lesson.slides.forEach((slide, slideIdx) => {
              console.log(`  Slide ${slideIdx + 1}: type=${slide.type}, hasImageUrl=${!!slide.imageUrl}, hasImageDescription=${!!slide.imageDescription}`);
              
              // Generate images for image_text slides that don't have imageUrl
              if (slide.type === 'image_text' && !slide.imageUrl) {
                slidesToIllustrate.push({
                  lessonIdx,
                  slideIdx,
                  // Use imageDescription if available, otherwise fall back to content
                  description: slide.imageDescription || slide.content || lesson.title
                });
                console.log(`    -> Added to illustration queue with description: ${(slide.imageDescription || slide.content || '').substring(0, 50)}...`);
              }
            });
          });

          console.log(`Total slides to illustrate: ${slidesToIllustrate.length}`);
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
                await new Promise(resolve => setTimeout(resolve, 500));
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
        } catch (imageStepError) {
          console.error('Image generation step failed:', imageStepError);
          // Ensure step is marked as completed even on total failure
          updateStep('images', { 
            status: 'completed', 
            message: 'Пропущено (ошибка генерации)'
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
            badgeSize: sb.badgeSize as any,
            badges: sb.badges?.map(b => ({ ...b, id: crypto.randomUUID(), iconType: (b.iconType || 'none') as 'none' | 'emoji' | 'lucide' | 'custom' })),
            badgeLayout: sb.badgeLayout as any,
            iconName: sb.iconName,
            buttonLabel: sb.buttonLabel,
            buttonUrl: sb.buttonUrl,
            buttonVariant: sb.buttonVariant as any,
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
            // Animation - use resolved URL if available
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
            // Quiz options
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
            // Matching
            matchingPairs: genSlide.matchingPairs?.map(p => ({ ...p, id: crypto.randomUUID() })),
            // Ordering
            orderingItems: genSlide.orderingItems,
            correctOrder: genSlide.correctOrder,
            // Slider
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
      case 'animations':
        return <Sparkles className="w-4 h-4" />;
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

              <div className="flex items-center gap-2 py-2">
                <Checkbox 
                  id="skipImages" 
                  checked={skipImages}
                  onCheckedChange={(checked) => setSkipImages(checked === true)}
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

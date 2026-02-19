import { useRef, useCallback } from 'react';
import { Lesson, Slide, SlideType, CourseDesignSystem } from '@/types/course';
import { useAIGeneration, GenerationStep } from '@/hooks/useAIGeneration';
import { DesignSystemConfig } from '@/types/designSystem';
import { supabase } from '@/integrations/supabase/client';

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

const extractAndFixJson = (content: string): any => {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const fixes = [
      (s: string) => s.replace(/\n/g, '\\n'),
      (s: string) => s.replace(/,(\s*[}\]])/g, '$1'),
      (s: string) => s.replace(/'/g, '"'),
      (s: string) => s.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'),
    ];
    
    for (const fix of fixes) {
      try {
        return JSON.parse(fix(jsonStr));
      } catch {
        continue;
      }
    }
    
    throw new Error('Не удалось восстановить JSON после всех попыток');
  }
};

const getColorPalette = (designSystem?: CourseDesignSystem) => {
  if (!designSystem) return null;
  
  const hslToColorName = (hsl: string): string => {
    if (!hsl) return '';
    const parts = hsl.split(' ').map(p => parseFloat(p));
    if (parts.length < 3) return hsl;
    const [h, s, l] = parts;
    
    let colorName = '';
    if (s < 10) {
      colorName = l > 50 ? 'light gray' : 'dark gray';
    } else if (h < 30) colorName = 'red-orange';
    else if (h < 60) colorName = 'orange-yellow';
    else if (h < 90) colorName = 'yellow-green';
    else if (h < 150) colorName = 'green';
    else if (h < 210) colorName = 'cyan-teal';
    else if (h < 270) colorName = 'blue-purple';
    else if (h < 330) colorName = 'purple-magenta';
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

const generateImageForSlide = async (
  slideContent: string,
  coursePrompt: string,
  designSystem?: CourseDesignSystem,
  imageModel?: string
): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt: coursePrompt,
        slideContext: slideContent,
        colorPalette: getColorPalette(designSystem),
        imageModel: imageModel || 'gemini-3-pro',
      },
    });
    clearTimeout(timeoutId);
    if (response.error) return null;
    return response.data?.imageUrl || null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
};

export const useGenerateCourse = (courseId: string) => {
  const {
    state,
    startGeneration,
    updateStep,
    setSteps,
    setError,
    completeGeneration,
    abortController,
    designSystem,
  } = useAIGeneration();

  const isGeneratingRef = useRef(false);

  const runGeneration = useCallback(async (
    prompt: string, 
    skipImages: boolean, 
    lessonCount: number = 3,
    selectedDesignConfig?: DesignSystemConfig,
    selectedDesignSystemId?: string,
    imageModel?: string,
  ) => {
    if (!prompt.trim() || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    startGeneration(prompt, skipImages);

    const initialSteps: GenerationStep[] = [
      { id: 'research', label: 'Исследование темы', status: 'pending' },
      { id: 'structure', label: 'Планирование структуры', status: 'pending' },
      { id: 'content', label: 'Генерация контента', status: 'pending' },
      { id: 'images', label: 'Создание иллюстраций', status: 'pending' },
    ];
    setSteps(initialSteps);

    const lessonInstruction = `\n\nВАЖНО: Создай ровно ${lessonCount} уроков.`;

    try {
      const checkCancelled = () => {
        if (abortController.current?.signal.aborted) {
          throw new Error('CANCELLED');
        }
      };

      // Step 1: Research
      updateStep('research', { status: 'active', message: 'Изучаю тему...' });
      checkCancelled();
      
      const researchResponse = await supabase.functions.invoke('generate-course', {
        body: { userMessage: `Исследуй тему: "${prompt}"\n\nВАЖНО: Раздели тему ровно на ${lessonCount} концепций (каждая концепция = 1 урок). Определи логическую последовательность изучения.`, agentRole: 'research' },
      });
      checkCancelled();
      if (researchResponse.error) throw new Error(researchResponse.error.message || 'Ошибка при исследовании');

      let researchData: any = {};
      try {
        researchData = extractAndFixJson(researchResponse.data?.content || '');
      } catch (e) {
        console.log('Research parse warning:', e);
      }

      updateStep('research', { 
        status: 'completed', 
        message: `Найдено ${researchData.keyFacts?.length || 0} ключевых фактов` 
      });

      // Step 2: Structure
      updateStep('structure', { status: 'active', message: 'Планирую структуру...' });
      checkCancelled();
      
      const structureResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `На основе исследования:\n${JSON.stringify(researchData)}\n\nЗапрос пользователя: "${prompt}"\n\nВАЖНО: Создай ровно ${lessonCount} уроков. Каждый урок = 1 концепция из исследования. В "contentOutline" для каждого блока напиши КОНКРЕТНО что будет в этом блоке. В "quizSource" для квизов укажи какой тезис из теории проверяется.\n\nСпланируй структуру курса.`, 
          agentRole: 'structure' 
        },
      });
      checkCancelled();
      if (structureResponse.error) throw new Error(structureResponse.error.message || 'Ошибка при планировании');

      let structureData: any = {};
      try {
        structureData = extractAndFixJson(structureResponse.data?.content || '');
      } catch (e) {
        console.log('Structure parse warning:', e);
      }

      updateStep('structure', { 
        status: 'completed', 
        message: `Создано ${structureData.lessons?.length || 0} уроков` 
      });

      // Step 3: Content
      updateStep('content', { status: 'active', message: 'Генерирую контент...' });
      checkCancelled();

      const generateResponse = await supabase.functions.invoke('generate-course', {
        body: { 
          userMessage: `Исследование:\n${JSON.stringify(researchData)}\n\nСтруктура:\n${JSON.stringify(structureData)}\n\nВАЖНО: Создай ровно ${lessonCount} уроков по 10 блоков каждый.\n\n## КРИТИЧЕСКИЕ ПРАВИЛА СВЯЗНОСТИ:\n1. Квиз в блоке 4 проверяет ТОЛЬКО материал из блоков 2-3 этого урока\n2. Квиз в блоке 7 проверяет ТОЛЬКО материал из блоков 5-6 этого урока\n3. Блок 1 каждого урока говорит "чему научимся"\n4. Блок 10 каждого урока подводит итоги + тизер следующего урока\n5. Следуй "contentOutline" из структуры для каждого блока!\n\nСоздай полный контент для всех блоков.`, 
          agentRole: 'content' 
        },
      });
      checkCancelled();
      if (generateResponse.error) throw new Error(generateResponse.error.message || 'Ошибка при генерации');

      updateStep('content', { status: 'completed', message: 'Контент создан' });

      let courseData: GeneratedCourse;
      try {
        courseData = extractAndFixJson(generateResponse.data?.content || '');
      } catch (parseError) {
        throw new Error('Не удалось распознать структуру курса');
      }

      if (!courseData.lessons || courseData.lessons.length === 0) {
        throw new Error('Курс не содержит уроков');
      }

      // Step 4: Images
      if (skipImages) {
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
                  lessonIdx, slideIdx,
                  description: slide.imageDescription || slide.content || lesson.title
                });
              }
              if (slide.type === 'design' && slide.subBlocks) {
                slide.subBlocks.forEach((sb: any, sbIdx: number) => {
                  if (sb.type === 'image' && sb.imageDescription && !sb.imageUrl) {
                    slidesToIllustrate.push({
                      lessonIdx, slideIdx, subBlockIdx: sbIdx,
                      description: sb.imageDescription
                    });
                  }
                });
              }
            });
          });

          const totalImages = slidesToIllustrate.length;
          
          if (totalImages === 0) {
            updateStep('images', { status: 'completed', message: 'Иллюстрации не требуются' });
          } else {
            let imagesGenerated = 0;
            let imageErrors = 0;
            const batchSize = 4;
            
            for (let i = 0; i < slidesToIllustrate.length; i += batchSize) {
              checkCancelled();
              const batch = slidesToIllustrate.slice(i, i + batchSize);
              
              try {
                await Promise.all(batch.map(async ({ lessonIdx, slideIdx, subBlockIdx, description }) => {
                  try {
                    const imageUrl = await generateImageForSlide(description, prompt, designSystem, imageModel);
                    if (imageUrl) {
                      if (subBlockIdx !== undefined) {
                        const subBlocks = courseData.lessons[lessonIdx].slides[slideIdx].subBlocks as any[];
                        if (subBlocks?.[subBlockIdx]) subBlocks[subBlockIdx].imageUrl = imageUrl;
                      } else {
                        courseData.lessons[lessonIdx].slides[slideIdx].imageUrl = imageUrl;
                      }
                      imagesGenerated++;
                    } else {
                      imageErrors++;
                    }
                  } catch { imageErrors++; }
                }));
              } catch (batchError) {
                console.error('Batch image error:', batchError);
              }
              
              updateStep('images', { status: 'active', message: `Создано ${imagesGenerated}/${totalImages} иллюстраций` });
              
              // Small delay between batches for API stability
              if (i + batchSize < slidesToIllustrate.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
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
          updateStep('images', { status: 'completed', message: 'Иллюстрации пропущены из-за ошибки' });
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

      // Apply selected design system and generated title to the course
      const courseUpdate: Record<string, any> = {};
      if (courseData.title) {
        courseUpdate.title = courseData.title;
      }
      if (courseData.description) {
        courseUpdate.description = courseData.description;
      }
      if (selectedDesignConfig && selectedDesignSystemId) {
        courseUpdate.design_system = JSON.parse(JSON.stringify(selectedDesignConfig));
        courseUpdate.base_design_system_id = selectedDesignSystemId;
      }
      if (Object.keys(courseUpdate).length > 0) {
        try {
          await supabase
            .from('courses')
            .update(courseUpdate)
            .eq('id', courseId);
        } catch (e) {
          console.error('Failed to update course:', e);
        }
      }

      completeGeneration(lessons);
      isGeneratingRef.current = false;

    } catch (err) {
      isGeneratingRef.current = false;
      
      if ((err as Error).message === 'CANCELLED') return;
      
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
    }
  }, [courseId, startGeneration, updateStep, setSteps, setError, completeGeneration, abortController, designSystem]);

  return { runGeneration };
};

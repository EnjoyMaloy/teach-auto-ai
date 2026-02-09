import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, Loader2, Gauge, Palette, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCourse } = useCourses();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  const userName = 'Павел';

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !user) return;

    setIsGenerating(true);
    setGenerationStatus('Создаю курс...');

    try {
      // 1. Create a new course
      const course = await createCourse(prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''));
      if (!course) {
        throw new Error('Не удалось создать курс');
      }

      setGenerationStatus('Генерирую контент с помощью ИИ...');

      // 2. Call the AI generation function
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          userMessage: prompt,
          courseId: course.id,
          skipImages: true,
        },
      });

      if (error) {
        console.error('AI generation error:', error);
        throw new Error('Ошибка генерации контента');
      }

      // Parse the AI response - it returns {content: "JSON string"}
      let parsedData = data;
      if (data?.content && typeof data.content === 'string') {
        try {
          parsedData = JSON.parse(data.content);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          throw new Error('Ошибка парсинга ответа ИИ');
        }
      }

      if (parsedData?.lessons && Array.isArray(parsedData.lessons)) {
        // 3. Save generated lessons to database
        setGenerationStatus('Сохраняю уроки...');
        
        for (let i = 0; i < parsedData.lessons.length; i++) {
          const lesson = parsedData.lessons[i];
          
          // Create lesson
          const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .insert({
              course_id: course.id,
              title: lesson.title || `Урок ${i + 1}`,
              description: lesson.description || '',
              order: i,
            })
            .select()
            .single();

          if (lessonError) {
            console.error('Error creating lesson:', lessonError);
            continue;
          }

          // Create slides for this lesson
          if (lesson.slides && Array.isArray(lesson.slides)) {
            for (let j = 0; j < lesson.slides.length; j++) {
              const slide = lesson.slides[j];
              
              // Helper to strip HTML tags from text
              const stripHtml = (text: string | undefined): string => {
                if (!text) return '';
                return text.replace(/<[^>]*>/g, '').trim();
              };
              
              // Clean subBlocks from HTML tags
              const cleanSubBlocks = slide.subBlocks?.map((sb: any) => ({
                ...sb,
                content: stripHtml(sb.content),
              }));
              
              await supabase.from('slides').insert({
                lesson_id: lessonData.id,
                type: slide.type || 'info',
                order: j,
                content: stripHtml(slide.content),
                image_url: slide.imageUrl,
                options: slide.options ? slide.options.map((o: string, idx: number) => ({
                  id: `opt-${idx}`,
                  text: stripHtml(o),
                })) : null,
                correct_answer: slide.correctAnswer,
                explanation: stripHtml(slide.explanation),
                explanation_correct: stripHtml(slide.explanationCorrect),
                explanation_partial: stripHtml(slide.explanationPartial),
                blank_word: slide.blankWord,
                matching_pairs: slide.matchingPairs,
                ordering_items: slide.orderingItems,
                correct_order: slide.correctOrder,
                slider_min: slide.sliderMin,
                slider_max: slide.sliderMax,
                slider_correct: slide.sliderCorrect,
                slider_step: slide.sliderStep,
                sub_blocks: cleanSubBlocks,
              });
            }
          }
        }

        toast.success('Курс успешно создан!');
        navigate(`/editor/${course.id}`);
      } else {
        throw new Error('ИИ не вернул данные курса');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации курса');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  // Shared input card JSX
  const inputCardContent = (
    <>
      <div className="flex items-start gap-3 px-3 md:px-4 py-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опиши идею курса..."
          disabled={isGenerating}
          className="flex-1 bg-transparent text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40 resize-none outline-none text-[14px] md:text-[15px] min-h-[24px] max-h-[120px]"
          rows={1}
          style={{ height: 'auto' }}
          onInput={handleTextareaInput}
        />
      </div>
      
      {/* Generation status */}
      {isGenerating && generationStatus && (
        <div className="px-4 py-2 border-t border-border dark:border-white/5">
          <div className="flex items-center gap-2 text-muted-foreground dark:text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{generationStatus}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-t border-border dark:border-white/5">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Add attachment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  disabled
                  className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted dark:bg-white/5 flex items-center justify-center opacity-50 cursor-not-allowed hover:bg-muted/80 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground dark:text-white/30" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Прикрепить файл
              </TooltipContent>
            </Tooltip>

            {/* Options - hidden on mobile, show fewer items */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Difficulty selector */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    disabled
                    className="h-8 px-3 rounded-lg bg-muted dark:bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-muted/80 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground dark:text-white/30" />
                    <span className="text-[12px] text-muted-foreground dark:text-white/30">Сложность</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Скоро
                </TooltipContent>
              </Tooltip>

              {/* Design system selector */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    disabled
                    className="h-8 px-3 rounded-lg bg-muted dark:bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-muted/80 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-muted-foreground dark:text-white/30" />
                    <span className="text-[12px] text-muted-foreground dark:text-white/30">Дизайн</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Скоро
                </TooltipContent>
              </Tooltip>

              {/* Mascot selector */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    disabled
                    className="h-8 px-3 rounded-lg bg-muted dark:bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-muted/80 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground dark:text-white/30" />
                    <span className="text-[12px] text-muted-foreground dark:text-white/30">Маскот</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Скоро
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
            prompt.trim() && !isGenerating
              ? "bg-primary dark:bg-white text-primary-foreground dark:text-black hover:bg-primary/90 dark:hover:bg-white/90 cursor-pointer"
              : "bg-muted dark:bg-white/20 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-muted-foreground dark:text-black/50 animate-spin" />
          ) : (
            <ArrowUp className={cn(
              "w-4 h-4",
              prompt.trim() && !isGenerating 
                ? "text-primary-foreground dark:text-black" 
                : "text-muted-foreground dark:text-white/30"
            )} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Mobile top spacer for header */}
      <div className="h-16 md:hidden shrink-0" />
      
      {/* Content - centered accounting for sidebar */}
      <div 
        className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 md:px-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1rem)' }}
      >
        {/* Welcome Text - smaller on desktop */}
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold mb-6 md:mb-10 text-foreground dark:text-white text-center px-2">
          Чему научим мир сегодня, <span className="text-primary dark:animate-[name-glow_4s_ease-in-out_infinite]" style={{ color: 'hsl(var(--primary))' }}>{userName}</span>?
        </h1>

        {/* Desktop Action Card */}
        <div className="hidden md:block w-full max-w-[700px]">
          <div className="w-full rounded-2xl p-2 transition-all bg-card dark:bg-[#1a1a1b] border border-foreground/20 dark:border-white/[0.08] dark:shadow-2xl">
            {inputCardContent}
          </div>
        </div>
      </div>
      
      {/* Mobile bottom input bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-20">
        <div className="w-full rounded-2xl p-2 transition-all bg-card dark:bg-[#1a1a1b] border border-foreground/20 dark:border-white/[0.08] dark:shadow-2xl">
          {inputCardContent}
        </div>
      </div>
      
      {/* Mobile bottom spacer to prevent content from being hidden behind fixed input */}
      <div className="h-[120px] md:hidden shrink-0" />
    </div>
  );
};

export default Home;
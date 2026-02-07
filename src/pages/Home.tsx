import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, Loader2, Gauge, Palette, Bot } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/layout/AnimatedBackground';

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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0f0f12]">
      <AnimatedBackground />
      
      {/* Content - centered accounting for sidebar */}
      <div 
        className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 transition-all duration-200"
        style={{ paddingLeft: 'calc(var(--sidebar-offset, 0px) + 1.5rem)' }}
      >
        {/* Welcome Text */}
        <h1 className="text-4xl md:text-5xl font-semibold mb-10 text-white text-center">
          What's on your mind, <span className="animate-[name-glow_4s_ease-in-out_infinite]" style={{ color: 'hsl(265, 60%, 75%)' }}>{userName}</span>?
        </h1>

        {/* Action Card */}
        <div className="w-full max-w-2xl bg-[#1a1a1b] border border-white/[0.08] rounded-2xl p-2 shadow-2xl transition-all">
          <div className="flex items-start gap-3 px-4 py-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Опиши идею курса, который ты хочешь создать..."
              disabled={isGenerating}
              className="flex-1 bg-transparent text-white placeholder:text-white/40 resize-none outline-none text-[15px] min-h-[24px] max-h-[120px]"
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          
          {/* Generation status */}
          {isGenerating && generationStatus && (
            <div className="px-4 py-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStatus}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1.5">
                {/* Add attachment */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      disabled
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-50 cursor-not-allowed hover:bg-white/[0.08] transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white/30" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1a1a1b] border-white/10 text-white/70 text-xs">
                    Прикрепить файл
                  </TooltipContent>
                </Tooltip>

                {/* Difficulty selector */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      disabled
                      className="h-8 px-3 rounded-lg bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-white/[0.08] transition-colors"
                    >
                      <Gauge className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[12px] text-white/30">Сложность</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1a1a1b] border-white/10 text-white/70 text-xs">
                    Скоро
                  </TooltipContent>
                </Tooltip>

                {/* Design system selector */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      disabled
                      className="h-8 px-3 rounded-lg bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-white/[0.08] transition-colors"
                    >
                      <Palette className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[12px] text-white/30">Дизайн</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1a1a1b] border-white/10 text-white/70 text-xs">
                    Скоро
                  </TooltipContent>
                </Tooltip>

                {/* Mascot selector */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      disabled
                      className="h-8 px-3 rounded-lg bg-white/5 flex items-center gap-1.5 opacity-50 cursor-not-allowed hover:bg-white/[0.08] transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-[12px] text-white/30">Маскот</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#1a1a1b] border-white/10 text-white/70 text-xs">
                    Скоро
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                prompt.trim() && !isGenerating
                  ? "bg-white hover:bg-white/90 cursor-pointer"
                  : "bg-white/20 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 text-black/50 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 text-black" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

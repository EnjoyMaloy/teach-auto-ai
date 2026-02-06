import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Loader2 } from 'lucide-react';
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

      if (data?.lessons && Array.isArray(data.lessons)) {
        // 3. Save generated lessons to database
        setGenerationStatus('Сохраняю уроки...');
        
        for (let i = 0; i < data.lessons.length; i++) {
          const lesson = data.lessons[i];
          
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
              
              await supabase.from('slides').insert({
                lesson_id: lessonData.id,
                type: slide.type || 'info',
                order: j,
                content: slide.content || '',
                image_url: slide.imageUrl,
                options: slide.options ? slide.options.map((o: string, idx: number) => ({
                  id: `opt-${idx}`,
                  text: o,
                })) : null,
                correct_answer: slide.correctAnswer,
                explanation: slide.explanation,
                explanation_correct: slide.explanationCorrect,
                explanation_partial: slide.explanationPartial,
                blank_word: slide.blankWord,
                matching_pairs: slide.matchingPairs,
                ordering_items: slide.orderingItems,
                correct_order: slide.correctOrder,
                slider_min: slide.sliderMin,
                slider_max: slide.sliderMax,
                slider_correct: slide.sliderCorrect,
                slider_step: slide.sliderStep,
                sub_blocks: slide.subBlocks,
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
      {/* Gradient Background - Soft pastel purple tones */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 100%, hsl(270 40% 35% / 0.35), transparent 55%),
            radial-gradient(ellipse 80% 60% at 30% 90%, hsl(280 35% 40% / 0.25), transparent 50%),
            radial-gradient(ellipse 100% 70% at 70% 95%, hsl(260 35% 45% / 0.3), transparent 55%),
            radial-gradient(ellipse 60% 50% at 50% 60%, hsl(250 30% 45% / 0.2), transparent 45%),
            radial-gradient(ellipse 80% 40% at 20% 40%, hsl(243 30% 48% / 0.15), transparent 40%),
            radial-gradient(ellipse 70% 50% at 80% 30%, hsl(265 25% 40% / 0.15), transparent 45%),
            linear-gradient(180deg, #0f0f12 0%, #0f0f12 100%)
          `
        }}
      />
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Welcome Text */}
        <h1 className="text-4xl md:text-5xl font-semibold mb-10 text-white text-center">
          What's on your mind, <span className="text-[hsl(265,60%,75%)]">{userName}</span>?
        </h1>

        {/* Action Card */}
        <div className="w-full max-w-2xl bg-[#1a1a1b] border border-white/10 rounded-2xl p-2 shadow-2xl transition-all">
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
            <div className="flex items-center gap-2">
              <button 
                disabled
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                prompt.trim() && !isGenerating
                  ? "bg-primary hover:bg-primary/90 cursor-pointer"
                  : "bg-white/10 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

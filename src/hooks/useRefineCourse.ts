import { useState, useCallback } from 'react';
import { Lesson, Slide } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedSubBlock {
  type: string;
  order: number;
  content?: string;
  textAlign?: string;
  textSize?: string;
  fontWeight?: string;
  badges?: { id: string; text: string; iconType: string; iconValue?: string }[];
  badgeVariant?: string;
  badgeSize?: string;
  badgeLayout?: string;
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
  buttonLabel?: string;
  buttonUrl?: string;
  buttonVariant?: string;
}

interface GeneratedSlide {
  type: string;
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

/** Convert AI-generated lessons to the app's Lesson[] format */
const convertToLessons = (generated: GeneratedLesson[], courseId: string): Lesson[] => {
  return generated.map((genLesson, lessonIndex) => {
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
        badgeVariant: sb.badgeVariant as any,
        badgeSize: sb.badgeSize as any,
        badges: sb.badges?.map(b => ({
          ...b,
          id: crypto.randomUUID(),
          iconType: (b.iconType || 'none') as 'none' | 'emoji' | 'lucide' | 'custom',
        })),
        badgeLayout: sb.badgeLayout as any,
        imageUrl: sb.imageUrl,
        imageDescription: sb.imageDescription,
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
        buttonLabel: sb.buttonLabel,
        buttonUrl: sb.buttonUrl,
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
      } as Slide;
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
};

/** Compress Lesson[] to a lighter format for sending to the edge function */
const compressLessons = (lessons: Lesson[]) => {
  return lessons.map(lesson => ({
    title: lesson.title,
    description: lesson.description,
    slides: lesson.slides.map(slide => {
      const s: any = { type: slide.type, content: slide.content };
      if (slide.options) s.options = slide.options.map((o: any) => typeof o === 'string' ? o : o.text);
      if (slide.correctAnswer !== undefined) s.correctAnswer = slide.correctAnswer;
      if (slide.explanation) s.explanation = slide.explanation;
      if (slide.explanationCorrect) s.explanationCorrect = slide.explanationCorrect;
      if (slide.explanationPartial) s.explanationPartial = slide.explanationPartial;
      if (slide.blankWord) s.blankWord = slide.blankWord;
      if (slide.matchingPairs) s.matchingPairs = slide.matchingPairs;
      if (slide.orderingItems) s.orderingItems = slide.orderingItems;
      if (slide.correctOrder) s.correctOrder = slide.correctOrder;
      if (slide.sliderMin !== undefined) {
        s.sliderMin = slide.sliderMin;
        s.sliderMax = slide.sliderMax;
        s.sliderCorrect = slide.sliderCorrect;
        s.sliderStep = slide.sliderStep;
      }
      if (slide.subBlocks) {
        s.subBlocks = (slide.subBlocks as any[]).map((sb: any) => {
          const block: any = { type: sb.type, order: sb.order };
          if (sb.content) block.content = sb.content;
          if (sb.textAlign) block.textAlign = sb.textAlign;
          if (sb.textSize) block.textSize = sb.textSize;
          if (sb.fontWeight) block.fontWeight = sb.fontWeight;
          if (sb.badges) block.badges = sb.badges;
          if (sb.badgeVariant) block.badgeVariant = sb.badgeVariant;
          if (sb.badgeSize) block.badgeSize = sb.badgeSize;
          if (sb.badgeLayout) block.badgeLayout = sb.badgeLayout;
          if (sb.imageDescription) block.imageDescription = sb.imageDescription;
          if (sb.imageSize) block.imageSize = sb.imageSize;
          if (sb.backdrop && sb.backdrop !== 'none') block.backdrop = sb.backdrop;
          if (sb.backdropRounded) block.backdropRounded = sb.backdropRounded;
          if (sb.highlight && sb.highlight !== 'none') block.highlight = sb.highlight;
          if (sb.padding && sb.padding !== 'none') block.padding = sb.padding;
          if (sb.dividerStyle) block.dividerStyle = sb.dividerStyle;
          if (sb.tableData) block.tableData = sb.tableData;
          if (sb.tableStyle) block.tableStyle = sb.tableStyle;
          if (sb.buttonLabel) block.buttonLabel = sb.buttonLabel;
          if (sb.buttonUrl) block.buttonUrl = sb.buttonUrl;
          if (sb.buttonVariant) block.buttonVariant = sb.buttonVariant;
          return block;
        });
      }
      return s;
    }),
  }));
};

export const useRefineCourse = (courseId: string) => {
  const [isRefining, setIsRefining] = useState(false);

  const refineCourse = useCallback(async (
    prompt: string,
    currentLessons: Lesson[],
    conversationHistory?: { role: string; content: string }[],
  ): Promise<{ lessons: Lesson[]; message: string } | null> => {
    if (!prompt.trim() || isRefining) return null;

    setIsRefining(true);
    try {
      const response = await supabase.functions.invoke('refine-course', {
        body: {
          message: prompt,
          lessons: compressLessons(currentLessons),
          conversationHistory,
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (!data?.lessons || !Array.isArray(data.lessons) || data.lessons.length === 0) {
        throw new Error('ИИ вернул пустой результат');
      }

      const lessons = convertToLessons(data.lessons, courseId);
      return { lessons, message: data.message || 'Курс обновлён' };
    } catch (error) {
      console.error('Refine course error:', error);
      throw error;
    } finally {
      setIsRefining(false);
    }
  }, [courseId, isRefining]);

  return { refineCourse, isRefining };
};

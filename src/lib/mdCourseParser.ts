/**
 * MD Course Parser
 * 
 * Parses free-format Markdown into course lessons and slides.
 * 
 * Format conventions:
 * - `# Title` → course title (first h1)
 * - `## Lesson title` → new lesson
 * - `---` → new block/slide within a lesson
 * - Regular paragraphs → design blocks with text sub-blocks
 * - `### Heading` → heading sub-block within a design block
 * - `![description]()` or `![description](url)` → image sub-block
 * - Lines starting with `[badge] text` → badge sub-blocks
 * 
 * Quiz blocks (between ---):
 * - `> quiz: single_choice` or `> quiz: multiple_choice` etc.
 * - `? Question text` → question
 * - `+ Correct answer` → correct option
 * - `- Wrong answer` → wrong option
 * - `! Explanation` → explanation
 * 
 * Example:
 * ```md
 * # My Course
 * 
 * ## Introduction
 * 
 * ### Welcome!
 * 
 * This is the first lesson about something cool.
 * 
 * ![A colorful illustration of learning](
 * 
 * ---
 * 
 * ### Key Concept
 * 
 * Here is an important concept to understand.
 * 
 * Another paragraph about this concept.
 * 
 * ---
 * 
 * > quiz: single_choice
 * ? What is the key concept about?
 * + The correct answer
 * - Wrong answer 1
 * - Wrong answer 2
 * - Wrong answer 3
 * ! This is correct because...
 * ```
 */

import { Lesson, Slide } from '@/types/course';

interface ParsedCourse {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface SubBlock {
  id: string;
  type: string;
  order: number;
  content?: string;
  textAlign?: string;
  textSize?: string;
  fontWeight?: string;
  backdrop?: string;
  backdropRounded?: boolean;
  highlight?: string;
  padding?: string;
  imageDescription?: string;
  imageSize?: string;
  badges?: Array<{ id: string; text: string; iconType: string; iconValue?: string }>;
  badgeVariant?: string;
  badgeLayout?: string;
  badgeSize?: string;
  [key: string]: any;
}

type QuizType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering';

const QUIZ_TYPES: string[] = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering'];

let idCounter = 0;
function genId(): string {
  return crypto.randomUUID();
}

function parseQuizBlock(lines: string[]): Partial<Slide> | null {
  const typeLine = lines.find(l => l.trim().startsWith('> quiz:'));
  if (!typeLine) return null;

  const quizType = typeLine.replace('> quiz:', '').trim() as QuizType;
  if (!QUIZ_TYPES.includes(quizType)) return null;

  const questionLine = lines.find(l => l.trim().startsWith('?'));
  const question = questionLine ? questionLine.trim().slice(1).trim() : '';

  const explanationLine = lines.find(l => l.trim().startsWith('!'));
  const explanation = explanationLine ? explanationLine.trim().slice(1).trim() : '';

  // Parse options (+ for correct, - for wrong)
  const optionLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('+ ') || t.startsWith('- ');
  });

  const optionTexts = optionLines.map(l => l.trim().slice(2).trim());
  const correctTexts = optionLines
    .filter(l => l.trim().startsWith('+ '))
    .map(l => l.trim().slice(2).trim());

  // Build SlideOption[] 
  const options: Array<{ id: string; text: string; isCorrect: boolean }> = optionTexts.map((text, i) => ({
    id: String(i + 1),
    text,
    isCorrect: correctTexts.includes(text),
  }));

  if (quizType === 'true_false') {
    return {
      type: 'true_false' as any,
      content: question,
      options: [
        { id: '1', text: 'Верно', isCorrect: correctTexts[0] === 'true' || correctTexts[0] === 'Верно' },
        { id: '2', text: 'Неверно', isCorrect: correctTexts[0] === 'false' || correctTexts[0] === 'Неверно' },
      ],
      correctAnswer: correctTexts[0] === 'true' || correctTexts[0] === 'Верно' ? 'Верно' : 'Неверно',
      explanation,
    };
  }

  if (quizType === 'fill_blank') {
    const blankWord = correctOptions[0] || '';
    return {
      type: 'fill_blank' as any,
      content: question,
      blankWord,
      explanation,
    };
  }

  if (quizType === 'matching') {
    // Parse matching pairs from lines like: `= Left | Right`
    const pairLines = lines.filter(l => l.trim().startsWith('='));
    const matchingPairs = pairLines.map((l, i) => {
      const parts = l.trim().slice(1).split('|').map(s => s.trim());
      return { id: String(i + 1), left: parts[0] || '', right: parts[1] || '' };
    });
    return {
      type: 'matching' as any,
      content: question,
      matchingPairs,
      explanation,
    };
  }

  if (quizType === 'ordering') {
    // Items in correct order marked with numbers: `1. First`, `2. Second`
    const orderLines = lines.filter(l => /^\s*\d+\.\s/.test(l));
    const orderingItems = orderLines.map((l, i) => ({
      id: String(i + 1),
      text: l.trim().replace(/^\d+\.\s*/, ''),
    }));
    const correctOrder = orderingItems.map(item => item.id);
    return {
      type: 'ordering' as any,
      content: question,
      orderingItems,
      correctOrder,
      explanation,
    };
  }

  // single_choice or multiple_choice
  const correctAnswer = quizType === 'multiple_choice' ? correctOptions : correctOptions[0] || '';

  return {
    type: quizType as any,
    content: question,
    options,
    correctAnswer: correctAnswer as any,
    explanation,
    explanationCorrect: explanation ? `Правильно! ${explanation}` : undefined,
  };
}

function parseDesignBlock(lines: string[]): SubBlock[] {
  const subBlocks: SubBlock[] = [];
  let order = 1;

  // Collect badge lines
  const badgeLines: string[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[badge]') || trimmed.startsWith('[бейдж]')) {
      badgeLines.push(trimmed.replace(/^\[(badge|бейдж)\]\s*/, ''));
    } else {
      contentLines.push(trimmed);
    }
  }

  // Process badge lines first
  if (badgeLines.length > 0) {
    subBlocks.push({
      id: genId(),
      type: 'badge',
      order: order++,
      badges: badgeLines.map((text, i) => ({
        id: String(i + 1),
        text,
        iconType: 'lucide',
        iconValue: 'Star',
      })),
      badgeVariant: 'oval',
      badgeLayout: 'horizontal',
      badgeSize: 'medium',
      textAlign: 'center',
      padding: 'small',
    });
  }

  for (const trimmed of contentLines) {
    // Heading (### in block context)
    if (trimmed.startsWith('### ')) {
      subBlocks.push({
        id: genId(),
        type: 'heading',
        order: order++,
        content: trimmed.slice(4).trim(),
        textAlign: 'center',
        textSize: 'xlarge',
        fontWeight: 'bold',
        padding: 'small',
      });
      continue;
    }

    // Image: ![description](url) or ![description]()
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]*)\)/);
    if (imageMatch) {
      subBlocks.push({
        id: genId(),
        type: 'image',
        order: order++,
        imageDescription: imageMatch[1] || 'An illustration',
        imageUrl: imageMatch[2] || undefined,
        imageSize: 'medium',
        textAlign: 'center',
        padding: 'small',
      });
      continue;
    }

    // Bold heading-like line (short bold text)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60) {
      subBlocks.push({
        id: genId(),
        type: 'heading',
        order: order++,
        content: trimmed.slice(2, -2),
        textAlign: 'left',
        textSize: 'large',
        fontWeight: 'bold',
        padding: 'small',
      });
      continue;
    }

    // Regular text paragraph
    if (trimmed.length > 0) {
      // Convert basic markdown formatting to HTML
      let content = trimmed
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/\*([^*]+)\*/g, '<i>$1</i>')
        .replace(/__([^_]+)__/g, '<b>$1</b>')
        .replace(/_([^_]+)_/g, '<i>$1</i>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/==([^=]+)==/g, '<mark>$1</mark>');

      // Determine visual styling based on content patterns
      let backdrop: string = 'none';
      let highlight: string = 'none';

      // Key definitions or important points get backdrop
      if (content.includes('<b>') || content.includes('<mark>')) {
        backdrop = 'light';
      }

      subBlocks.push({
        id: genId(),
        type: 'text',
        order: order++,
        content,
        textAlign: 'left',
        textSize: 'medium',
        fontWeight: 'normal',
        backdrop,
        backdropRounded: backdrop !== 'none',
        highlight,
        padding: 'small',
      });
    }
  }

  return subBlocks;
}

export function parseMdCourse(markdown: string): ParsedCourse {
  idCounter = 0;
  const lines = markdown.split('\n');

  let courseTitle = 'Импортированный курс';
  let courseDescription = '';
  const lessons: Lesson[] = [];

  let currentLessonLines: string[] = [];
  let currentLessonTitle = '';
  let inLesson = false;

  const flushLesson = () => {
    if (!currentLessonTitle && currentLessonLines.length === 0) return;

    const lessonId = genId();
    const slides = parseBlocksFromLines(currentLessonLines, lessonId);

    if (slides.length > 0 || currentLessonTitle) {
      lessons.push({
        id: lessonId,
        courseId: '',
        title: currentLessonTitle || `Урок ${lessons.length + 1}`,
        description: '',
        order: lessons.length + 1,
        slides,
        estimatedMinutes: Math.max(1, Math.ceil(slides.length * 0.5)),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    currentLessonLines = [];
    currentLessonTitle = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Course title (first # heading)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      if (courseTitle === 'Импортированный курс') {
        courseTitle = trimmed.slice(2).trim();
      }
      continue;
    }

    // Lesson heading
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushLesson();
      currentLessonTitle = trimmed.slice(3).trim();
      inLesson = true;
      continue;
    }

    if (inLesson) {
      currentLessonLines.push(line);
    }
  }

  // Flush last lesson
  flushLesson();

  // If no ## headings found, treat entire content as one lesson
  if (lessons.length === 0) {
    const allContentLines = lines.filter(l => {
      const t = l.trim();
      return !t.startsWith('# ') || t.startsWith('### ');
    });
    const lessonId = genId();
    const slides = parseBlocksFromLines(allContentLines, lessonId);
    if (slides.length > 0) {
      lessons.push({
        id: lessonId,
        courseId: '',
        title: 'Урок 1',
        description: '',
        order: 1,
        slides,
        estimatedMinutes: Math.max(1, Math.ceil(slides.length * 0.5)),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return { title: courseTitle, description: courseDescription, lessons };
}

function parseBlocksFromLines(lines: string[], lessonId: string): Slide[] {
  // Split by --- (horizontal rule) into block chunks
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    } else {
      currentChunk.push(line);
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  // If no --- separators, auto-split by headings or every ~5 paragraphs
  if (chunks.length <= 1 && lines.length > 10) {
    const autoChunks = autoSplitContent(lines);
    if (autoChunks.length > 1) {
      return autoChunks.flatMap((chunk, i) => parseChunkToSlide(chunk, lessonId, i));
    }
  }

  return chunks.flatMap((chunk, i) => parseChunkToSlide(chunk, lessonId, i));
}

function autoSplitContent(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Split on ### headings (new sub-section)
    if (trimmed.startsWith('### ') && current.some(l => l.trim().length > 0)) {
      chunks.push(current);
      current = [line];
      continue;
    }

    current.push(line);

    // Split if we have enough content lines (5+ non-empty paragraphs)
    const contentCount = current.filter(l => l.trim().length > 0 && !l.trim().startsWith('#')).length;
    if (contentCount >= 6) {
      chunks.push(current);
      current = [];
    }
  }

  if (current.some(l => l.trim().length > 0)) {
    chunks.push(current);
  }

  return chunks;
}

function parseChunkToSlide(chunk: string[], lessonId: string, index: number): Slide[] {
  const nonEmptyLines = chunk.filter(l => l.trim().length > 0);
  if (nonEmptyLines.length === 0) return [];

  // Check if this is a quiz block
  const hasQuizMarker = nonEmptyLines.some(l => l.trim().startsWith('> quiz:'));
  if (hasQuizMarker) {
    const quiz = parseQuizBlock(nonEmptyLines);
    if (quiz) {
      return [{
        id: genId(),
        lessonId,
        type: quiz.type || 'single_choice',
        order: index + 1,
        content: quiz.content || '',
        options: quiz.options,
        correctAnswer: quiz.correctAnswer,
        explanation: quiz.explanation,
        explanationCorrect: quiz.explanationCorrect,
        explanationPartial: quiz.explanationPartial,
        blankWord: quiz.blankWord,
        matchingPairs: quiz.matchingPairs,
        orderingItems: quiz.orderingItems,
        correctOrder: quiz.correctOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Slide];
    }
  }

  // Design block
  const subBlocks = parseDesignBlock(nonEmptyLines);
  if (subBlocks.length === 0) return [];

  return [{
    id: genId(),
    lessonId,
    type: 'design' as any,
    order: index + 1,
    content: '',
    subBlocks,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Slide];
}

-- Create published_lessons table (stores published version of lessons)
CREATE TABLE public.published_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  original_lesson_id UUID NOT NULL, -- Reference to the draft lesson
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 5,
  icon TEXT DEFAULT '📚',
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create published_slides table (stores published version of slides)
CREATE TABLE public.published_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  published_lesson_id UUID NOT NULL REFERENCES public.published_lessons(id) ON DELETE CASCADE,
  original_slide_id UUID NOT NULL, -- Reference to the draft slide
  type TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  options JSONB DEFAULT '[]',
  correct_answer JSONB,
  explanation TEXT,
  explanation_correct TEXT,
  explanation_partial TEXT,
  hints JSONB DEFAULT '[]',
  blank_word TEXT,
  matching_pairs JSONB DEFAULT '[]',
  slider_min INTEGER,
  slider_max INTEGER,
  slider_correct INTEGER,
  slider_step INTEGER DEFAULT 1,
  ordering_items JSONB DEFAULT '[]',
  correct_order JSONB DEFAULT '[]',
  sub_blocks JSONB,
  background_color TEXT,
  text_color TEXT,
  text_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT published_slides_type_check CHECK (
    type = ANY (ARRAY[
      'text', 'heading', 'image', 'video', 'audio', 'image_text', 'design',
      'single_choice', 'multiple_choice', 'true_false', 'fill_blank',
      'matching', 'ordering', 'slider', 'hotspot'
    ])
  )
);

-- Enable RLS
ALTER TABLE public.published_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_slides ENABLE ROW LEVEL SECURITY;

-- RLS policies for published_lessons
CREATE POLICY "Anyone can view published lessons of accessible courses" 
ON public.published_lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = published_lessons.course_id 
    AND (courses.is_published = true OR courses.is_link_accessible = true)
  )
);

CREATE POLICY "Authors can manage published lessons" 
ON public.published_lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = published_lessons.course_id 
    AND courses.author_id = auth.uid()
  )
);

-- RLS policies for published_slides
CREATE POLICY "Anyone can view published slides of accessible courses" 
ON public.published_slides FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM published_lessons pl
    JOIN courses c ON c.id = pl.course_id
    WHERE pl.id = published_slides.published_lesson_id
    AND (c.is_published = true OR c.is_link_accessible = true)
  )
);

CREATE POLICY "Authors can manage published slides" 
ON public.published_slides FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM published_lessons pl
    JOIN courses c ON c.id = pl.course_id
    WHERE pl.id = published_slides.published_lesson_id
    AND c.author_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_published_lessons_course_id ON public.published_lessons(course_id);
CREATE INDEX idx_published_slides_lesson_id ON public.published_slides(published_lesson_id);
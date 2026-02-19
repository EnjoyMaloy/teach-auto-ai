
-- Create table for persisting AI chat messages per course
CREATE TABLE public.course_ai_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'user' | 'assistant' | 'generation' | 'completion' | 'error'
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT NULL, -- steps, lessonCount, duration, etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast loading
CREATE INDEX idx_course_ai_messages_course_id ON public.course_ai_messages(course_id, created_at);

-- Enable RLS
ALTER TABLE public.course_ai_messages ENABLE ROW LEVEL SECURITY;

-- Authors can manage their own course messages
CREATE POLICY "Authors can manage AI messages"
ON public.course_ai_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_ai_messages.course_id
    AND courses.author_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_ai_messages.course_id
    AND courses.author_id = auth.uid()
  )
);

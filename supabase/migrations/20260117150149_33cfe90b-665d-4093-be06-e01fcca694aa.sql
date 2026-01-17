-- Add category column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

-- Create an index for faster category queries
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
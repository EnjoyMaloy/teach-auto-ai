-- Add design_system column to courses table
ALTER TABLE public.courses
ADD COLUMN design_system jsonb DEFAULT NULL;
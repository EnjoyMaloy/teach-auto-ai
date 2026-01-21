-- Add explanation_partial column to slides table for "almost correct" answers
ALTER TABLE public.slides 
ADD COLUMN IF NOT EXISTS explanation_partial TEXT;
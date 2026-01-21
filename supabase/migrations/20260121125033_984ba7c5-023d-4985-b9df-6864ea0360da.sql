-- Add explanation_correct column to slides table
ALTER TABLE public.slides 
ADD COLUMN IF NOT EXISTS explanation_correct TEXT;
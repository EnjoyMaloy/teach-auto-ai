-- Update slides table to support all new block types

-- First, drop the old type constraint
ALTER TABLE public.slides DROP CONSTRAINT IF EXISTS slides_type_check;

-- Add new columns for extended block types
ALTER TABLE public.slides 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS matching_pairs JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS hotspot_areas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS slider_min INTEGER,
ADD COLUMN IF NOT EXISTS slider_max INTEGER,
ADD COLUMN IF NOT EXISTS slider_correct INTEGER,
ADD COLUMN IF NOT EXISTS slider_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ordering_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS correct_order JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS background_color TEXT,
ADD COLUMN IF NOT EXISTS text_color TEXT;

-- Add new type constraint with all block types
ALTER TABLE public.slides 
ADD CONSTRAINT slides_type_check 
CHECK (type IN (
  -- Content blocks
  'text', 
  'heading',
  'image', 
  'video', 
  'audio',
  'image_text',
  -- Interactive blocks
  'single_choice', 
  'multiple_choice', 
  'true_false', 
  'fill_blank',
  'matching',
  'ordering',
  'slider',
  'hotspot'
));

-- Create index for faster queries by type
CREATE INDEX IF NOT EXISTS idx_slides_type ON public.slides(type);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_order ON public.slides(lesson_id, "order");
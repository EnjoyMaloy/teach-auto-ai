-- Add sub_blocks column for design blocks
ALTER TABLE public.slides 
ADD COLUMN sub_blocks JSONB DEFAULT NULL;

-- Add text_size column for text blocks
ALTER TABLE public.slides 
ADD COLUMN text_size TEXT DEFAULT NULL;
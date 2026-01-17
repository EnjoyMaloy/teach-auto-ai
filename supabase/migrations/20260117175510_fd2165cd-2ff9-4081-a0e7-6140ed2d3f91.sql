-- Add lessons display type to courses table
-- This controls how lessons are displayed in the player: as duolingo-style circles or simple list
ALTER TABLE public.courses 
ADD COLUMN lessons_display_type text NOT NULL DEFAULT 'circle_map';

-- Add icon/emoji and cover image to lessons for better visual representation
ALTER TABLE public.lessons
ADD COLUMN icon text DEFAULT '📚',
ADD COLUMN cover_image text;
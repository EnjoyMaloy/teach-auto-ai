-- Add moderation fields to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS is_link_accessible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS moderation_comment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS submitted_for_moderation_at timestamp with time zone DEFAULT NULL;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_courses_moderation_status ON public.courses(moderation_status);

-- Update RLS policy for courses to allow viewing link-accessible courses
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;

CREATE POLICY "Users can view accessible courses" 
ON public.courses 
FOR SELECT 
USING (is_published = true OR is_link_accessible = true);

-- Create policy for moderators to view pending courses
CREATE POLICY "Moderators can view pending courses" 
ON public.courses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('moderator', 'admin')
  )
);

-- Create policy for moderators to update moderation fields
CREATE POLICY "Moderators can update moderation status" 
ON public.courses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('moderator', 'admin')
  )
);

-- Allow moderators to view all profiles for moderation purposes
CREATE POLICY "Moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('moderator', 'admin')
  )
);
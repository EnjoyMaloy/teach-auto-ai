-- Fix RLS policy for anonymous access to published/link-accessible courses
-- Change from RESTRICTIVE to PERMISSIVE

DROP POLICY IF EXISTS "Users can view accessible courses" ON public.courses;

CREATE POLICY "Anyone can view accessible courses" 
ON public.courses 
FOR SELECT 
TO anon, authenticated
USING (is_published = true OR is_link_accessible = true);

-- Also fix lessons policy for anonymous users
DROP POLICY IF EXISTS "Users can view lessons of their courses" ON public.lessons;

CREATE POLICY "Anyone can view lessons of accessible courses" 
ON public.lessons 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND (courses.is_published = true OR courses.is_link_accessible = true OR courses.author_id = auth.uid())
  )
);

-- Also fix slides policy for anonymous users
DROP POLICY IF EXISTS "Users can view slides of accessible lessons" ON public.slides;

CREATE POLICY "Anyone can view slides of accessible lessons" 
ON public.slides 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM lessons
    JOIN courses ON courses.id = lessons.course_id
    WHERE lessons.id = slides.lesson_id 
    AND (courses.is_published = true OR courses.is_link_accessible = true OR courses.author_id = auth.uid())
  )
);
-- Fix RLS policies for published_lessons - make them PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view published lessons of accessible courses" ON public.published_lessons;
DROP POLICY IF EXISTS "Authors can manage published lessons" ON public.published_lessons;

CREATE POLICY "Anyone can view published lessons of accessible courses" 
ON public.published_lessons 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = published_lessons.course_id 
    AND (courses.is_published = true OR courses.is_link_accessible = true)
  )
);

CREATE POLICY "Authors can manage published lessons" 
ON public.published_lessons 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = published_lessons.course_id 
    AND courses.author_id = auth.uid()
  )
);

-- Fix RLS policies for published_slides - make them PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view published slides of accessible courses" ON public.published_slides;
DROP POLICY IF EXISTS "Authors can manage published slides" ON public.published_slides;

CREATE POLICY "Anyone can view published slides of accessible courses" 
ON public.published_slides 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 FROM published_lessons pl
    JOIN courses c ON c.id = pl.course_id
    WHERE pl.id = published_slides.published_lesson_id 
    AND (c.is_published = true OR c.is_link_accessible = true)
  )
);

CREATE POLICY "Authors can manage published slides" 
ON public.published_slides 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM published_lessons pl
    JOIN courses c ON c.id = pl.course_id
    WHERE pl.id = published_slides.published_lesson_id 
    AND c.author_id = auth.uid()
  )
);

-- Also fix courses table policies that might be restrictive
DROP POLICY IF EXISTS "Anyone can view accessible courses" ON public.courses;

CREATE POLICY "Anyone can view accessible courses" 
ON public.courses 
FOR SELECT 
TO public
USING ((is_published = true) OR (is_link_accessible = true));
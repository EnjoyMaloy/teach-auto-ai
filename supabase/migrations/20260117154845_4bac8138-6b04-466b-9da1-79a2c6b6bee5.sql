-- Fix profiles table: block anonymous access completely
-- The current policy allows only viewing own profile, but we need to ensure
-- that anonymous users (not logged in) cannot access any profiles

-- First, let's make the existing policy PERMISSIVE instead of RESTRICTIVE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Fix course_reviews: require authentication for viewing reviews
DROP POLICY IF EXISTS "Anyone can view published course reviews" ON public.course_reviews;

CREATE POLICY "Authenticated users can view published course reviews" 
ON public.course_reviews 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_reviews.course_id 
    AND (courses.is_published = true OR courses.author_id = auth.uid())
  )
);
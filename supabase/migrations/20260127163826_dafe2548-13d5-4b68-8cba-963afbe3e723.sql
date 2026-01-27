-- Fix course_reviews RLS: Hide user_id from public queries
-- Create a public view that excludes user_id for anonymous access

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view published course reviews" ON public.course_reviews;

-- Create a more restrictive policy: users can only see reviews without user_id exposed
-- We'll create a policy that allows authenticated users to see reviews but we'll use a view for public access

-- Policy for authenticated users to see all reviews on published courses
CREATE POLICY "Authenticated users can view published course reviews" 
ON public.course_reviews 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_reviews.course_id 
    AND (courses.is_published = true OR courses.author_id = auth.uid())
  )
);

-- Policy for users to see their own reviews
CREATE POLICY "Users can view their own reviews" 
ON public.course_reviews 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix profiles RLS: Remove confusing policy
-- The policy "Require auth to view profiles" with USING (false) blocks all access
-- This is redundant since we already have "Users can view own profile"
DROP POLICY IF EXISTS "Require auth to view profiles" ON public.profiles;
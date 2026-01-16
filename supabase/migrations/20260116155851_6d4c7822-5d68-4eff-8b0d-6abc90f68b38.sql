-- Fix permissive RLS policy for course_analytics
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.course_analytics;

CREATE POLICY "Authenticated users can insert analytics"
  ON public.course_analytics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
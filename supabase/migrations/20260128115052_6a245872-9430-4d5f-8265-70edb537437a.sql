-- Fix course_reviews SELECT policy to only show reviews for published courses or user's own reviews
DROP POLICY IF EXISTS "Authenticated users can view published course reviews" ON public.course_reviews;

CREATE POLICY "Users can view reviews of published courses" 
ON public.course_reviews 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_reviews.course_id 
    AND courses.is_published = true
  )
);

-- Fix storage policies for course-videos bucket - require owner folder structure
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their videos" ON storage.objects;

CREATE POLICY "Users can upload their own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix storage policies for course-audio bucket - require owner folder structure
DROP POLICY IF EXISTS "Users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their audio" ON storage.objects;

CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-audio' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-audio' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-audio' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
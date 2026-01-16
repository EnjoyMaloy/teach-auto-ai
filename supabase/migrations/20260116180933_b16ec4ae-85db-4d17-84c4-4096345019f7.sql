-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos', 
  'course-videos', 
  true,
  524288000, -- 500MB max file size
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
);

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-videos');

-- Allow authenticated users to update their videos
CREATE POLICY "Users can update their videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-videos');

-- Allow authenticated users to delete their videos
CREATE POLICY "Users can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-videos');

-- Allow public read access to videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-videos');
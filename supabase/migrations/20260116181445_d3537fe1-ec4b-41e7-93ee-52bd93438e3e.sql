-- Create storage bucket for course audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-audio', 
  'course-audio', 
  true,
  52428800, -- 50MB max file size
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a']
);

-- Allow authenticated users to upload audio
CREATE POLICY "Users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-audio');

-- Allow authenticated users to update their audio
CREATE POLICY "Users can update their audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-audio');

-- Allow authenticated users to delete their audio
CREATE POLICY "Users can delete their audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-audio');

-- Allow public read access to audio
CREATE POLICY "Public can view audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-audio');
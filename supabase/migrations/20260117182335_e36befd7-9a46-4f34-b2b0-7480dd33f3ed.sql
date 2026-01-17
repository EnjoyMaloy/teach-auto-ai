-- Create storage bucket for generated course images
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their folder
CREATE POLICY "Users can upload generated images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images' 
  AND (storage.foldername(name))[1] = 'generated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access for course images
CREATE POLICY "Public read access for course images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'generated'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
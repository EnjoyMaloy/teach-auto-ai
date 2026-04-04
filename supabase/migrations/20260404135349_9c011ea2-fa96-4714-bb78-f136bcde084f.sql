
-- Allow authenticated users to upload article covers
CREATE POLICY "Users can upload article covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'article-covers'
);

-- Allow authenticated users to update/overwrite their article covers
CREATE POLICY "Users can update article covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'article-covers'
);

-- Allow public read access to article covers
CREATE POLICY "Anyone can view article covers"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'article-covers'
);

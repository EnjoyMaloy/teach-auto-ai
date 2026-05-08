
CREATE POLICY "Users can upload team avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'team-avatars'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update team avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'team-avatars'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete team avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images'
  AND (storage.foldername(name))[1] = 'team-avatars'
  AND auth.uid() IS NOT NULL
);

-- Update course-audio bucket to include audio/mp4 MIME type for m4a files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4']
WHERE id = 'course-audio';
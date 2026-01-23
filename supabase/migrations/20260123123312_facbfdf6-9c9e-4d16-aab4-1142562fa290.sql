-- Create storage bucket for mascot files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mascots', 'mascots', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for mascot uploads
CREATE POLICY "Users can upload their own mascots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'mascots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Mascots are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mascots');

CREATE POLICY "Users can update their mascots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'mascots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their mascots" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'mascots' AND auth.uid() IS NOT NULL);
-- Create storage bucket for course banners
INSERT INTO storage.buckets (id, name, public) VALUES ('course-banners', 'course-banners', true);

-- Create storage policies for course banners
CREATE POLICY "Anyone can view course banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-banners');

CREATE POLICY "Users can upload their own course banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own course banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own course banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create course analytics table
CREATE TABLE public.course_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES public.slides(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'complete', 'drop_off', 'answer_correct', 'answer_incorrect')),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course owners can view analytics"
  ON public.course_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_analytics.course_id
      AND courses.author_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON public.course_analytics FOR INSERT
  WITH CHECK (true);

-- Create index for faster analytics queries
CREATE INDEX idx_course_analytics_course_id ON public.course_analytics(course_id);
CREATE INDEX idx_course_analytics_slide_id ON public.course_analytics(slide_id);

-- Create course reviews table
CREATE TABLE public.course_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  ai_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published course reviews"
  ON public.course_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_reviews.course_id
      AND (courses.is_published = true OR courses.author_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert reviews"
  ON public.course_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Course owners can update AI recommendations"
  ON public.course_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_reviews.course_id
      AND courses.author_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_course_reviews_updated_at
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add short_description to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS short_description TEXT DEFAULT '';
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'learner', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  target_audience TEXT DEFAULT '',
  estimated_minutes INTEGER DEFAULT 0,
  current_version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own courses" 
  ON public.courses FOR SELECT 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can view published courses" 
  ON public.courses FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Users can insert their own courses" 
  ON public.courses FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own courses" 
  ON public.courses FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own courses" 
  ON public.courses FOR DELETE 
  USING (auth.uid() = author_id);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of their courses" 
  ON public.lessons FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = lessons.course_id 
      AND (courses.author_id = auth.uid() OR courses.is_published = true)
    )
  );

CREATE POLICY "Users can insert lessons to their courses" 
  ON public.lessons FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_id 
      AND courses.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lessons of their courses" 
  ON public.lessons FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = lessons.course_id 
      AND courses.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lessons of their courses" 
  ON public.lessons FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = lessons.course_id 
      AND courses.author_id = auth.uid()
    )
  );

-- Create slides table
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image_text', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank')),
  "order" INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  options JSONB DEFAULT '[]',
  correct_answer JSONB,
  explanation TEXT,
  hints JSONB DEFAULT '[]',
  blank_word TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view slides of accessible lessons" 
  ON public.slides FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = slides.lesson_id 
      AND (courses.author_id = auth.uid() OR courses.is_published = true)
    )
  );

CREATE POLICY "Users can insert slides to their lessons" 
  ON public.slides FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = lesson_id 
      AND courses.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update slides of their lessons" 
  ON public.slides FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = slides.lesson_id 
      AND courses.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete slides of their lessons" 
  ON public.slides FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.courses ON courses.id = lessons.course_id
      WHERE lessons.id = slides.lesson_id 
      AND courses.author_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
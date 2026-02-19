
-- 1. course_languages
CREATE TABLE public.course_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, language_code)
);

ALTER TABLE public.course_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage course languages"
  ON public.course_languages FOR ALL
  USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_languages.course_id AND courses.author_id = auth.uid()));

CREATE POLICY "Anyone can view languages of accessible courses"
  ON public.course_languages FOR SELECT
  USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_languages.course_id AND (courses.is_published = true OR courses.is_link_accessible = true)));

-- 2. lesson_translations
CREATE TABLE public.lesson_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, language_code)
);

ALTER TABLE public.lesson_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage lesson translations"
  ON public.lesson_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_translations.lesson_id AND courses.author_id = auth.uid()));

CREATE POLICY "Anyone can view lesson translations of accessible courses"
  ON public.lesson_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_translations.lesson_id AND (courses.is_published = true OR courses.is_link_accessible = true OR courses.author_id = auth.uid())));

-- 3. slide_translations
CREATE TABLE public.slide_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id uuid NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  content text,
  options jsonb,
  explanation text,
  explanation_correct text,
  explanation_partial text,
  hints jsonb,
  blank_word text,
  matching_pairs jsonb,
  ordering_items jsonb,
  sub_blocks jsonb,
  is_stale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slide_id, language_code)
);

ALTER TABLE public.slide_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage slide translations"
  ON public.slide_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM slides JOIN lessons ON lessons.id = slides.lesson_id JOIN courses ON courses.id = lessons.course_id WHERE slides.id = slide_translations.slide_id AND courses.author_id = auth.uid()));

CREATE POLICY "Anyone can view slide translations of accessible courses"
  ON public.slide_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM slides JOIN lessons ON lessons.id = slides.lesson_id JOIN courses ON courses.id = lessons.course_id WHERE slides.id = slide_translations.slide_id AND (courses.is_published = true OR courses.is_link_accessible = true OR courses.author_id = auth.uid())));

-- 4. published_lesson_translations
CREATE TABLE public.published_lesson_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_lesson_id uuid NOT NULL REFERENCES public.published_lessons(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(published_lesson_id, language_code)
);

ALTER TABLE public.published_lesson_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage published lesson translations"
  ON public.published_lesson_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM published_lessons JOIN courses ON courses.id = published_lessons.course_id WHERE published_lessons.id = published_lesson_translations.published_lesson_id AND courses.author_id = auth.uid()));

CREATE POLICY "Anyone can view published lesson translations of accessible courses"
  ON public.published_lesson_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM published_lessons JOIN courses ON courses.id = published_lessons.course_id WHERE published_lessons.id = published_lesson_translations.published_lesson_id AND (courses.is_published = true OR courses.is_link_accessible = true)));

-- 5. published_slide_translations
CREATE TABLE public.published_slide_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  published_slide_id uuid NOT NULL REFERENCES public.published_slides(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  content text,
  options jsonb,
  explanation text,
  explanation_correct text,
  explanation_partial text,
  hints jsonb,
  blank_word text,
  matching_pairs jsonb,
  ordering_items jsonb,
  sub_blocks jsonb,
  is_stale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(published_slide_id, language_code)
);

ALTER TABLE public.published_slide_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can manage published slide translations"
  ON public.published_slide_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM published_slides JOIN published_lessons ON published_lessons.id = published_slides.published_lesson_id JOIN courses ON courses.id = published_lessons.course_id WHERE published_slides.id = published_slide_translations.published_slide_id AND courses.author_id = auth.uid()));

CREATE POLICY "Anyone can view published slide translations of accessible courses"
  ON public.published_slide_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM published_slides JOIN published_lessons ON published_lessons.id = published_slides.published_lesson_id JOIN courses ON courses.id = published_lessons.course_id WHERE published_slides.id = published_slide_translations.published_slide_id AND (courses.is_published = true OR courses.is_link_accessible = true)));

-- 6. Triggers for updated_at
CREATE TRIGGER update_lesson_translations_updated_at BEFORE UPDATE ON public.lesson_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_slide_translations_updated_at BEFORE UPDATE ON public.slide_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_published_lesson_translations_updated_at BEFORE UPDATE ON public.published_lesson_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_published_slide_translations_updated_at BEFORE UPDATE ON public.published_slide_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

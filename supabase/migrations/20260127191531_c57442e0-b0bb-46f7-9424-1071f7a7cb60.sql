-- Dictionary words table
CREATE TABLE public.dictionary_words (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    term text NOT NULL UNIQUE,
    definition text NOT NULL,
    category text NOT NULL DEFAULT 'crypto',
    image_url text,
    difficulty_easy_content jsonb,
    difficulty_medium_content jsonb,
    difficulty_hard_content jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User word progress table
CREATE TABLE public.user_word_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    word_id uuid REFERENCES public.dictionary_words(id) ON DELETE CASCADE NOT NULL,
    easy_completed boolean DEFAULT false,
    medium_completed boolean DEFAULT false,
    hard_completed boolean DEFAULT false,
    last_studied_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, word_id)
);

-- Enable RLS
ALTER TABLE public.dictionary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;

-- Dictionary words policies (public read, admin write)
CREATE POLICY "Anyone can view dictionary words"
ON public.dictionary_words
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage dictionary words"
ON public.dictionary_words
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'moderator')
));

-- User progress policies
CREATE POLICY "Users can view their own progress"
ON public.user_word_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_word_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_word_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_dictionary_words_updated_at
BEFORE UPDATE ON public.dictionary_words
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_word_progress_updated_at
BEFORE UPDATE ON public.user_word_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
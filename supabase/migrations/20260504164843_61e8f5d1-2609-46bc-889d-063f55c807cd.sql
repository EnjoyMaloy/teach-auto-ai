CREATE TABLE public.user_favorite_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.user_favorite_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own article favorites"
ON public.user_favorite_articles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own article favorites"
ON public.user_favorite_articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own article favorites"
ON public.user_favorite_articles FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_user_favorite_articles_user ON public.user_favorite_articles(user_id);
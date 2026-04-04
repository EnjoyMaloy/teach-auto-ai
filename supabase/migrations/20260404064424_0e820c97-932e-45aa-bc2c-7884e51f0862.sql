ALTER TABLE public.slides DROP CONSTRAINT IF EXISTS slides_type_check;
ALTER TABLE public.slides
ADD CONSTRAINT slides_type_check
CHECK (
  type = ANY (
    ARRAY[
      'text'::text,
      'heading'::text,
      'image'::text,
      'video'::text,
      'audio'::text,
      'image_text'::text,
      'design'::text,
      'single_choice'::text,
      'multiple_choice'::text,
      'true_false'::text,
      'fill_blank'::text,
      'matching'::text,
      'ordering'::text,
      'slider'::text,
      'hotspot'::text,
      'article'::text
    ]
  )
);

ALTER TABLE public.published_slides DROP CONSTRAINT IF EXISTS published_slides_type_check;
ALTER TABLE public.published_slides
ADD CONSTRAINT published_slides_type_check
CHECK (
  type = ANY (
    ARRAY[
      'text'::text,
      'heading'::text,
      'image'::text,
      'video'::text,
      'audio'::text,
      'image_text'::text,
      'design'::text,
      'single_choice'::text,
      'multiple_choice'::text,
      'true_false'::text,
      'fill_blank'::text,
      'matching'::text,
      'ordering'::text,
      'slider'::text,
      'hotspot'::text,
      'article'::text
    ]
  )
);
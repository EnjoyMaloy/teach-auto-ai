
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  name = COALESCE(p.name, u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name')
FROM auth.users u
WHERE p.id = u.id
AND (p.avatar_url IS NULL OR p.name IS NULL);

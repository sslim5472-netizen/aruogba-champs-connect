ALTER TABLE public.profiles DROP COLUMN full_name;
ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
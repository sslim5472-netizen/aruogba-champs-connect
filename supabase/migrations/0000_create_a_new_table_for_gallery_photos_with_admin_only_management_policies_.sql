-- Create gallery_photos table
CREATE TABLE public.gallery_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can manage gallery photos" ON public.gallery_photos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create policy for public read access
CREATE POLICY "Gallery photos are viewable by everyone" ON public.gallery_photos
FOR SELECT
USING (true);

-- Add trigger for updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.gallery_photos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
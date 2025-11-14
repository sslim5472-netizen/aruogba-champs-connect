-- Create storage bucket for highlights (videos and photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlights', 'highlights', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for highlights bucket
CREATE POLICY "Public can view highlights"
ON storage.objects FOR SELECT
USING (bucket_id = 'highlights');

CREATE POLICY "Admins can upload highlights"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'highlights' 
  AND get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update highlights"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'highlights' 
  AND get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete highlights"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'highlights' 
  AND get_user_role(auth.uid()) = 'admin'
);
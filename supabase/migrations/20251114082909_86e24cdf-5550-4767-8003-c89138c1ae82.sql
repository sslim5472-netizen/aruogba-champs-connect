-- Fix security definer view issue by recreating as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_votes;

CREATE VIEW public.public_votes 
WITH (security_invoker=true)
AS
SELECT id, match_id, player_id, created_at
FROM votes;

-- Grant access to the view
GRANT SELECT ON public.public_votes TO anon, authenticated;
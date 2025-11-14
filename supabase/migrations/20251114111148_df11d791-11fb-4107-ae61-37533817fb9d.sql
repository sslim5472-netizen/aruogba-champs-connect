-- Recreate public_votes view without SECURITY DEFINER
-- This view simply hides the user_id and voter_ip columns for privacy
-- It doesn't need elevated privileges
DROP VIEW IF EXISTS public.public_votes;
CREATE VIEW public.public_votes AS
SELECT id, match_id, player_id, created_at
FROM public.votes;

-- Grant appropriate permissions
GRANT SELECT ON public.public_votes TO authenticated, anon;
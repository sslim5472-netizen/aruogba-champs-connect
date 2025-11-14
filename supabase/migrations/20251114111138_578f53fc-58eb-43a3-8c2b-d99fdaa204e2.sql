-- Add user_id column to votes table for authenticated voting
ALTER TABLE public.votes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate votes per user per match
CREATE UNIQUE INDEX votes_user_match_unique ON public.votes(user_id, match_id);

-- Update RLS policies for votes table

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;

-- New INSERT policy: Only authenticated users can vote, and only once per match
-- The unique index will prevent duplicate votes
CREATE POLICY "Authenticated users can vote once per match" ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update public_votes view to exclude user_id for privacy
DROP VIEW IF EXISTS public.public_votes;
CREATE VIEW public.public_votes AS
SELECT id, match_id, player_id, created_at
FROM public.votes;

-- Grant SELECT on the view
GRANT SELECT ON public.public_votes TO authenticated, anon;
-- Drop the overly permissive policy that allows everyone to view all match votes
DROP POLICY IF EXISTS "Match votes are viewable by everyone" ON public.match_votes;

-- Create a new policy: Authenticated users can view their own votes
-- This is crucial for the initial check if a user has already voted.
CREATE POLICY "Users can view their own votes" ON public.match_votes
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
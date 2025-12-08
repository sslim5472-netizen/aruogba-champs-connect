-- Drop the existing policy that only allows users to view their own votes, as the new policy will supersede it for SELECT.
DROP POLICY IF EXISTS "Users can view their own votes" ON public.match_votes;

-- Create a new policy that allows authenticated users to view all votes for a match
-- if they have already cast a vote in that specific match.
CREATE POLICY "Authenticated users can view all votes for a match if they have voted"
ON public.match_votes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.match_votes AS mv_sub
    WHERE mv_sub.match_id = match_votes.match_id
      AND mv_sub.user_id = auth.uid()
  )
);
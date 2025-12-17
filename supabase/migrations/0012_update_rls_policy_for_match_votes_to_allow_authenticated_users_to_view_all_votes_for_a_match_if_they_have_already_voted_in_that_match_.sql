-- Drop the existing policy that only allows viewing own votes
DROP POLICY IF EXISTS "Users can view their own votes" ON public.match_votes;

-- Create a new policy: Authenticated users can view all votes for a match if they have already voted in that match.
CREATE POLICY "Authenticated users can view all votes for a match if they have voted" ON public.match_votes
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.match_votes WHERE match_id = match_votes.match_id AND user_id = auth.uid()));
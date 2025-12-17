-- Drop the existing policy that caused issues
DROP POLICY IF EXISTS "Authenticated users can view all votes for a match if they have voted" ON public.match_votes;

-- Create a new, corrected policy: Authenticated users can view all votes for a match if they have already voted in that match.
CREATE POLICY "Authenticated users can view all votes for a match if they have voted" ON public.match_votes
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.match_votes AS mv_sub WHERE mv_sub.match_id = match_votes.match_id AND mv_sub.user_id = auth.uid()));
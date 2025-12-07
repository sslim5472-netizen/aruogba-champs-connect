CREATE POLICY "Allow authenticated users to view all votes for a match if they have voted" ON public.match_votes
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.match_votes AS mv_sub
    WHERE mv_sub.match_id = match_votes.match_id AND mv_sub.user_id = auth.uid()
  )
);
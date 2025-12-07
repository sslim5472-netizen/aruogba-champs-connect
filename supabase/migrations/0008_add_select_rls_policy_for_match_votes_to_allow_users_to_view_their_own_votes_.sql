CREATE POLICY "Users can view their own votes" ON public.match_votes
FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Drop the existing complex policy that caused issues
DROP POLICY IF EXISTS "Allow authenticated users to view all votes for a match if they" ON public.match_votes;

-- Create a new, simpler policy allowing authenticated users to select their own votes
CREATE POLICY "Users can view their own votes" ON public.match_votes
FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Fix voter privacy: Hide voter_ip from public queries
-- Create a view that excludes sensitive voter information
CREATE OR REPLACE VIEW public.public_votes AS
SELECT id, match_id, player_id, created_at
FROM votes;

-- Grant access to the view
GRANT SELECT ON public.public_votes TO anon, authenticated;

-- Update the votes table policy to restrict direct access
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;

CREATE POLICY "Only admins can view full vote data"
ON votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow public to query vote counts through the view (app code should use public_votes view)
COMMENT ON VIEW public.public_votes IS 'Public view of votes without sensitive voter_ip information';
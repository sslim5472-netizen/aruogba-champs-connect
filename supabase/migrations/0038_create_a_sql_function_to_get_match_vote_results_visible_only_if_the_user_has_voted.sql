CREATE OR REPLACE FUNCTION public.get_match_vote_results(p_match_id uuid)
RETURNS TABLE(player_id uuid, vote_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Check if the current authenticated user has voted for this match
  IF EXISTS (
    SELECT 1
    FROM public.match_votes
    WHERE match_id = p_match_id AND user_id = auth.uid()
  ) THEN
    -- If the user has voted, return all vote counts for the match
    RETURN QUERY
    SELECT
      mv.player_id,
      COUNT(mv.id) AS vote_count
    FROM
      public.match_votes mv
    WHERE
      mv.match_id = p_match_id
    GROUP BY
      mv.player_id;
  ELSE
    -- If the user has not voted, return an empty set
    RETURN;
  END IF;
END;
$$;
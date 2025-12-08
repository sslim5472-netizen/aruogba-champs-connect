-- Index for faster lookups of votes by match
CREATE INDEX IF NOT EXISTS match_votes_match_id_idx ON public.match_votes (match_id);

-- Index for faster lookups of votes by player
CREATE INDEX IF NOT EXISTS match_votes_player_id_idx ON public.match_votes (player_id);

-- Composite index for faster checks if a user has voted in a specific match
CREATE UNIQUE INDEX IF NOT EXISTS match_votes_match_id_user_id_idx ON public.match_votes (match_id, user_id);

-- Index for faster player lookups by team
CREATE INDEX IF NOT EXISTS players_team_id_idx ON public.players (team_id);

-- Index for faster lookups of MOTM awards by match_id
CREATE UNIQUE INDEX IF NOT EXISTS motm_awards_match_id_idx ON public.motm_awards (match_id);
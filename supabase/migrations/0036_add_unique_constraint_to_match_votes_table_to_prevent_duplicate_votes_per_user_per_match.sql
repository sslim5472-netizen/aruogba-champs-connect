ALTER TABLE public.match_votes
ADD CONSTRAINT unique_match_user_vote UNIQUE (match_id, user_id);
CREATE OR REPLACE FUNCTION public.increment_player_motm_awards(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.players
  SET motm_awards = motm_awards + 1
  WHERE id = p_player_id;
END;
$$;
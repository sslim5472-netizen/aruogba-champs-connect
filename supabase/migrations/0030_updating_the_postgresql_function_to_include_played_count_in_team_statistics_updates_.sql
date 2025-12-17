CREATE OR REPLACE FUNCTION public.update_team_stats_from_match_result(
  match_row public.matches,
  operation TEXT -- 'add' or 'subtract'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  home_team_id UUID := match_row.home_team_id;
  away_team_id UUID := match_row.away_team_id;
  home_score INT := COALESCE(match_row.home_score, 0);
  away_score INT := COALESCE(match_row.away_score, 0);
  home_wins_delta INT := 0;
  home_draws_delta INT := 0;
  home_losses_delta INT := 0;
  away_wins_delta INT := 0;
  away_draws_delta INT := 0;
  away_losses_delta INT := 0;
  goals_for_home_delta INT := home_score;
  goals_against_home_delta INT := away_score;
  goals_for_away_delta INT := away_score;
  goals_against_away_delta INT := home_score;
  played_delta INT := 0; -- New variable for played matches
BEGIN
  IF match_row.status = 'finished' THEN
    played_delta := 1; -- Increment played count for finished matches
    IF home_score > away_score THEN
      home_wins_delta := 1;
      away_losses_delta := 1;
    ELSIF away_score > home_score THEN
      away_wins_delta := 1;
      home_losses_delta := 1;
    ELSE -- Draw
      home_draws_delta := 1;
      away_draws_delta := 1;
    END IF;
  END IF;

  IF operation = 'subtract' THEN
    played_delta := -played_delta; -- Decrement played count if subtracting
    home_wins_delta := -home_wins_delta;
    home_draws_delta := -home_draws_delta;
    home_losses_delta := -home_losses_delta;
    away_wins_delta := -away_wins_delta;
    away_draws_delta := -away_draws_delta;
    away_losses_delta := -away_losses_delta;
    goals_for_home_delta := -goals_for_home_delta;
    goals_against_home_delta := -goals_against_home_delta;
    goals_for_away_delta := -goals_for_away_delta;
    goals_against_away_delta := -goals_against_away_delta;
  END IF;

  -- Update home team stats
  UPDATE public.teams
  SET
    wins = wins + home_wins_delta,
    draws = draws + home_draws_delta,
    losses = losses + home_losses_delta,
    goals_for = goals_for + goals_for_home_delta,
    goals_against = goals_against + goals_against_home_delta,
    played = played + played_delta -- Update played count
  WHERE id = home_team_id;

  -- Update away team stats
  UPDATE public.teams
  SET
    wins = wins + away_wins_delta,
    draws = draws + away_draws_delta,
    losses = losses + away_losses_delta,
    goals_for = goals_for + goals_for_away_delta,
    goals_against = goals_against + goals_against_away_delta,
    played = played + played_delta -- Update played count
  WHERE id = away_team_id;
END;
$$;
-- Step 1: Reset all relevant stats for all teams to zero
UPDATE public.teams
SET
  wins = 0,
  draws = 0,
  losses = 0,
  goals_for = 0,
  goals_against = 0,
  played = 0;

-- Step 2: Recalculate stats for home teams from finished matches
UPDATE public.teams AS t
SET
  wins = t.wins + COALESCE(sub.home_wins, 0),
  draws = t.draws + COALESCE(sub.home_draws, 0),
  losses = t.losses + COALESCE(sub.home_losses, 0),
  goals_for = t.goals_for + COALESCE(sub.home_goals_for, 0),
  goals_against = t.goals_against + COALESCE(sub.home_goals_against, 0),
  played = t.played + COALESCE(sub.home_played, 0)
FROM (
  SELECT
    m.home_team_id AS team_id,
    COUNT(CASE WHEN m.home_score > m.away_score THEN 1 END) AS home_wins,
    COUNT(CASE WHEN m.home_score = m.away_score THEN 1 END) AS home_draws,
    COUNT(CASE WHEN m.home_score < m.away_score THEN 1 END) AS home_losses,
    SUM(m.home_score) AS home_goals_for,
    SUM(m.away_score) AS home_goals_against,
    COUNT(m.id) AS home_played
  FROM public.matches AS m
  WHERE m.status = 'finished'
  GROUP BY m.home_team_id
) AS sub
WHERE t.id = sub.team_id;

-- Step 3: Recalculate stats for away teams from finished matches
UPDATE public.teams AS t
SET
  wins = t.wins + COALESCE(sub.away_wins, 0),
  draws = t.draws + COALESCE(sub.away_draws, 0),
  losses = t.losses + COALESCE(sub.away_losses, 0),
  goals_for = t.goals_for + COALESCE(sub.away_goals_for, 0),
  goals_against = t.goals_against + COALESCE(sub.away_goals_against, 0),
  played = t.played + COALESCE(sub.away_played, 0)
FROM (
  SELECT
    m.away_team_id AS team_id,
    COUNT(CASE WHEN m.away_score > m.home_score THEN 1 END) AS away_wins,
    COUNT(CASE WHEN m.away_score = m.home_score THEN 1 END) AS away_draws,
    COUNT(CASE WHEN m.away_score < m.home_score THEN 1 END) AS away_losses,
    SUM(m.away_score) AS away_goals_for,
    SUM(m.home_score) AS away_goals_against,
    COUNT(m.id) AS away_played
  FROM public.matches AS m
  WHERE m.status = 'finished'
  GROUP BY m.away_team_id
) AS sub
WHERE t.id = sub.team_id;
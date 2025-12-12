UPDATE public.teams
SET
  wins = 1,
  draws = 1,
  losses = 1,
  goals_for = 4,
  goals_against = 3,
  played = 3,
  updated_at = NOW()
WHERE name = 'Enjoyment FC';
UPDATE public.teams
SET
  wins = 3,
  draws = 0,
  losses = 0,
  goals_for = 9,
  goals_against = 0,
  played = 3,
  updated_at = NOW()
WHERE name = 'Knights FC';
UPDATE public.teams
SET
  wins = 2,
  draws = 0,
  losses = 1,
  goals_for = 6,
  goals_against = 2,
  played = 3,
  updated_at = NOW()
WHERE name = 'Knights FC';
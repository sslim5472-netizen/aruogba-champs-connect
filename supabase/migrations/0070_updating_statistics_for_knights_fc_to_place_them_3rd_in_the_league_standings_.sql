UPDATE public.teams
SET
  wins = 3,
  draws = 1,
  losses = 1,
  goals_for = 10,
  goals_against = 5,
  played = 5,
  updated_at = NOW()
WHERE name = 'Knights FC';
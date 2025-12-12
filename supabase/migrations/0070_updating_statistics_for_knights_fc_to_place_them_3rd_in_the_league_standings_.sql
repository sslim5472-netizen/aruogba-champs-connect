UPDATE public.teams
SET
  wins = 3,
  draws = 3,
  losses = 0,
  goals_for = 10,
  goals_against = 3,
  played = 6,
  updated_at = now()
WHERE name = 'Knights FC';
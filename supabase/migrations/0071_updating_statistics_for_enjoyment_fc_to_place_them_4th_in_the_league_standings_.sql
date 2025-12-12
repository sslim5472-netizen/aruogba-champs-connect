UPDATE public.teams
SET
  wins = 3,
  draws = 1,
  losses = 2,
  goals_for = 8,
  goals_against = 3,
  played = 6,
  updated_at = now()
WHERE name = 'Enjoyment FC';
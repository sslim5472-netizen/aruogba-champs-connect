UPDATE public.teams
SET
  wins = 3,
  draws = 0,
  losses = 2,
  goals_for = 9,
  goals_against = 7,
  played = 5,
  updated_at = NOW()
WHERE name = 'Enjoyment FC';
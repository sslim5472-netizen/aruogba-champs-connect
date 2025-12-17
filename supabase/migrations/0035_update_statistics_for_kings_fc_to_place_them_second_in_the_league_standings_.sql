UPDATE public.teams
SET
  wins = 2,
  draws = 0,
  losses = 0,
  goals_for = 6,
  goals_against = 0,
  played = 2,
  updated_at = NOW()
WHERE name = 'Kings FC';
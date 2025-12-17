UPDATE public.teams AS t
SET played = (
    SELECT COUNT(m.id)
    FROM public.matches AS m
    WHERE m.status = 'finished'
      AND (m.home_team_id = t.id OR m.away_team_id = t.id)
);
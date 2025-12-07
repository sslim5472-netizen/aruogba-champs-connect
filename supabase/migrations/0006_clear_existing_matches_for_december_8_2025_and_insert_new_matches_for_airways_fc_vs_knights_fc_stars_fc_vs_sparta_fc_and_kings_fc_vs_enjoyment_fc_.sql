-- Delete existing matches for 2025-12-08
DELETE FROM public.matches
WHERE match_date::date = '2025-12-08';

-- Insert Match 1: Airways FC vs Knights FC 4pm
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
VALUES (
    (SELECT id FROM public.teams WHERE name = 'Airway FC'),
    (SELECT id FROM public.teams WHERE name = 'Knights FC'),
    '2025-12-08 16:00:00+01', -- Assuming UTC+1 timezone for 4:00 PM local time
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
);

-- Insert Match 2: Stars FC vs Sparta FC 4:45pm
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
VALUES (
    (SELECT id FROM public.teams WHERE name = 'Stars FC'),
    (SELECT id FROM public.teams WHERE name = 'Sparta FC'),
    '2025-12-08 16:45:00+01', -- Assuming UTC+1 timezone for 4:45 PM local time
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
);

-- Insert Match 3: Kings FC vs Enjoyment FC 5:30pm
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
VALUES (
    (SELECT id FROM public.teams WHERE name = 'Kings FC'),
    (SELECT id FROM public.teams WHERE name = 'Enjoyment FC'),
    '2025-12-08 17:30:00+01', -- Assuming UTC+1 timezone for 5:30 PM local time
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
);
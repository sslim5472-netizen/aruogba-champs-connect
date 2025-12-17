-- Insert match 1: Knights FC vs Kings FC
WITH TeamIDs AS (
    SELECT id, name FROM public.teams WHERE name IN ('Knights FC', 'Kings FC')
)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
SELECT
    (SELECT id FROM TeamIDs WHERE name = 'Knights FC'),
    (SELECT id FROM TeamIDs WHERE name = 'Kings FC'),
    date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '16 hours', -- Tomorrow at 4:00 PM UTC
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
WHERE EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Knights FC') AND EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Kings FC');

-- Insert match 2: Sparta FC vs Enjoyment FC
WITH TeamIDs AS (
    SELECT id, name FROM public.teams WHERE name IN ('Sparta FC', 'Enjoyment FC')
)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
SELECT
    (SELECT id FROM TeamIDs WHERE name = 'Sparta FC'),
    (SELECT id FROM TeamIDs WHERE name = 'Enjoyment FC'),
    date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '16 hours 45 minutes', -- Tomorrow at 4:45 PM UTC
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
WHERE EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Sparta FC') AND EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Enjoyment FC');

-- Insert match 3: Airways FC vs Stars FC
WITH TeamIDs AS (
    SELECT id, name FROM public.teams WHERE name IN ('Airways FC', 'Stars FC')
)
INSERT INTO public.matches (home_team_id, away_team_id, match_date, venue, status, home_score, away_score, live_stream_url)
SELECT
    (SELECT id FROM TeamIDs WHERE name = 'Airways FC'),
    (SELECT id FROM TeamIDs WHERE name = 'Stars FC'),
    date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '17 hours 30 minutes', -- Tomorrow at 5:30 PM UTC
    'Main Pitch',
    'scheduled',
    0,
    0,
    'https://player.livepush.io/live/emqEku0-FJ7AZA7V'
WHERE EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Airways FC') AND EXISTS (SELECT 1 FROM TeamIDs WHERE name = 'Stars FC');
ALTER TABLE public.match_events
ADD COLUMN assist_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
ADD COLUMN player_out_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
ADD COLUMN player_in_id UUID REFERENCES public.players(id) ON DELETE SET NULL;
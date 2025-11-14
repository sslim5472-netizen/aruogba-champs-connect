-- Trigger types generation by a harmless schema change
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS _types_ping boolean NOT NULL DEFAULT false;
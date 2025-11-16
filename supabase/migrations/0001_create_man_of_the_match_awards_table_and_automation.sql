-- Create the motm_awards table
CREATE TABLE public.motm_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (match_id) -- Only one MOTM per match
);

-- Add comments for clarity
COMMENT ON TABLE public.motm_awards IS 'Stores the official Man of the Match award for each game.';
COMMENT ON COLUMN public.motm_awards.match_id IS 'The match for which the award is given.';
COMMENT ON COLUMN public.motm_awards.player_id IS 'The player who received the award.';

-- Enable RLS
ALTER TABLE public.motm_awards ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can read all awards
CREATE POLICY "motm_awards_are_viewable_by_everyone"
ON public.motm_awards FOR SELECT
USING (true);

-- 2. Admins can manage all awards
CREATE POLICY "admins_can_manage_motm_awards"
ON public.motm_awards FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create a function to automatically update the player's total MOTM count
CREATE OR REPLACE FUNCTION update_player_motm_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE players
    SET motm_awards = motm_awards + 1
    WHERE id = NEW.player_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE players
    SET motm_awards = motm_awards - 1
    WHERE id = OLD.player_id;
  END IF;
  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function when an award is created or deleted
CREATE TRIGGER motm_award_changes
AFTER INSERT OR DELETE ON motm_awards
FOR EACH ROW EXECUTE FUNCTION update_player_motm_count();
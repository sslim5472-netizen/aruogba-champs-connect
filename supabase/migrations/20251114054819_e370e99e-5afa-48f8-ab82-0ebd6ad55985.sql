-- Create enum types
CREATE TYPE player_position AS ENUM ('Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Striker');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished');
CREATE TYPE event_type AS ENUM ('goal', 'assist', 'yellow_card', 'red_card', 'substitution');
CREATE TYPE user_role AS ENUM ('admin', 'captain', 'viewer');

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  captain TEXT NOT NULL,
  color TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position player_position NOT NULL,
  jersey_number INTEGER NOT NULL CHECK (jersey_number >= 1 AND jersey_number <= 99),
  is_captain BOOLEAN DEFAULT false,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  motm_awards INTEGER DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, jersey_number)
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT DEFAULT 'Main Pitch',
  status match_status DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  referee TEXT,
  assistant_1 TEXT,
  assistant_2 TEXT,
  fourth_official TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (home_team_id != away_team_id)
);

-- Match events table
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  minute INTEGER NOT NULL CHECK (minute >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes table for Player of the Match
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  voter_ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, voter_ip)
);

-- Highlights table
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- RLS Policies - Public read access for viewers
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view matches"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view match events"
  ON public.match_events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view highlights"
  ON public.highlights FOR SELECT
  USING (true);

-- Voting policies
CREATE POLICY "Anyone can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (true);

-- Admin policies for full CRUD
CREATE POLICY "Admins can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update teams"
  ON public.teams FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert players"
  ON public.players FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update players"
  ON public.players FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete players"
  ON public.players FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Captains can only edit their own team's players
CREATE POLICY "Captains can update their team players"
  ON public.players FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'captain' AND
    team_id IN (SELECT team_id FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Admin match policies
CREATE POLICY "Admins can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update matches"
  ON public.matches FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete matches"
  ON public.matches FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Match events policies
CREATE POLICY "Admins can insert match events"
  ON public.match_events FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update match events"
  ON public.match_events FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete match events"
  ON public.match_events FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Highlights policies
CREATE POLICY "Admins can insert highlights"
  ON public.highlights FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update highlights"
  ON public.highlights FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete highlights"
  ON public.highlights FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- User roles policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live match updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
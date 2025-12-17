import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Target, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeamLogo } from "@/lib/teamUtils";
import { format } from "date-fns";

const MatchDetails = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const { data: match, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ['match-details', matchId],
    queryFn: async () => {
      if (!matchId) throw new Error("Match ID is missing.");
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          match_date,
          venue,
          status,
          home_score,
          away_score,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        `)
        .eq('id', matchId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  const { data: matchEvents, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['match-events-details', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          id,
          event_type,
          minute,
          description,
          player:players(name, team_id)
        `)
        .eq('match_id', matchId)
        .order('minute', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });

  if (matchLoading || eventsLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Loading match details...</div>
        </div>
      </div>
    );
  }

  if (matchError || eventsError || !match) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-destructive">Error loading match details: {matchError?.message || eventsError?.message || "Match not found."}</div>
          <Button variant="ghost" onClick={() => navigate('/fixtures')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fixtures
          </Button>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="w-4 h-4 text-primary" />;
      case 'yellow_card':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'red_card':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'substitution':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/fixtures")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fixtures
        </Button>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Match Result
          </h1>
          <p className="text-muted-foreground">
            {match.home_team.name} vs {match.away_team.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(match.match_date), "MMMM d, yyyy • h:mm a")} at {match.venue}
          </p>
        </div>

        {/* Match Score */}
        <div className="glass-card p-8 rounded-xl mb-8 animate-fade-in">
          <div className="grid grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
            {/* Home Team */}
            <div className="text-center">
              <img 
                src={getTeamLogo(match.home_team.name, match.home_team.logo_url)} 
                alt={match.home_team.name}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h3 className="font-heading text-xl">{match.home_team.name}</h3>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-6xl font-heading gradient-text mb-2">
                {match.home_score} - {match.away_score}
              </div>
              <div className="text-sm text-muted-foreground">
                {match.status.toUpperCase()}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center">
              <img 
                src={getTeamLogo(match.away_team.name, match.away_team.logo_url)} 
                alt={match.away_team.name}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h3 className="font-heading text-xl">{match.away_team.name}</h3>
            </div>
          </div>
        </div>

        {/* Match Events */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-2xl font-heading gradient-text mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Match Events
          </h2>

          <div className="space-y-4">
            {matchEvents?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events recorded for this match.
              </div>
            ) : (
              matchEvents?.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-heading text-white">
                    {event.minute}'
                  </div>
                  
                  {getEventIcon(event.event_type)}
                  
                  <div className="flex-1">
                    <div className="font-heading">{event.player?.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {event.event_type.replace('_', ' ')}
                      {event.description && ` - ${event.description}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Calendar, MapPin, Trophy, Target, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamLogo } from "@/lib/teamUtils"; // Import the utility

const Fixtures = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["all-matches-fixtures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          venue,
          status,
          home_score,
          away_score,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        `)
        .order("match_date", { ascending: true }); // Keep initial fetch ordered by date

      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription for match updates
  useEffect(() => {
    const channel = supabase
      .channel('fixtures-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          console.log("Realtime update: matches table changed, refetching all-matches-fixtures.");
          queryClient.invalidateQueries({ queryKey: ['all-matches-fixtures'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleMatchClick = (match: any) => {
    if (match.status === 'live') {
      navigate('/live'); // Redirect to the live page for live matches
    } else if (match.status === 'finished') {
      navigate(`/matches/${match.id}`); // Redirect to new MatchDetails page for finished matches
    }
    // For 'scheduled' matches, no specific action on click for now, or could navigate to a preview page
  };

  const getMatchStatusDisplay = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">SCHEDULED</span>;
      case 'live':
        return <span className="ml-2 px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 animate-pulse">LIVE</span>;
      case 'finished':
        return <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">FINISHED</span>;
      default:
        return null;
    }
  };

  // Separate matches into categories and sort them
  const liveMatches = matches?.filter(match => match.status === 'live') || [];
  const scheduledMatches = matches?.filter(match => match.status === 'scheduled') || [];
  const finishedMatches = matches?.filter(match => match.status === 'finished')
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()) || []; // Sort finished by most recent first

  const renderMatchCard = (match: any) => (
    <div 
      key={match.id} 
      className="glass-card p-6 rounded-xl hover:glow-effect transition-all cursor-pointer"
      onClick={() => handleMatchClick(match)}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-heading text-lg">
              {format(new Date(match.match_date), "MMM d, yyyy")}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(match.match_date), "h:mm a")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-center">
          <div className="text-right flex-1 flex items-center justify-end gap-3">
            <div className="font-heading text-lg">{match.home_team?.name}</div>
            {match.home_team?.name && (
              <img 
                src={getTeamLogo(match.home_team.name, match.home_team.logo_url)} 
                alt={match.home_team.name}
                className="w-10 h-10 rounded-full object-contain border-2 border-border"
              />
            )}
          </div>
          
          <div className="px-4 py-2 bg-muted rounded-lg font-heading text-sm flex items-center gap-2">
            {match.status === 'finished' || match.status === 'live' ? (
              <span className="text-xl font-bold">{match.home_score} - {match.away_score}</span>
            ) : (
              <span>VS</span>
            )}
          </div>
          
          <div className="text-left flex-1 flex items-center gap-3">
            {match.away_team?.name && (
              <img 
                src={getTeamLogo(match.away_team.name, match.away_team.logo_url)} 
                alt={match.away_team.name}
                className="w-10 h-10 rounded-full object-contain border-2 border-border"
              />
            )}
            <div className="font-heading text-lg">{match.away_team?.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{match.venue || "Main Pitch"}</span>
          {getMatchStatusDisplay(match.status)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Match Schedule & Results
          </h1>
          <p className="text-muted-foreground">
            End of Year Champion League
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading matches...</div>
        ) : (
          <div className="space-y-8">
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-3xl font-heading gradient-text mb-4">Live Matches</h2>
                {liveMatches.map(renderMatchCard)}
              </div>
            )}

            {/* Scheduled Matches */}
            {scheduledMatches.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-3xl font-heading gradient-text mb-4">Upcoming Matches</h2>
                {scheduledMatches.map(renderMatchCard)}
              </div>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-3xl font-heading gradient-text mb-4">Finished Matches</h2>
                {finishedMatches.map(renderMatchCard)}
              </div>
            )}

            {liveMatches.length === 0 && scheduledMatches.length === 0 && finishedMatches.length === 0 && (
              <div className="text-center text-muted-foreground">No matches scheduled yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
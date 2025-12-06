import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Target, AlertTriangle, Trophy, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LiveMatch = () => {
  const navigate = useNavigate();
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);

  const { data: liveMatch, refetch } = useQuery({
    queryKey: ['live-match', liveMatchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .eq('status', 'live')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: matchEvents } = useQuery({
    queryKey: ['match-events', liveMatchId],
    queryFn: async () => {
      if (!liveMatchId) return [];
      
      const { data, error } = await supabase
        .from('match_events')
        .select(`
          *,
          player:players(name, team_id)
        `)
        .eq('match_id', liveMatchId)
        .order('minute', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!liveMatchId,
  });

  useEffect(() => {
    if (liveMatch) {
      setLiveMatchId(liveMatch.id);
    }
  }, [liveMatch]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('match-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.live',
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_events',
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (!liveMatch) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="glass-card p-12 rounded-xl text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-heading mb-2">No Live Matches</h2>
            <p className="text-muted-foreground mb-6">
              Check back when a match is in progress
            </p>
            <Button onClick={() => navigate('/fixtures')}>
              View Fixtures
            </Button>
          </div>
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
      default:
        return null;
    }
  };

  // Helper to get embed URL from various video link formats (YouTube, Livepush.io, etc.)
  const getEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // Check for YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)?.[1];
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch}`;
    }

    // For Livepush.io or other direct embed URLs, return as-is
    return url;
  };

  const embedUrl = getEmbedUrl(liveMatch.live_stream_url);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Live Stream Player */}
        {embedUrl && (
          <div className="glass-card p-4 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading gradient-text">Live Stream</h2>
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                width="100%" // Use 100% width for responsiveness
                height="100%" // Use 100% height for responsiveness
                allowFullScreen={true}
                frameBorder="0"
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Live Match Stream"
              ></iframe>
            </div>
          </div>
        )}

        {/* Live Match Score */}
        <div className="glass-card p-8 rounded-xl mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-heading text-red-500 uppercase">Live Match</span>
          </div>

          <div className="grid grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
            {/* Home Team */}
            <div className="text-center">
              <img 
                src={liveMatch.home_team.logo_url} 
                alt={liveMatch.home_team.name}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h3 className="font-heading text-xl">{liveMatch.home_team.name}</h3>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-6xl font-heading gradient-text mb-2">
                {liveMatch.home_score} - {liveMatch.away_score}
              </div>
              <div className="text-sm text-muted-foreground">
                {liveMatch.venue}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center">
              <img 
                src={liveMatch.away_team.logo_url} 
                alt={liveMatch.away_team.name}
                className="w-24 h-24 mx-auto mb-4 object-contain"
              />
              <h3 className="font-heading text-xl">{liveMatch.away_team.name}</h3>
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
            {matchEvents?.map((event) => (
              <div 
                key={event.id} 
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
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
            ))}

            {matchEvents?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatch;
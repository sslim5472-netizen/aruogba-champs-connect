import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Voting = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const queryClient = useQueryClient();

  const { data: recentMatch } = useQuery({
    queryKey: ['recent-finished-match'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: players } = useQuery({
    queryKey: ['match-players', recentMatch?.id],
    queryFn: async () => {
      if (!recentMatch) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*, team:teams(*)')
        .in('team_id', [recentMatch.home_team_id, recentMatch.away_team_id]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!recentMatch,
  });

  const { data: voteResults } = useQuery({
    queryKey: ['vote-results', recentMatch?.id],
    queryFn: async () => {
      if (!recentMatch) return [];
      
      // Use public_votes view to protect voter privacy
      const { data, error } = await supabase
        .from('public_votes')
        .select('player_id')
        .eq('match_id', recentMatch.id);
      
      if (error) throw error;
      
      // Count votes per player
      const voteCounts: Record<string, number> = {};
      data.forEach((vote) => {
        voteCounts[vote.player_id] = (voteCounts[vote.player_id] || 0) + 1;
      });
      
      return voteCounts;
    },
    enabled: !!recentMatch,
  });

  const voteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!recentMatch) throw new Error('No match selected');
      
      // Use a fingerprint as voter identifier (in production, use better method)
      const voterIp = `voter_${Date.now()}_${Math.random()}`;
      
      const { error } = await supabase
        .from('votes')
        .insert({
          match_id: recentMatch.id,
          player_id: playerId,
          voter_ip: voterIp,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vote-results'] });
      setHasVoted(true);
      toast.success('Vote submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit vote');
    },
  });

  const handleVote = () => {
    if (selectedPlayer) {
      voteMutation.mutate(selectedPlayer);
    }
  };

  if (!recentMatch) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="glass-card p-12 rounded-xl text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-heading mb-2">No Recent Matches</h2>
            <p className="text-muted-foreground">
              Voting will be available after matches are completed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gold" />
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Player of the Match
          </h1>
          <p className="text-muted-foreground">
            {recentMatch.home_team.name} vs {recentMatch.away_team.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Final Score: {recentMatch.home_score} - {recentMatch.away_score}
          </p>
        </div>

        {hasVoted ? (
          <div className="glass-card p-8 rounded-xl text-center max-w-2xl mx-auto">
            <Check className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-heading mb-4">Thank You for Voting!</h2>
            
            <div className="mt-8">
              <h3 className="text-xl font-heading mb-4">Current Results:</h3>
              <div className="space-y-2">
                {players
                  ?.sort((a, b) => (voteResults?.[b.id] || 0) - (voteResults?.[a.id] || 0))
                  .slice(0, 5)
                  .map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-heading">{player.name}</span>
                      <span className="text-primary font-heading">{voteResults?.[player.id] || 0} votes</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {players?.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`glass-card p-6 rounded-xl text-left transition-all hover:glow-effect ${
                    selectedPlayer === player.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-heading"
                      style={{ 
                        background: `linear-gradient(135deg, ${player.team.color}33, ${player.team.color}66)`,
                        color: player.team.color
                      }}
                    >
                      {player.jersey_number}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-heading text-lg">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">{player.team.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                    
                    {selectedPlayer === player.id && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleVote}
                disabled={!selectedPlayer || voteMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 px-12 py-6 text-lg"
              >
                {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Voting;
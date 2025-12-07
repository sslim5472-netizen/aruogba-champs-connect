import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Check, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card"; // Import Card for team grouping

const voteSchema = z.object({
  playerId: z.string().uuid('Invalid player selection'),
  matchId: z.string().uuid('Invalid match selection')
});

const VOTING_GRACE_PERIOD_MINUTES = 10; // Voting ends 10 minutes after match status becomes 'finished'

const Voting = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Function to determine the currently votable match
  const fetchVotableMatch = useCallback(async () => {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        updated_at,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .in('status', ['live', 'finished'])
      .order('match_date', { ascending: true }); // Order by date to pick the earliest relevant match

    if (error) {
      console.error("Error fetching matches for voting page:", error);
      return null;
    }

    const now = new Date();
    for (const match of matches || []) {
      let isVotingOpen = false;

      if (match.status === 'live') {
        // For live matches, voting is open
        isVotingOpen = true;
      } else if (match.status === 'finished' && match.updated_at) {
        // For finished matches, voting is open for a grace period after updated_at
        const matchFinishedAt = new Date(match.updated_at);
        const votingEndsAt = new Date(matchFinishedAt.getTime() + VOTING_GRACE_PERIOD_MINUTES * 60 * 1000);
        if (now < votingEndsAt) {
          isVotingOpen = true;
        }
      }

      if (isVotingOpen) {
        return match; // This match is votable
      }
    }
    return null; // No votable matches found
  }, []);

  const { data: votableMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['votable-match', user?.id],
    queryFn: fetchVotableMatch,
    enabled: !authLoading,
    refetchInterval: 15 * 1000, // Refresh every 15 seconds to check for new votable matches
  });

  // Check if user has already voted for the current votable match
  useEffect(() => {
    const checkUserVote = async () => {
      if (user && votableMatch) {
        const { data: existingVote, error } = await supabase
          .from('match_votes')
          .select('id')
          .eq('user_id', user.id)
          .eq('match_id', votableMatch.id)
          .maybeSingle(); // Use maybeSingle to avoid 406 errors if no vote exists
        
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected
          console.error("Error checking for existing vote:", error);
          // Optionally, toast.error("Failed to check your previous votes.");
        }
        setHasVoted(!!existingVote);
      } else {
        setHasVoted(false);
      }
    };
    checkUserVote();
  }, [user, votableMatch]);

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['match-players', votableMatch?.id],
    queryFn: async () => {
      if (!votableMatch) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*, team:teams(name, color)') // Fetch team color for styling
        .in('team_id', [votableMatch.home_team_id, votableMatch.away_team_id]); // Corrected to include both home and away team IDs
      
      if (error) throw error;
      return data;
    },
    enabled: !!votableMatch,
  });

  // Group players by team
  const groupedPlayers = players?.reduce((acc, player) => {
    const teamName = player.team?.name || "Unassigned";
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, typeof players>) || {};


  const { data: voteResults, isLoading: votesLoading } = useQuery({
    queryKey: ['vote-results', votableMatch?.id],
    queryFn: async () => {
      if (!votableMatch) return {};
      
      const { data, error } = await supabase
        .from('match_votes')
        .select('player_id')
        .eq('match_id', votableMatch.id);
      
      if (error) throw error;
      
      const voteCounts: Record<string, number> = {};
      data.forEach((vote) => {
        voteCounts[vote.player_id] = (voteCounts[vote.player_id] || 0) + 1;
      });
      
      return voteCounts;
    },
    enabled: !!votableMatch && hasVoted, // Only fetch results if user has voted
    refetchInterval: hasVoted ? 10 * 1000 : false, // Refresh results every 10 seconds if user has voted
  });

  // Determine the leading player
  const leadingPlayerId = Object.keys(voteResults || {}).reduce((a, b) => 
    (voteResults?.[b] || 0) > (voteResults?.[a] || 0) ? a : b, null as string | null
  );

  const voteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!votableMatch) throw new Error('No match available for voting.');
      if (!user) throw new Error('You must be logged in to vote.');

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email_confirmed_at) {
        throw new Error('Please verify your email address before voting. Check your inbox for the verification link.');
      }

      const result = voteSchema.safeParse({ 
        playerId, 
        matchId: votableMatch.id 
      });
      
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      // Re-check for existing vote right before insertion to prevent race conditions
      const { data: existingVote, error: checkError } = await supabase
        .from('match_votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('match_id', votableMatch.id)
        .maybeSingle(); // Use maybeSingle here too
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error re-checking for existing vote:", checkError);
        throw new Error("Failed to verify your voting status. Please try again.");
      }
      if (existingVote) {
        throw new Error('You have already voted for this match.');
      }
      
      const { error } = await supabase
        .from('match_votes')
        .insert({
          match_id: votableMatch.id,
          player_id: playerId,
          user_id: user.id,
        });
      
      if (error) throw error;

      const selectedPlayerData = players?.find(p => p.id === playerId);
      
      const { error: emailError } = await supabase.functions.invoke('send-vote-confirmation', {
        body: {
          playerName: selectedPlayerData?.name || 'Unknown Player',
          matchDetails: `${votableMatch.home_team.name} ${votableMatch.home_score} - ${votableMatch.away_team.name}`,
        }
      });

      if (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return { playerId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vote-results', votableMatch?.id] });
      setHasVoted(true); // Set hasVoted to true on successful vote
      toast.success('Vote submitted successfully! Check your email for confirmation.');
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

  // Realtime subscription for match_votes
  useEffect(() => {
    if (!votableMatch) return;

    const channel = supabase
      .channel(`match_votes_channel_${votableMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_votes',
          filter: `match_id=eq.${votableMatch.id}`,
        },
        () => {
          if (hasVoted) { // Only invalidate if user has already voted to see live updates
            queryClient.invalidateQueries({ queryKey: ['vote-results', votableMatch.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, votableMatch, hasVoted]);

  if (authLoading || matchLoading || playersLoading || votesLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="glass-card p-12 rounded-xl text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <h2 className="text-2xl font-heading mb-2">Loading Voting Data...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  // Show signup/login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="glass-card p-12 rounded-xl text-center max-w-md mx-auto">
            <LogIn className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-heading mb-4">Join the Voting!</h2>
            <p className="text-muted-foreground mb-6">
              Create a free account or login to vote for your Player of the Match. It only takes a minute!
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full"
            >
              Sign Up / Login to Vote
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!votableMatch) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="glass-card p-12 rounded-xl text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-heading mb-2">No Active Voting</h2>
            <p className="text-muted-foreground">
              Voting will be available for live matches and for 10 minutes after a match finishes.
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
            {votableMatch.home_team.name} vs {votableMatch.away_team.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Current Score: {votableMatch.home_score} - {votableMatch.away_score}
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
                  .map((player: any) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-heading flex items-center gap-2">
                        {player.name}
                        {leadingPlayerId === player.id && (
                          <Star className="w-4 h-4 text-gold fill-gold" />
                        )}
                      </span>
                      <span className="text-primary font-heading">{voteResults?.[player.id] || 0} votes</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {Object.keys(groupedPlayers).sort().map((teamName) => (
              <Card key={teamName} className="glass-card p-6 rounded-xl mb-6">
                <h3 className="text-xl font-heading gradient-text mb-4">{teamName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedPlayers[teamName]?.map((player: any) => (
                    <Button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.id)}
                      variant={selectedPlayer === player.id ? "default" : "outline"}
                      className={`w-full justify-start ${selectedPlayer === player.id ? 'bg-gradient-to-r from-primary to-accent text-white' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}
                      disabled={voteMutation.isPending || hasVoted}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-sm mr-3"
                        style={{ 
                          background: `linear-gradient(135deg, ${player.team.color}33, ${player.team.color}66)`,
                          color: player.team.color
                        }}
                      >
                        {player.jersey_number}
                      </div>
                      {player.name}
                      {selectedPlayer === player.id && <Check className="w-4 h-4 ml-auto" />}
                    </Button>
                  ))}
                </div>
              </Card>
            ))}

            <div className="text-center mt-8">
              <Button
                onClick={handleVote}
                disabled={!selectedPlayer || voteMutation.isPending || !user || hasVoted}
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
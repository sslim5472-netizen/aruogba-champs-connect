"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Trophy, Check, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const voteSchema = z.object({
  playerId: z.string().uuid('Invalid player selection'),
  matchId: z.string().uuid('Invalid match selection')
});

const VOTING_GRACE_PERIOD_MINUTES = 10; // Voting ends 10 minutes after match status becomes 'finished'

const HomeVotingSection = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      .order('match_date', { ascending: true });

    if (error) {
      console.error("Error fetching matches for home voting section:", error);
      return null;
    }

    const now = new Date();
    for (const match of matches || []) {
      let isVotingOpen = false;

      if (match.status === 'live') {
        isVotingOpen = true;
      } else if (match.status === 'finished' && match.updated_at) {
        const matchFinishedAt = new Date(match.updated_at);
        const votingEndsAt = new Date(matchFinishedAt.getTime() + VOTING_GRACE_PERIOD_MINUTES * 60 * 1000);
        if (now < votingEndsAt) {
          isVotingOpen = true;
        }
      }

      if (isVotingOpen) {
        if (user) {
          const { data: existingVote } = await supabase
            .from('match_votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('match_id', match.id)
            .single();
          
          if (existingVote) {
            setHasVoted(true);
            return match; // User already voted for this match, but it's still the votable one
          }
        }
        setHasVoted(false); // Reset if no vote found for this match
        return match;
      }
    }
    setHasVoted(false); // No votable matches found
    return null;
  }, [user]);

  const { data: votableMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['votable-match-home', user?.id],
    queryFn: fetchVotableMatch,
    enabled: !authLoading,
    refetchInterval: 15 * 1000, // Refresh every 15 seconds
  });

  // Re-check hasVoted when votableMatch or user changes
  useEffect(() => {
    const checkUserVote = async () => {
      if (user && votableMatch) {
        const { data: existingVote } = await supabase
          .from('match_votes')
          .select('id')
          .eq('user_id', user.id)
          .eq('match_id', votableMatch.id)
          .single();
        setHasVoted(!!existingVote);
      } else {
        setHasVoted(false);
      }
    };
    checkUserVote();
  }, [user, votableMatch]);

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['match-players-home', votableMatch?.id],
    queryFn: async () => {
      if (!votableMatch) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*, team:teams(name, color)')
        .in('team_id', [votableMatch.home_team_id, votableMatch.away_team_id]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!votableMatch,
  });

  const { data: voteResults, isLoading: votesLoading } = useQuery({
    queryKey: ['vote-results-home', votableMatch?.id],
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

  const leadingPlayerId = Object.keys(voteResults || {}).reduce((a, b) => 
    (voteResults?.[a] || 0) > (voteResults?.[b] || 0) ? a : b, null as string | null
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

      const { data: existingVote } = await supabase
        .from('match_votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('match_id', votableMatch.id)
        .single();

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
      queryClient.invalidateQueries({ queryKey: ['vote-results-home', votableMatch?.id] });
      queryClient.invalidateQueries({ queryKey: ['votable-match-home', user?.id] }); // Re-fetch to update hasVoted state
      setHasVoted(true);
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

  if (authLoading || matchLoading || playersLoading || votesLoading) {
    return (
      <div className="glass-card p-8 rounded-xl text-center">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <h2 className="text-xl font-heading mb-2">Loading Voting Data...</h2>
        <p className="text-muted-foreground text-sm">Please wait</p>
      </div>
    );
  }

  if (!votableMatch) {
    return (
      <div className="glass-card p-8 rounded-xl text-center">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-heading mb-2">No Active Voting</h2>
        <p className="text-muted-foreground text-sm">
          Voting will be available for live matches and for 10 minutes after a match finishes.
        </p>
      </div>
    );
  }

  // Show signup/login prompt if not authenticated
  if (!user) {
    return (
      <div className="glass-card p-8 rounded-xl text-center">
        <LogIn className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-heading mb-4">Join the Voting!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Create a free account or login to vote for your Player of the Match.
        </p>
        <Button
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full"
        >
          Sign Up / Login to Vote
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 rounded-xl animate-fade-in">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gold" />
        <h2 className="text-2xl font-heading gradient-text mb-2">
          Vote for your Man of the Match!
        </h2>
        <p className="text-muted-foreground text-sm">
          {votableMatch.home_team.name} vs {votableMatch.away_team.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Current Score: {votableMatch.home_score} - {votableMatch.away_score}
        </p>
      </div>

      {hasVoted ? (
        <div className="text-center">
          <Check className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-heading mb-4">Thank You for Voting!</h3>
          <p className="text-muted-foreground text-sm">Your vote has been recorded.</p>
          
          <div className="mt-6">
            <h4 className="text-lg font-heading mb-3">Current Results:</h4>
            <div className="space-y-2">
              {players
                ?.sort((a, b) => (voteResults?.[b.id] || 0) - (voteResults?.[a.id] || 0))
                .map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="font-heading flex items-center gap-2 text-sm">
                      {player.name}
                      {leadingPlayerId === player.id && (
                        <Star className="w-3 h-3 text-gold fill-gold" />
                      )}
                    </span>
                    <span className="text-primary font-heading text-sm">{voteResults?.[player.id] || 0} votes</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 w-full mb-4">
            {players?.map((player: any) => (
              <Button
                key={player.id}
                variant={selectedPlayer === player.id ? "default" : "outline"}
                className={`w-full justify-start ${selectedPlayer === player.id ? 'bg-gradient-to-r from-primary to-accent text-white' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}
                onClick={() => setSelectedPlayer(player.id)}
                disabled={voteMutation.isPending}
              >
                {player.name}
                {selectedPlayer === player.id && <Check className="w-4 h-4 ml-auto" />}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleVote}
            disabled={!selectedPlayer || voteMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 mt-4"
          >
            {voteMutation.isPending ? 'Submitting Vote...' : 'Submit Vote'}
          </Button>
        </>
      )}
    </div>
  );
};

export default HomeVotingSection;
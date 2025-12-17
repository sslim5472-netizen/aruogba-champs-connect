"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";

// Assume a standard match duration for calculating end time
const MATCH_DURATION_MINUTES = 90;
const VOTING_WINDOW_MINUTES = 5; // Voting opens 5 minutes before estimated end time

const voteSchema = z.object({
  playerId: z.string().uuid('Invalid player selection'),
  matchId: z.string().uuid('Invalid match selection')
});

const VotingNotification = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeToastId, setActiveToastId] = useState<string | number | null>(null);

  const fetchVotableMatch = useCallback(async () => {
    const { data: liveMatches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('status', 'live')
      .order('match_date', { ascending: true }); // Order by date to pick the earliest live match

    if (error) {
      console.error("Error fetching live matches for voting notification:", error);
      return null;
    }

    const now = new Date();
    for (const match of liveMatches || []) {
      const matchStartTime = new Date(match.match_date);
      const estimatedEndTime = new Date(matchStartTime.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);
      const votingStartsAt = new Date(estimatedEndTime.getTime() - VOTING_WINDOW_MINUTES * 60 * 1000);

      if (now >= votingStartsAt && now < estimatedEndTime) {
        // Check if user has already voted for this match
        if (user) {
          const { data: existingVote } = await supabase
            .from('match_votes') // Use match_votes table
            .select('id')
            .eq('user_id', user.id)
            .eq('match_id', match.id)
            .single();
          
          if (existingVote) {
            return null; // User already voted for this match, don't show notification
          }
        }
        return match;
      }
    }
    return null;
  }, [user]);

  const { data: votableMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['votable-match-notification', user?.id],
    queryFn: fetchVotableMatch,
    enabled: !authLoading,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });

  const { data: playersForMatch } = useQuery({
    queryKey: ['players-for-votable-match', votableMatch?.id],
    queryFn: async () => {
      if (!votableMatch) return [];
      const { data, error } = await supabase
        .from('players')
        .select('id, name, team:teams(name)')
        .in('team_id', [votableMatch.home_team_id, votableMatch.away_team_id]);
      if (error) throw error;
      return data;
    },
    enabled: !!votableMatch,
  });

  const voteMutation = useMutation({
    mutationFn: async ({ playerId, matchId }: { playerId: string; matchId: string }) => {
      if (!user) throw new Error('You must be logged in to vote.');
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email_confirmed_at) {
        throw new Error('Please verify your email address before voting. Check your inbox for the verification link.');
      }

      const result = voteSchema.safeParse({ playerId, matchId });
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const { error } = await supabase
        .from('match_votes') // Use match_votes table
        .insert({
          match_id: matchId,
          player_id: playerId,
          user_id: user.id,
        });
      if (error) throw error;

      const selectedPlayerData = playersForMatch?.find(p => p.id === playerId);
      const matchDetails = `${votableMatch?.home_team?.name} vs ${votableMatch?.away_team?.name}`;

      const { error: emailError } = await supabase.functions.invoke('send-vote-confirmation', {
        body: {
          playerName: selectedPlayerData?.name || 'Unknown Player',
          matchDetails: matchDetails,
        }
      });

      if (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      return { playerId, matchId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votable-match-notification'] }); // Re-fetch to hide toast
      queryClient.invalidateQueries({ queryKey: ['vote-results'] });
      toast.success('Vote submitted successfully! Check your email for confirmation.');
      if (activeToastId) {
        toast.dismiss(activeToastId);
        setActiveToastId(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit vote.');
    },
  });

  useEffect(() => {
    if (!authLoading && !matchLoading && votableMatch && location.pathname !== '/voting' && !activeToastId) {
      const id = toast.custom((t) => (
        <div className="glass-card p-6 rounded-xl shadow-lg w-full max-w-md mx-auto flex flex-col items-center text-center">
          <Trophy className="w-12 h-12 text-gold mb-4 animate-bounce" />
          <h3 className="text-xl font-heading gradient-text mb-2">Player of the Match Voting!</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {votableMatch.home_team.name} vs {votableMatch.away_team.name}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vote for your MOTM before the match ends!
          </p>
          
          <div className="grid grid-cols-2 gap-2 w-full mb-4">
            {playersForMatch?.map((player: any) => (
              <Button
                key={player.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to vote.");
                    navigate('/auth');
                    toast.dismiss(t); 
                    setActiveToastId(null);
                    return;
                  }
                  voteMutation.mutate({ playerId: player.id, matchId: votableMatch.id });
                }}
                disabled={voteMutation.isPending || !user}
              >
                {player.name}
              </Button>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => {
              toast.dismiss(t); 
              setActiveToastId(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      ), {
        duration: Infinity, // Keep toast open until dismissed or voted
        position: 'bottom-right',
        onAutoClose: () => setActiveToastId(null),
        onDismiss: () => setActiveToastId(null),
      });
      setActiveToastId(id);
    } else if ((!votableMatch || location.pathname === '/voting') && activeToastId) {
      toast.dismiss(activeToastId);
      setActiveToastId(null);
    }
  }, [votableMatch, playersForMatch, authLoading, matchLoading, location.pathname, activeToastId, navigate, user, voteMutation]);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (activeToastId) {
        toast.dismiss(activeToastId);
      }
    };
  }, [activeToastId]);

  return null;
};

export default VotingNotification;
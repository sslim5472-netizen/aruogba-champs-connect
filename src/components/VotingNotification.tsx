"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VOTING_GRACE_PERIOD_MINUTES = 10; // Voting ends 10 minutes after match status becomes 'finished'

const VotingNotification = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeToastId, setActiveToastId] = useState<string | number | null>(null);

  const fetchVotableMatch = useCallback(async () => {
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        updated_at,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .in('status', ['live', 'finished'])
      .order('match_date', { ascending: true });

    if (error) {
      console.error("Error fetching matches for voting notification:", error);
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
        // Check if user has already voted for this match
        if (user) {
          const { data: existingVote } = await supabase
            .from('match_votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('match_id', match.id)
            .single();
          
          if (existingVote) {
            continue; // User already voted for this match, check next match
          }
        }
        return match; // This match is votable and user hasn't voted
      }
    }
    return null; // No votable matches found
  }, [user]);

  const { data: votableMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['votable-match-notification', user?.id],
    queryFn: fetchVotableMatch,
    enabled: !authLoading,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
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
            Vote for your MOTM now!
          </p>
          
          <Button
            onClick={() => {
              navigate('/voting');
              toast.dismiss(t); 
              setActiveToastId(null);
            }}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 mb-4"
          >
            Go to Voting Page <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
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
      // If the condition to show the toast is no longer met, dismiss it using the stored ID
      toast.dismiss(activeToastId);
      setActiveToastId(null);
    }
  }, [votableMatch, authLoading, matchLoading, location.pathname, activeToastId, navigate, user, queryClient]);

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
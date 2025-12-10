"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VOTING_GRACE_PERIOD_MINUTES = 8; // Voting ends 8 minutes after match status becomes 'finished'

const VotingNotification = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeToastId, setActiveToastId] = useState<string | number | null>(null);

  const fetchVotableMatch = useCallback(async () => {
    console.log("fetchVotableMatch: Starting fetch for votable matches...");
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
      console.error("fetchVotableMatch: Error fetching matches:", error);
      return null;
    }

    console.log("fetchVotableMatch: Fetched matches:", matches);

    const now = new Date();
    for (const match of matches || []) {
      let isVotingOpen = false;

      if (match.status === 'live') {
        isVotingOpen = true;
        console.log(`fetchVotableMatch: Match ${match.id} is LIVE, voting is open.`);
      } else if (match.status === 'finished' && match.updated_at) {
        const matchFinishedAt = new Date(match.updated_at);
        const votingEndsAt = new Date(matchFinishedAt.getTime() + VOTING_GRACE_PERIOD_MINUTES * 60 * 1000);
        if (now < votingEndsAt) {
          isVotingOpen = true;
          console.log(`fetchVotableMatch: Match ${match.id} is FINISHED, but within grace period. Voting ends at ${votingEndsAt.toISOString()}.`);
        } else {
          console.log(`fetchVotableMatch: Match ${match.id} is FINISHED, grace period ended at ${votingEndsAt.toISOString()}. Voting closed.`);
        }
      }

      if (isVotingOpen) {
        if (user) {
          const { data: existingVote } = await supabase
            .from('match_votes')
            .select('id')
            .eq('user_id', user.id)
            .eq('match_id', match.id)
            .maybeSingle();
          
          if (existingVote) {
            console.log(`fetchVotableMatch: User ${user.id} already voted for match ${match.id}. Skipping.`);
            continue; // User already voted for this match, check next match
          }
        } else {
          console.log(`fetchVotableMatch: User not logged in, but match ${match.id} is votable.`);
        }
        console.log(`fetchVotableMatch: Found votable match: ${match.id}`);
        return match; // This match is votable and user hasn't voted
      }
    }
    console.log("fetchVotableMatch: No votable matches found after checking all conditions.");
    return null; // No votable matches found
  }, [user]);

  const { data: votableMatch, isLoading: matchLoading } = useQuery({
    queryKey: ['votable-match-notification', user?.id],
    queryFn: fetchVotableMatch,
    enabled: !authLoading,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });

  useEffect(() => {
    console.log("VotingNotification useEffect: Checking conditions for toast display.");
    console.log(`  authLoading: ${authLoading}, matchLoading: ${matchLoading}, votableMatch: ${!!votableMatch}, location.pathname: ${location.pathname}, activeToastId: ${activeToastId}`);

    if (!authLoading && !matchLoading && votableMatch && location.pathname !== '/voting' && !activeToastId) {
      console.log("VotingNotification useEffect: All conditions met. Attempting to show toast.");
      const id = toast.custom((t) => {
        console.log("Toast created with ID:", t);
        return (
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
                console.log("Go to Voting Page button clicked. Dismissing toast and navigating.");
                toast.dismiss(t); 
                navigate('/voting');
              }}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 mb-4"
            >
              Go to Voting Page <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log("Close button clicked. Dismissing toast with ID:", t);
                toast.dismiss(t); 
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        );
      }, {
        duration: Infinity,
        position: 'bottom-right',
        onAutoClose: () => {
          console.log("Toast auto-closed. Clearing activeToastId.");
          setActiveToastId(null);
        },
        onDismiss: () => {
          console.log("Toast dismissed. Clearing activeToastId.");
          setActiveToastId(null);
        },
      });
      setActiveToastId(id);
    } else if ((!votableMatch || location.pathname === '/voting') && activeToastId) {
      console.log("VotingNotification useEffect: Conditions not met for showing toast, or navigating to voting page. Dismissing existing toast if any. ID:", activeToastId);
      toast.dismiss(activeToastId);
      setActiveToastId(null);
    } else {
      console.log("VotingNotification useEffect: No toast action taken.");
    }
  }, [votableMatch, authLoading, matchLoading, location.pathname, activeToastId, navigate, user, queryClient]);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (activeToastId) {
        console.log("Component unmounting. Dismissing active toast with ID:", activeToastId);
        toast.dismiss(activeToastId);
      }
    };
  }, [activeToastId]);

  return null;
};

export default VotingNotification;
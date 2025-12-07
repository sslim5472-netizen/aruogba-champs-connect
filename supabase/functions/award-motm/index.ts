// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    // This allows the function to bypass Row Level Security (RLS)
    // @ts-ignore
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const now = new Date();
    const VOTING_GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

    // 1. Find finished matches where voting window has closed and MOTM not yet awarded
    const { data: matchesToProcess, error: selectError } = await supabaseClient
      .from('matches')
      .select(`
        id,
        updated_at,
        motm_awards(id)
      `)
      .eq('status', 'finished')
      .is('motm_awards.id', null); // Only select matches without an existing MOTM award

    if (selectError) {
      throw new Error(`Failed to fetch matches to process: ${selectError.message}`);
    }

    let awardedCount = 0;

    for (const match of matchesToProcess || []) {
      const matchFinishedAt = new Date(match.updated_at);
      const votingEndsAt = new Date(matchFinishedAt.getTime() + VOTING_GRACE_PERIOD_MS);

      if (now > votingEndsAt) {
        // Voting window has closed for this match
        console.log(`Processing MOTM for match ${match.id}. Voting ended at ${votingEndsAt.toISOString()}`);

        // 2. Count votes for this match
        const { data: votes, error: votesError } = await supabaseClient
          .from('match_votes')
          .select('player_id')
          .eq('match_id', match.id);

        if (votesError) {
          console.error(`Error fetching votes for match ${match.id}: ${votesError.message}`);
          continue; // Skip to next match
        }

        if (!votes || votes.length === 0) {
          console.log(`No votes found for match ${match.id}. Skipping MOTM award.`);
          continue;
        }

        const voteCounts: { [playerId: string]: number } = {};
        votes.forEach(vote => {
          voteCounts[vote.player_id] = (voteCounts[vote.player_id] || 0) + 1;
        });

        // Find player(s) with the highest votes
        let maxVotes = 0;
        let topPlayers: string[] = [];

        for (const playerId in voteCounts) {
          if (voteCounts[playerId] > maxVotes) {
            maxVotes = voteCounts[playerId];
            topPlayers = [playerId];
          } else if (voteCounts[playerId] === maxVotes) {
            topPlayers.push(playerId);
          }
        }

        // Handle ties: if multiple players have max votes, pick one (e.g., first alphabetically, or just the first one found)
        const motmPlayerId = topPlayers.length > 0 ? topPlayers[0] : null;

        if (motmPlayerId) {
          // 3. Award MOTM
          const { error: insertError } = await supabaseClient
            .from('motm_awards')
            .insert([{ match_id: match.id, player_id: motmPlayerId }]);

          if (insertError) {
            console.error(`Error inserting MOTM award for match ${match.id}: ${insertError.message}`);
            continue;
          }

          // 4. Increment player's motm_awards count using the RPC function
          const { error: rpcError } = await supabaseClient
            .rpc('increment_player_motm_awards', { p_player_id: motmPlayerId });

          if (rpcError) {
            console.error(`Error incrementing MOTM count for player ${motmPlayerId}: ${rpcError.message}`);
            // This is not critical enough to roll back the MOTM award, but good to log.
          }

          awardedCount++;
          console.log(`MOTM awarded to player ${motmPlayerId} for match ${match.id}.`);
        } else {
          console.log(`Could not determine MOTM for match ${match.id} (no top player found).`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed MOTM awards. Awarded ${awardedCount} new MOTM(s).`,
      awardedCount: awardedCount,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in award-motm function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const MOTM_ELIGIBILITY_WINDOW_MINUTES = 8; // Matches user's requirement

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const now = new Date();
    console.log(`[determine-motm] Function started at: ${now.toISOString()}`);

    // 1. Find finished matches that haven't had an MOTM awarded yet AND whose voting window has closed
    const { data: matchesToConsider, error: matchesError } = await supabaseClient
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        updated_at,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('status', 'finished')
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('[determine-motm] Error fetching matches to consider:', matchesError);
      throw new Error('Failed to fetch matches for MOTM determination.');
    }

    if (!matchesToConsider || matchesToConsider.length === 0) {
      console.log('[determine-motm] No finished matches found to consider for MOTM.');
      return new Response(JSON.stringify({
        success: true,
        message: 'No finished matches found to consider for MOTM.',
        processedCount: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[determine-motm] Found ${matchesToConsider.length} finished matches to consider.`);
    const awardedMatches: string[] = [];
    let processedCount = 0;

    for (const match of matchesToConsider) {
      processedCount++;
      const matchFinishedAt = new Date(match.updated_at);
      const votingCutoffTime = new Date(matchFinishedAt.getTime() + MOTM_ELIGIBILITY_WINDOW_MINUTES * 60 * 1000);

      // Only process matches where the voting window has definitively closed
      if (now < votingCutoffTime) {
        console.log(`[determine-motm] Skipping match ${match.id} (${match.home_team.name} vs ${match.away_team.name}): Voting window still open (ends at ${votingCutoffTime.toISOString()}).`);
        continue;
      }

      console.log(`[determine-motm] Processing match ${match.id} (${match.home_team.name} vs ${match.away_team.name}). Voting window closed at ${votingCutoffTime.toISOString()}.`);

      // Check if an MOTM award already exists for this match to ensure idempotency
      const { data: existingAward, error: existingAwardError } = await supabaseClient
        .from('motm_awards')
        .select('id')
        .eq('match_id', match.id)
        .maybeSingle();

      if (existingAwardError) {
        console.error(`[determine-motm] Error checking for existing MOTM award for match ${match.id}:`, existingAwardError);
        continue; // Move to next match
      }

      if (existingAward) {
        console.log(`[determine-motm] MOTM award already exists for match ${match.id}. Skipping.`);
        continue; // Move to next match
      }

      // 2. Fetch votes for the match within the eligibility window
      const { data: votes, error: votesError } = await supabaseClient
        .from('match_votes')
        .select('player_id, created_at')
        .eq('match_id', match.id)
        .lte('created_at', votingCutoffTime.toISOString()); // Only consider votes cast within the window

      if (votesError) {
        console.error(`[determine-motm] Error fetching votes for match ${match.id}:`, votesError);
        continue; // Move to next match
      }

      if (!votes || votes.length === 0) {
        console.log(`[determine-motm] No votes found for match ${match.id} within the eligibility window.`);
        continue; // Move to next match
      }

      // 3. Aggregate votes
      const voteCounts: { [playerId: string]: number } = {};
      for (const vote of votes) {
        voteCounts[vote.player_id] = (voteCounts[vote.player_id] || 0) + 1;
      }

      // 4. Determine winner based on criteria with deterministic tie-breaker
      let motmPlayerId: string | null = null;
      let maxVotes = 0;
      let tiedPlayers: string[] = [];

      for (const playerId in voteCounts) {
        if (voteCounts[playerId] > maxVotes) {
          maxVotes = voteCounts[playerId];
          motmPlayerId = playerId;
          tiedPlayers = [playerId]; // Start new tie group
        } else if (voteCounts[playerId] === maxVotes) {
          tiedPlayers.push(playerId); // Add to tie group
        }
      }

      if (motmPlayerId) { // Removed the MOTM_VOTE_THRESHOLD check
        // Apply deterministic tie-breaker if there are multiple players with max votes
        if (tiedPlayers.length > 1) {
          // Sort by player_id (UUID) lexicographically to ensure deterministic tie-breaking
          tiedPlayers.sort();
          motmPlayerId = tiedPlayers[0];
          console.log(`[determine-motm] Tie detected for match ${match.id}. Players: ${tiedPlayers.join(', ')}. Deterministically selected ${motmPlayerId}.`);
        }

        // 5. Award MOTM
        console.log(`[determine-motm] Awarding MOTM for match ${match.id} to player ${motmPlayerId} with ${maxVotes} votes.`);
        const { error: insertError } = await supabaseClient
          .from('motm_awards')
          .insert([{ match_id: match.id, player_id: motmPlayerId }]);

        if (insertError) {
          console.error(`[determine-motm] Error inserting MOTM award for match ${match.id}:`, insertError);
        } else {
          awardedMatches.push(`${match.home_team.name} vs ${match.away_team.name}`);
          console.log(`[determine-motm] Successfully awarded MOTM for match ${match.id}.`);
        }
      } else {
        console.log(`[determine-motm] No eligible MOTM winner for match ${match.id}. No votes or no clear winner.`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processedCount} finished matches. Awarded MOTM for ${awardedMatches.length} matches.`,
      awardedMatches: awardedMatches,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[determine-motm] Unhandled error:", error);
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
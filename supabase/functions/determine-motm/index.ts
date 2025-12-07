import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const MOTM_VOTE_THRESHOLD = 10;
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
    // Create a Supabase client with the service role key
    // This allows the function to bypass Row Level Security (RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const now = new Date();
    console.log(`[determine-motm] Function started at: ${now.toISOString()}`);

    // 1. Find finished matches that haven't had an MOTM awarded yet
    const { data: eligibleMatches, error: matchesError } = await supabaseClient
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
      .is('motm_awards.id', null) // Ensure no MOTM award exists for this match
      .order('match_date', { ascending: true });

    if (matchesError) {
      console.error('[determine-motm] Error fetching eligible matches:', matchesError);
      throw new Error('Failed to fetch eligible matches.');
    }

    if (!eligibleMatches || eligibleMatches.length === 0) {
      console.log('[determine-motm] No finished matches found without an MOTM award.');
      return new Response(JSON.stringify({
        success: true,
        message: 'No finished matches found without an MOTM award.',
        processedCount: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[determine-motm] Found ${eligibleMatches.length} eligible matches.`);
    const awardedMatches: string[] = [];

    for (const match of eligibleMatches) {
      const matchFinishedAt = new Date(match.updated_at);
      const votingCutoffTime = new Date(matchFinishedAt.getTime() + MOTM_ELIGIBILITY_WINDOW_MINUTES * 60 * 1000);

      // Only process matches where the voting window has closed
      if (now < votingCutoffTime) {
        console.log(`[determine-motm] Skipping match ${match.id} (${match.home_team.name} vs ${match.away_team.name}): Voting window still open (ends at ${votingCutoffTime.toISOString()}).`);
        continue;
      }

      console.log(`[determine-motm] Processing match ${match.id} (${match.home_team.name} vs ${match.away_team.name}). Voting window closed at ${votingCutoffTime.toISOString()}.`);

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

      // 4. Determine winner based on criteria
      let motmPlayerId: string | null = null;
      let maxVotes = 0;

      for (const playerId in voteCounts) {
        if (voteCounts[playerId] > maxVotes) {
          maxVotes = voteCounts[playerId];
          motmPlayerId = playerId;
        }
      }

      if (motmPlayerId && maxVotes >= MOTM_VOTE_THRESHOLD) {
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
        console.log(`[determine-motm] No eligible MOTM winner for match ${match.id}. Highest votes: ${maxVotes} (threshold: ${MOTM_VOTE_THRESHOLD}).`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${eligibleMatches.length} finished matches. Awarded MOTM for ${awardedMatches.length} matches.`,
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
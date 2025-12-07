/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/std@0.190.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const now = new Date().toISOString();

    // Find scheduled matches whose match_date is now or in the past
    const { data: matchesToUpdate, error: selectError } = await supabaseClient
      .from('matches')
      .select('id, match_date, status')
      .eq('status', 'scheduled')
      .lte('match_date', now);

    if (selectError) {
      console.error('Error selecting matches:', selectError);
      throw new Error('Failed to fetch matches for status update.');
    }

    if (!matchesToUpdate || matchesToUpdate.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No scheduled matches to update to live.',
        updatedCount: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const matchIdsToUpdate = matchesToUpdate.map(match => match.id);

    // Update the status of these matches to 'live'
    const { error: updateError } = await supabaseClient
      .from('matches')
      .update({ status: 'live' })
      .in('id', matchIdsToUpdate);

    if (updateError) {
      console.error('Error updating match statuses:', updateError);
      throw new Error('Failed to update match statuses to live.');
    }

    console.log(`Successfully updated ${matchIdsToUpdate.length} matches to 'live'.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${matchIdsToUpdate.length} matches to 'live'.`,
      updatedCount: matchIdsToUpdate.length,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in update-match-status function:", error);
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
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star } from "lucide-react";
import { format } from "date-fns";
// import { getTeamLogo } from "@/lib/teamUtils"; // No longer needed for player initials

const MotmAwards = () => {
  const { data: awards, isLoading, error } = useQuery({
    queryKey: ["motm-awards-public"],
    queryFn: async () => {
      console.log("Fetching MOTM awards for public page...");
      const { data, error } = await supabase
        .from('motm_awards')
        .select(`
          id,
          created_at,
          match_id,
          player_id,
          player:players(
            name,
            photo_url,
            team:teams(name, color, logo_url)
          ),
          match:matches(
            match_date,
            home_score,
            away_score,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching MOTM awards:", error);
        throw error;
      }
      console.log("Fetched MOTM awards data:", data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Loading winners...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-destructive">Error loading MOTM awards: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <Award className="w-16 h-16 mx-auto mb-4 text-gold" />
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Man of the Match Winners
          </h1>
          <p className="text-muted-foreground">
            Celebrating the top performers from each game
          </p>
        </div>

        {awards?.length === 0 ? (
          <div className="text-center text-muted-foreground glass-card p-12 rounded-xl">
            No awards have been given out yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards?.map((award: any) => (
              <div key={award.id} className="glass-card rounded-xl p-6 text-center group hover:glow-effect transition-all">
                {award.player.photo_url ? (
                  <img
                    src={award.player.photo_url}
                    alt={award.player.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4"
                    style={{ borderColor: award.player.team.color }}
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} // Fallback for broken images
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl font-bold uppercase border-4"
                    style={{ 
                      backgroundColor: `${award.player.team.color}33`, // Lighter background with team color
                      color: award.player.team.color, // Text color with team color
                      borderColor: award.player.team.color 
                    }}
                  >
                    {award.player.name.charAt(0)}
                  </div>
                )}
                
                <h3 className="text-2xl font-heading flex items-center justify-center gap-2">
                  {award.player.name}
                  <Star className="w-5 h-5 text-gold fill-gold" />
                </h3>
                <p className="text-muted-foreground mb-4">{award.player.team.name}</p>
                
                <div className="text-xs p-2 rounded-lg bg-gold/10 text-gold font-semibold inline-flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4" />
                  MAN OF THE MATCH
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  <p className="font-semibold">
                    {award.match.home_team.name} {award.match.home_score} - {award.match.away_score} {award.match.away_team.name}
                  </p>
                  <p className="text-muted-foreground">{format(new Date(award.match.match_date), "MMMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotmAwards;
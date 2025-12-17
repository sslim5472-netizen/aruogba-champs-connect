import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star } from "lucide-react"; // Added Star icon
import { format } from "date-fns";

const MotmAwards = () => {
  const { data: awards, isLoading } = useQuery({
    queryKey: ["motm-awards-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motm_awards')
        .select(`
          *,
          match:matches!inner(*, home_team:teams!matches_home_team_id_fkey(name, logo_url), away_team:teams!matches_away_team_id_fkey(name, logo_url)),
          player:players!inner(*, team:teams!inner(name, color, logo_url, photo_url))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading winners...</div>
        ) : awards?.length === 0 ? (
          <div className="text-center text-muted-foreground glass-card p-12 rounded-xl">
            No awards have been given out yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards?.map((award: any) => (
              <div key={award.id} className="glass-card rounded-xl p-6 text-center group hover:glow-effect transition-all">
                <img
                  src={award.player.photo_url || award.player.team.logo_url}
                  alt={award.player.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4"
                  style={{ borderColor: award.player.team.color }}
                />
                <h3 className="text-2xl font-heading flex items-center justify-center gap-2">
                  {award.player.name}
                  <Star className="w-5 h-5 text-gold fill-gold" /> {/* Star for the winner */}
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
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Fixtures = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order("match_date", { ascending: true });

      if (!error && data) {
        setMatches(data);
      }
      setLoading(false);
    };

    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Match Schedule
          </h1>
          <p className="text-muted-foreground">
            End of Year In-House Tournament
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-muted-foreground">No matches scheduled yet</div>
        ) : (
          <div>
          {matches.map((match, index) => (
            <div key={index} className="glass-card p-6 rounded-xl hover:glow-effect transition-all">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-heading text-lg">
                      {format(new Date(match.match_date), "MMM d, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.match_date), "h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-center">
                  <div className="text-right flex-1">
                    <div className="font-heading text-lg">{match.home_team?.name}</div>
                  </div>
                  
                  <div className="px-4 py-2 bg-muted rounded-lg font-heading text-sm">
                    VS
                  </div>
                  
                  <div className="text-left flex-1">
                    <div className="font-heading text-lg">{match.away_team?.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue || "Main Pitch"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export default Fixtures;
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTeamLogo } from "@/lib/teamUtils";

const UpcomingMatchesSection = () => {
  const { data: upcomingMatches, isLoading } = useQuery({
    queryKey: ["upcoming-matches-homepage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          venue,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        `)
        .eq("status", "scheduled")
        .order("match_date", { ascending: true })
        .limit(3); // Show up to 3 upcoming matches
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading upcoming matches...</div>
    );
  }

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No upcoming matches currently scheduled.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-heading gradient-text text-center mb-6">
        Upcoming Matches
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingMatches.map((match) => (
          <div key={match.id} className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <div className="font-heading text-lg">
                  {format(new Date(match.match_date), "MMM d, yyyy")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(match.match_date), "h:mm a")}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex flex-col items-center flex-1">
                <img 
                  src={getTeamLogo(match.home_team.name, match.home_team.logo_url)} 
                  alt={match.home_team.name}
                  className="w-16 h-16 rounded-full object-contain border-2 border-border mb-2"
                />
                <span className="font-heading text-sm text-center">{match.home_team.name}</span>
              </div>
              <span className="font-heading text-xl text-muted-foreground">VS</span>
              <div className="flex flex-col items-center flex-1">
                <img 
                  src={getTeamLogo(match.away_team.name, match.away_team.logo_url)} 
                  alt={match.away_team.name}
                  className="w-16 h-16 rounded-full object-contain border-2 border-border mb-2"
                />
                <span className="font-heading text-sm text-center">{match.away_team.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{match.venue || "Main Pitch"}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/fixtures">
          <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
            View All Fixtures <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UpcomingMatchesSection;
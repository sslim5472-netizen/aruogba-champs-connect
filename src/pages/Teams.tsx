import Navigation from "@/components/Navigation";
import TeamCard from "@/components/TeamCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define a type for the team data including player count
interface TeamWithPlayerCount {
  id: string;
  name: string;
  captain_name: string;
  logo_url: string;
  color: string;
  player_count: number;
  played: number; // Added played column
}

const Teams = () => {
  const { data: teams, isLoading } = useQuery<TeamWithPlayerCount[]>({
    queryKey: ["teams-with-player-count"],
    queryFn: async () => {
      console.log("Fetching teams with player count...");
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, captain_name, logo_url, color, played"); // Select 'played'
        // .order("name"); // Removed order by name to allow sorting by points
      
      if (teamsError) {
        console.error("Error fetching teams data:", teamsError);
        throw teamsError;
      }
      console.log("Teams data:", teamsData);

      // For each team, fetch the count of players
      const teamsWithCounts = await Promise.all(
        teamsData.map(async (team) => {
          const { count, error: countError } = await supabase
            .from("players")
            .select("id", { count: "exact" })
            .eq("team_id", team.id);

          if (countError) {
            console.error(`Error fetching player count for team ${team.name}:`, countError);
            return { ...team, player_count: 0 }; // Default to 0 on error
          }
          return { ...team, player_count: count || 0 };
        })
      );
      console.log("Teams with player counts:", teamsWithCounts);
      return teamsWithCounts;
    },
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Tournament Teams
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Six elite teams competing for glory in the Aruogba Champion League 2025
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
            {teams?.map((team) => (
              <TeamCard 
                key={team.id} 
                name={team.name} 
                captain_name={team.captain_name} 
                logo={team.logo_url} 
                color={team.color} 
                playerCount={team.player_count} // Pass the dynamic count
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
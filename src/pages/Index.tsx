import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Countdown from "@/components/Countdown";
import TeamCard from "@/components/TeamCard";
import UpcomingMatchesSection from "@/components/UpcomingMatchesSection"; // Import the new component
import TournamentAwards from "@/components/TournamentAwards"; // New import
import { Trophy, Calendar, BarChart3, Radio, Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

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

const Index = () => {
  const { user, userRole, loading: authLoading } = useAuth(); // Use auth context
  const { data: teams, isLoading: teamsLoading } = useQuery<TeamWithPlayerCount[]>({
    queryKey: ["teams-with-player-count-index"], // Unique query key
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, captain_name, logo_url, color, played") // Select 'played'
        .order("name");

      if (teamsError) throw teamsError;

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
      return teamsWithCounts;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden flex-grow">
        <div className="absolute inset-0 stars-bg opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-heading gradient-text mb-6">
              ARUOGBA FC
            </h1>
            <p className="text-xl md:text-2xl text-silver mb-4">
              End of Year Champion League 2025
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six teams. One champion. Experience the thrill of competitive 7-a-side football
              in our premier year-end tournament.
            </p>
          </div>

          <Countdown />

          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <Link to="/live">
              <Button className="bg-gradient-to-r from-red-600 to-red-800 hover:opacity-90 text-lg px-8 py-6">
                <Radio className="w-5 h-5 mr-2" />
                Live Match
              </Button>
            </Link>
            {/* Removed Vote MOTM button */}
            <Link to="/fixtures">
              <Button variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <Calendar className="w-5 h-5 mr-2" />
                View Fixtures
              </Button>
            </Link>
            <Link to="/stats">
              <Button variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Stats
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Matches Section */}
      <div className="container mx-auto px-4 py-20">
        <UpcomingMatchesSection />
      </div>

      {/* Teams Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-heading gradient-text mb-4">
            Teams
          </h2>
          <p className="text-muted-foreground">
            Meet the six teams battling for tournament glory
          </p>
        </div>

        {teamsLoading ? (
          <div className="text-center text-muted-foreground">Loading teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-scale-in">
            {teams?.map((team) => (
              <TeamCard 
                key={team.id} 
                name={team.name} 
                captain_name={team.captain_name} 
                logo={team.logo_url} 
                color={team.color} 
                playerCount={team.player_count} 
              />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/teams">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Trophy className="w-4 h-4 mr-2" />
              Explore All Teams
            </Button>
          </Link>
        </div>
      </div>

      {/* Tournament Awards Section */}
      <div className="container mx-auto px-4 py-20">
        <TournamentAwards />
      </div>

      {/* Admin Panel Section */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {!authLoading && user && userRole === 'admin' ? (
              <Link to="/admin">
                <Button variant="outline" className="border-muted-foreground/30 hover:bg-muted/50">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Link to="/admin/login">
                <Button variant="outline" className="border-muted-foreground/30 hover:bg-muted/50">
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
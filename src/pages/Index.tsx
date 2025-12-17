import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Countdown from "@/components/Countdown";
import TeamCard from "@/components/TeamCard";
import { Trophy, Calendar, BarChart3, Vote, Radio, Shield, Target, Award, Star } from "lucide-react"; // Added Star icon
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Import Card component
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
}

const Index = () => {
  const { data: teams, isLoading } = useQuery<TeamWithPlayerCount[]>({
    queryKey: ["teams-with-player-count-index"], // Unique query key
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, captain_name, logo_url, color")
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
            <Link to="/voting">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6">
                <Vote className="w-5 h-5 mr-2" />
                Vote MOTM
              </Button>
            </Link>
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

        {isLoading ? (
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

      {/* Tournament Champions & Awards Section */}
      <div className="border-t border-border/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-heading gradient-text mb-4">
              Tournament Champions & Awards
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Celebrating the outstanding achievements of the tournament
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
            {/* Tournament Winner */}
            <Card className="glass-card p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <Trophy className="w-16 h-16 text-gold fill-gold mb-4 animate-glow-pulse" />
              <h3 className="text-xl font-heading mb-2">Tournament Winners</h3>
              <p className="text-3xl font-heading gradient-text">Stars FC</p>
            </Card>

            {/* Highest Goal Scorer */}
            <Card className="glass-card p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <Target className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-xl font-heading mb-2">Highest Goal Scorer</h3>
              <p className="text-3xl font-heading gradient-text">Eric Zexy</p>
            </Card>

            {/* Highest Assist & Best Player */}
            <Card className="glass-card p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <Award className="w-16 h-16 text-accent mb-4" />
              <h3 className="text-xl font-heading mb-2">Highest Assist & Best Player</h3>
              <p className="text-3xl font-heading gradient-text">Awe</p>
            </Card>

            {/* Best Defender */}
            <Card className="glass-card p-6 rounded-xl text-center flex flex-col items-center justify-center">
              <Shield className="w-16 h-16 text-silver mb-4" />
              <h3 className="text-xl font-heading mb-2">Best Defender</h3>
              <p className="text-3xl font-heading gradient-text">Papa Oblock</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Admin Panel Section */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Link to="/admin/login">
              <Button variant="outline" className="border-muted-foreground/30 hover:bg-muted/50">
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
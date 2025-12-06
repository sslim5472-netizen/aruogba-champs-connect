import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getTeamLogo } from "@/lib/teamUtils"; // Import the new utility

interface TeamStat {
  id: string;
  name: string;
  logo_url: string;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

const Standings = () => {
  const navigate = useNavigate();

  const getTeamSlug = (teamName: string) => {
    return teamName.toLowerCase().replace(/\s+/g, '-');
  };

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ["league-standings-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url, wins, draws, losses, goals_for, goals_against")
        .order("name");
      if (error) throw error;
      return data as TeamStat[];
    },
  });

  const standings = teamsData
    ? teamsData
        .map(team => ({
            ...team,
            played: (team.wins || 0) + (team.draws || 0) + (team.losses || 0),
            points: (team.wins || 0) * 3 + (team.draws || 0) * 1,
            goal_difference: (team.goals_for || 0) - (team.goals_against || 0),
        }))
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
            return a.name.localeCompare(b.name);
        })
    : [];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/stats")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stats
        </Button>

        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading gradient-text">
              League Standings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Official team rankings for the tournament
          </p>
        </div>

        <div className="max-w-4xl mx-auto animate-scale-in">
          <div className="glass-card p-6 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-heading text-sm">#</th>
                    <th className="text-left p-3 font-heading text-sm">Team</th>
                    <th className="text-center p-3 font-heading text-sm">Played</th>
                    <th className="text-center p-3 font-heading text-sm">Wins</th>
                    <th className="text-center p-3 font-heading text-sm">Draws</th>
                    <th className="text-center p-3 font-heading text-sm">Losses</th>
                    <th className="text-center p-3 font-heading text-sm">GF</th>
                    <th className="text-center p-3 font-heading text-sm">GA</th>
                    <th className="text-center p-3 font-heading text-sm">GD</th>
                    <th className="text-center p-3 font-heading text-sm">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center p-6 text-muted-foreground">Loading standings...</td>
                    </tr>
                  ) : (
                    standings.map((team, index) => (
                      <tr 
                        key={team.id} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/teams/${getTeamSlug(team.name)}`)}
                      >
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3 font-heading flex items-center gap-3">
                          <img 
                            src={getTeamLogo(team.name, team.logo_url)} 
                            alt={team.name}
                            className="w-6 h-6 rounded-full object-contain border border-border"
                          />
                          {team.name}
                        </td>
                        <td className="p-3 text-center">{team.played}</td>
                        <td className="p-3 text-center">{team.wins}</td>
                        <td className="p-3 text-center">{team.draws}</td>
                        <td className="p-3 text-center">{team.losses}</td>
                        <td className="p-3 text-center">{team.goals_for}</td>
                        <td className="p-3 text-center">{team.goals_against}</td>
                        <td className="p-3 text-center">{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                        <td className="p-3 text-center font-heading text-primary">{team.points}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Standings;
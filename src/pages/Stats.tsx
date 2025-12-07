import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Trophy, Target, Shield, AlertTriangle, AlertOctagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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

interface PlayerStat {
  name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  teams: { name: string };
}

const Stats = () => {
  const navigate = useNavigate();
  const [loadingStats, setLoadingStats] = useState(true);
  const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
  const [topAssists, setTopAssists] = useState<PlayerStat[]>([]);
  const [topYellowCards, setTopYellowCards] = useState<PlayerStat[]>([]);
  const [topRedCards, setTopRedCards] = useState<PlayerStat[]>([]);

  const getTeamSlug = (teamName: string) => {
    return teamName.toLowerCase().replace(/\s+/g, '-');
  };

  // Fetch all teams for standings
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["league-standings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url, wins, draws, losses, goals_for, goals_against")
        .order("name");
      if (error) throw error;
      return data as TeamStat[];
    },
  });

  // Calculate standings and sort
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
            return a.name.localeCompare(b.name); // Alphabetical tiebreaker
        })
    : [];


  useEffect(() => {
    const fetchStats = async () => {
      // Fetch top scorers
      const { data: scorers } = await supabase
        .from("players")
        .select("name, goals, teams(name)")
        .order("goals", { ascending: false })
        .limit(5);

      // Fetch top assists
      const { data: assists } = await supabase
        .from("players")
        .select("name, assists, teams(name)")
        .order("assists", { ascending: false })
        .limit(5);

      // Fetch top yellow cards
      const { data: yellowCards } = await supabase
        .from("players")
        .select("name, yellow_cards, teams(name)")
        .order("yellow_cards", { ascending: false })
        .limit(5);

      // Fetch top red cards
      const { data: redCards } = await supabase
        .from("players")
        .select("name, red_cards, teams(name)")
        .order("red_cards", { ascending: false })
        .limit(5);

      // Filter out players with 0 stats before setting state
      if (scorers) setTopScorers(scorers.filter(p => p.goals > 0) as PlayerStat[]);
      if (assists) setTopAssists(assists.filter(p => p.assists > 0) as PlayerStat[]);
      if (yellowCards) setTopYellowCards(yellowCards.filter(p => p.yellow_cards > 0) as PlayerStat[]);
      if (redCards) setTopRedCards(redCards.filter(p => p.red_cards > 0) as PlayerStat[]);
      setLoadingStats(false);
    };

    fetchStats();
  }, []);

  const loading = teamsLoading || loadingStats;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Tournament Statistics
          </h1>
          <p className="text-muted-foreground">
            Player rankings and team performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
          
          {/* Standings Table - MOVED TO TOP */}
          <div 
            className="glass-card p-6 rounded-xl md:col-span-2 cursor-pointer hover:glow-effect transition-shadow"
            onClick={() => navigate("/standings")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading">League Standings</h2>
              </div>
              <span className="text-sm text-muted-foreground">View Full Table →</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-heading text-sm">#</th>
                    <th className="text-left p-3 font-heading text-sm">Team</th>
                    <th className="text-center p-3 font-heading text-sm">P</th>
                    <th className="text-center p-3 font-heading text-sm">W</th>
                    <th className="text-center p-3 font-heading text-sm">D</th>
                    <th className="text-center p-3 font-heading text-sm">L</th>
                    <th className="text-center p-3 font-heading text-sm">GD</th>
                    <th className="text-center p-3 font-heading text-sm">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center p-6 text-muted-foreground">Loading standings...</td>
                    </tr>
                  ) : (
                    standings.map((team, index) => (
                      <tr 
                        key={team.id} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering parent card click
                          navigate(`/teams/${getTeamSlug(team.name)}`);
                        }}
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
                        <td className="p-3 text-center">{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                        <td className="p-3 text-center font-heading text-primary">{team.points}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Scorers */}
          <div 
            className="glass-card p-6 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/stats/top-scorers")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading">Top Scorers</h2>
              </div>
              <span className="text-sm text-muted-foreground">Click to view all →</span>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : topScorers.length === 0 ? (
              <div className="text-center text-muted-foreground">No top scorers available yet.</div>
            ) : (
              <div className="space-y-3">
                {topScorers.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => player.teams?.name && navigate(`/teams/${getTeamSlug(player.teams.name)}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-heading text-gold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-heading">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teams?.name}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-heading text-primary">{player.goals}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Assists */}
          <div 
            className="glass-card p-6 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/stats/top-assists")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading">Top Assists</h2>
              </div>
              <span className="text-sm text-muted-foreground">Click to view all →</span>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : topAssists.length === 0 ? (
              <div className="text-center text-muted-foreground">No top assists available yet.</div>
            ) : (
              <div className="space-y-3">
                {topAssists.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => player.teams?.name && navigate(`/teams/${getTeamSlug(player.teams.name)}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-silver/20 flex items-center justify-center font-heading text-silver">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-heading">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teams?.name}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-heading text-accent">{player.assists}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Yellow Cards */}
          <div 
            className="glass-card p-6 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/stats/top-yellow-cards")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading">Most Yellow Cards</h2>
              </div>
              <span className="text-sm text-muted-foreground">Click to view all →</span>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : topYellowCards.length === 0 ? (
              <div className="text-center text-muted-foreground">No top yellow cards available yet.</div>
            ) : (
              <div className="space-y-3">
                {topYellowCards.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => player.teams?.name && navigate(`/teams/${getTeamSlug(player.teams.name)}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center font-heading text-yellow-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-heading">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teams?.name}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-heading text-yellow-600">{player.yellow_cards}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Red Cards */}
          <div 
            className="glass-card p-6 rounded-xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/stats/top-red-cards")}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-3 rounded-lg">
                  <AlertOctagon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-heading">Most Red Cards</h2>
              </div>
              <span className="text-sm text-muted-foreground">Click to view all →</span>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : topRedCards.length === 0 ? (
              <div className="text-center text-muted-foreground">No top red cards available yet.</div>
            ) : (
              <div className="space-y-3">
                {topRedCards.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => player.teams?.name && navigate(`/teams/${getTeamSlug(player.teams.name)}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center font-heading text-red-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-heading">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teams?.name}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-heading text-red-600">{player.red_cards}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
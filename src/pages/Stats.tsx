import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Trophy, Target, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Stats = () => {
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (scorers) setTopScorers(scorers);
      if (assists) setTopAssists(assists);
      setLoading(false);
    };

    fetchStats();
  }, []);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-scale-in">
          {/* Top Scorers */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-heading">Top Scorers</h2>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3">
                {topScorers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-heading">Top Assists</h2>
            </div>
            
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3">
                {topAssists.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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

          {/* Standings Table */}
          <div className="glass-card p-6 rounded-xl lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-heading">League Standings</h2>
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
                  {["Airway FC", "Knights FC", "Stars FC", "Sparta FC", "Kings FC", "Enjoyment FC"].map((team, index) => (
                    <tr key={team} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3 font-heading">{team}</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center">0</td>
                      <td className="p-3 text-center font-heading text-primary">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
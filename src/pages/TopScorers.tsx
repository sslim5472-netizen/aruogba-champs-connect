import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Target, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const TopScorers = () => {
  const navigate = useNavigate();
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getTeamSlug = (teamName: string) => {
    return teamName.toLowerCase().replace(/\s+/g, '-');
  };

  useEffect(() => {
    const fetchTopScorers = async () => {
      const { data: scorers } = await supabase
        .from("players")
        .select("name, goals, teams(name)")
        .order("goals", { ascending: false })
        .limit(10);

      if (scorers) setTopScorers(scorers);
      setLoading(false);
    };

    fetchTopScorers();
  }, []);

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
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading gradient-text">
              Top 10 Goal Scorers
            </h1>
          </div>
          <p className="text-muted-foreground">
            Leading goal scorers in the tournament
          </p>
        </div>

        <div className="max-w-3xl mx-auto animate-scale-in">
          <div className="glass-card p-6 rounded-xl">
            {loading ? (
              <div className="text-center text-muted-foreground py-12">Loading...</div>
            ) : (
              <div className="space-y-3">
                {topScorers.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => player.teams?.name && navigate(`/teams/${getTeamSlug(player.teams.name)}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-lg ${
                        index === 0 ? 'bg-gold/30 text-gold' :
                        index === 1 ? 'bg-silver/30 text-silver' :
                        index === 2 ? 'bg-bronze/30 text-bronze' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-heading text-lg">{player.name}</div>
                        <div className="text-sm text-muted-foreground">{player.teams?.name}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-heading text-primary">{player.goals}</div>
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

export default TopScorers;

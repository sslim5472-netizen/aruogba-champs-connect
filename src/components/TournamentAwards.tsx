import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Goal, Award, Shield, Crown } from "lucide-react";
import { getTeamLogo } from "@/lib/teamUtils";
import { Card } from "@/components/ui/card";

const TournamentAwards = () => {
  // Fetch Stars FC team details
  const { data: starsFcTeam, isLoading: teamLoading } = useQuery({
    queryKey: ["team-stars-fc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url, color")
        .ilike("name", "Stars FC")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch individual award winners
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["award-winning-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, photo_url, team:teams(name, color, logo_url)")
        .in("name", ["Eric Zexy", "Awe", "Papa Oblock"]);
      if (error) throw error;
      return data;
    },
  });

  const ericZexy = players?.find(p => p.name === "Eric Zexy");
  const awe = players?.find(p => p.name === "Awe");
  const papaOblock = players?.find(p => p.name === "Papa Oblock");

  const isLoading = teamLoading || playersLoading;

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading tournament awards...</div>
    );
  }

  return (
    <div className="space-y-12">
      <h2 className="text-3xl md:text-4xl font-heading gradient-text text-center mb-6">
        Tournament Champions & Individual Honors
      </h2>

      {/* Tournament Winner */}
      <Card className="glass-card p-8 rounded-xl text-center max-w-2xl mx-auto hover:glow-effect transition-all">
        <Crown className="w-16 h-16 mx-auto mb-4 text-gold fill-gold" />
        <h3 className="text-3xl md:text-4xl font-heading gradient-text mb-4">
          Tournament Winners
        </h3>
        {starsFcTeam ? (
          <>
            <div 
              className="w-40 h-40 mx-auto mb-4 rounded-full flex items-center justify-center p-4"
              style={{ 
                background: `linear-gradient(135deg, ${starsFcTeam.color}33, ${starsFcTeam.color}66)`,
                border: `3px solid ${starsFcTeam.color}`
              }}
            >
              <img 
                src={getTeamLogo(starsFcTeam.name, starsFcTeam.logo_url)} 
                alt={starsFcTeam.name} 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
            </div>
            <p className="text-4xl font-heading text-white">{starsFcTeam.name}</p>
          </>
        ) : (
          <p className="text-xl text-muted-foreground">Stars FC</p>
        )}
      </Card>

      {/* Individual Awards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Highest Goal Scorer */}
        <Card className="glass-card p-6 rounded-xl text-center hover:glow-effect transition-all">
          <Goal className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-heading mb-2">Highest Goal Scorer</h3>
          {ericZexy ? (
            <>
              {ericZexy.photo_url ? (
                <img src={ericZexy.photo_url} alt={ericZexy.name} className="w-24 h-24 rounded-full mx-auto mb-2 object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center text-4xl font-bold uppercase bg-muted text-muted-foreground">
                  {ericZexy.name.charAt(0)}
                </div>
              )}
              <p className="text-2xl font-heading text-white">{ericZexy.name}</p>
              <p className="text-sm text-muted-foreground">{ericZexy.team?.name}</p>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">Eric Zexy</p>
          )}
        </Card>

        {/* Highest Assist & Best Player */}
        <Card className="glass-card p-6 rounded-xl text-center hover:glow-effect transition-all">
          <Award className="w-12 h-12 mx-auto mb-4 text-gold fill-gold" />
          <h3 className="text-xl font-heading mb-2">Highest Assist & Best Player</h3>
          {awe ? (
            <>
              {awe.photo_url ? (
                <img src={awe.photo_url} alt={awe.name} className="w-24 h-24 rounded-full mx-auto mb-2 object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center text-4xl font-bold uppercase bg-muted text-muted-foreground">
                  {awe.name.charAt(0)}
                </div>
              )}
              <p className="text-2xl font-heading text-white">{awe.name}</p>
              <p className="text-sm text-muted-foreground">{awe.team?.name}</p>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">Awe</p>
          )}
        </Card>

        {/* Best Defender */}
        <Card className="glass-card p-6 rounded-xl text-center hover:glow-effect transition-all">
          <Shield className="w-12 h-12 mx-auto mb-4 text-silver" />
          <h3 className="text-xl font-heading mb-2">Best Defender</h3>
          {papaOblock ? (
            <>
              {papaOblock.photo_url ? (
                <img src={papaOblock.photo_url} alt={papaOblock.name} className="w-24 h-24 rounded-full mx-auto mb-2 object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center text-4xl font-bold uppercase bg-muted text-muted-foreground">
                  {papaOblock.name.charAt(0)}
                </div>
              )}
              <p className="text-2xl font-heading text-white">{papaOblock.name}</p>
              <p className="text-sm text-muted-foreground">{papaOblock.team?.name}</p>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">Papa Oblock</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TournamentAwards;
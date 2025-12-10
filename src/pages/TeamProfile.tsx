import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Target, Shield, AlertCircle } from "lucide-react";
import { getTeamLogo } from "@/lib/teamUtils"; // Import the new utility

const TeamProfile = () => {
  const { teamSlug } = useParams();
  
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamSlug],
    queryFn: async () => {
      // Convert slug to proper team name format
      // Handle special case for "FC" which should be uppercase
      const teamName = teamSlug
        ?.split('-')
        .map(word => word.toUpperCase() === 'FC' ? 'FC' : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const { data, error } = await supabase
        .from('teams')
        .select('*, played') // Select 'played' column
        .ilike('name', teamName || '')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players', team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', team.id)
        .order('jersey_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!team?.id,
  });

  if (teamLoading || playersLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Team not found</div>
        </div>
      </div>
    );
  }

  const stats = {
    totalGoals: players?.reduce((sum, p) => sum + (p.goals || 0), 0) || 0,
    totalAssists: players?.reduce((sum, p) => sum + (p.assists || 0), 0) || 0,
    matchesPlayed: team.played || 0, // Use the new 'played' column
  };

  // Use the centralized getTeamLogo utility
  const logoSrc = getTeamLogo(team.name, team.logo_url);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Team Header */}
        <div className="glass-card p-8 rounded-xl mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center p-6"
              style={{ 
                background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
                border: `3px solid ${team.color}`
              }}
            >
              <img src={logoSrc} alt={team.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-2">{team.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">
                Captain: <span className="text-silver">{team.captain_name}</span>
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm">{stats.totalGoals} Goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-silver" />
                  <span className="text-sm">{stats.matchesPlayed} Matches Played</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Squad Roster */}
        <div className="mb-8">
          <h2 className="text-3xl font-heading gradient-text mb-6">Squad Roster</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players?.map((player) => (
              <div key={player.id} className="glass-card p-6 rounded-xl hover:glow-effect transition-all">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center font-heading text-2xl font-bold"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
                      color: team.color
                    }}
                  >
                    {player.jersey_number}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-heading text-lg mb-1 flex items-center gap-2">
                      {player.name}
                      {player.is_captain && (
                        <Shield className="w-4 h-4 text-gold" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{player.position}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Goals:</span>
                        <span className="font-heading text-primary">{player.goals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assists:</span>
                        <span className="font-heading text-accent">{player.assists}</span>
                      </div>
                      {player.position === 'Goalkeeper' && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">Clean Sheets:</span>
                          <span className="font-heading text-gold">{player.clean_sheets}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;
import Navigation from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Goal, Users, Award, Shield, CalendarDays } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Stats = () => {
  // Fetch Top Scorers
  const { data: topScorers, isLoading: isLoadingScorers, error: scorersError } = useQuery({
    queryKey: ['topScorers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, goals_scored, team:teams(name, logo_url, color)')
        .order('goals_scored', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Fetch Top Assists
  const { data: topAssists, isLoading: isLoadingAssists, error: assistsError } = useQuery({
    queryKey: ['topAssists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, assists, team:teams(name, logo_url, color)')
        .order('assists', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Fetch Top MOTM Awards
  const { data: topMotm, isLoading: isLoadingMotm, error: motmError } = useQuery({
    queryKey: ['topMotm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, motm_awards, team:teams(name, logo_url, color)')
        .order('motm_awards', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Fetch Team Standings (simplified for now, assuming points are calculated elsewhere or directly stored)
  const { data: teamStandings, isLoading: isLoadingStandings, error: standingsError } = useQuery({
    queryKey: ['teamStandings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url, color, wins, draws, losses, points, goals_for, goals_against')
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false }); // Tie-breaker
      if (error) throw error;
      return data;
    },
  });

  // Fetch Upcoming Matches (Next 3)
  const { data: upcomingMatches, isLoading: isLoadingUpcoming, error: upcomingError } = useQuery({
    queryKey: ['upcomingMatches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        `)
        .eq('status', 'scheduled')
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const renderLoading = () => (
    <div className="text-center text-muted-foreground py-8">Loading stats...</div>
  );

  const renderError = (error: any) => (
    <div className="text-center text-destructive py-8">Error: {error?.message || "Failed to load data."}</div>
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Tournament Statistics
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dive deep into the numbers: top scorers, assists, MOTM awards, and team standings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Top Scorers */}
          <Card className="glass-card animate-slide-in-left">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Goal className="w-5 h-5 text-red-500" /> Top Scorers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingScorers ? renderLoading() : scorersError ? renderError(scorersError) : (
                <ol className="space-y-3">
                  {topScorers?.map((player, index) => (
                    <li key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6 text-center">{index + 1}.</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.team?.logo_url || "/placeholder-team.png"} alt={player.team?.name || "Team"} />
                          <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-heading text-primary">{player.goals_scored} Goals</span>
                    </li>
                  ))}
                  {(!topScorers || topScorers.length === 0) && <p className="text-muted-foreground text-center">No scorers yet.</p>}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Top Assists */}
          <Card className="glass-card animate-slide-in-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Top Assists
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAssists ? renderLoading() : assistsError ? renderError(assistsError) : (
                <ol className="space-y-3">
                  {topAssists?.map((player, index) => (
                    <li key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6 text-center">{index + 1}.</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.team?.logo_url || "/placeholder-team.png"} alt={player.team?.name || "Team"} />
                          <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-heading text-primary">{player.assists} Assists</span>
                    </li>
                  ))}
                  {(!topAssists || topAssists.length === 0) && <p className="text-muted-foreground text-center">No assists yet.</p>}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Top MOTM Awards */}
          <Card className="glass-card animate-slide-in-right">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-heading flex items-center gap-2">
                <Award className="w-5 h-5 text-gold fill-gold" /> Most MOTM Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMotm ? renderLoading() : motmError ? renderError(motmError) : (
                <ol className="space-y-3">
                  {topMotm?.map((player, index) => (
                    <li key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6 text-center">{index + 1}.</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.team?.logo_url || "/placeholder-team.png"} alt={player.team?.name || "Team"} />
                          <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="font-heading text-primary">{player.motm_awards} Awards</span>
                    </li>
                  ))}
                  {(!topMotm || topMotm.length === 0) && <p className="text-muted-foreground text-center">No MOTM awards yet.</p>}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Standings */}
        <Card className="glass-card mb-12 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-heading flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" /> Team Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStandings ? renderLoading() : standingsError ? renderError(standingsError) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs text-foreground uppercase bg-muted/50">
                    <tr>
                      <th scope="col" className="px-4 py-3">#</th>
                      <th scope="col" className="px-4 py-3">Team</th>
                      <th scope="col" className="px-4 py-3">P</th>
                      <th scope="col" className="px-4 py-3">W</th>
                      <th scope="col" className="px-4 py-3">D</th>
                      <th scope="col" className="px-4 py-3">L</th>
                      <th scope="col" className="px-4 py-3">GF</th>
                      <th scope="col" className="px-4 py-3">GA</th>
                      <th scope="col" className="px-4 py-3">GD</th>
                      <th scope="col" className="px-4 py-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStandings?.map((team, index) => (
                      <tr key={team.id} className="border-b border-muted/30 hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium">{index + 1}</td>
                        <th scope="row" className="px-4 py-3 font-medium text-foreground whitespace-nowrap flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={team.logo_url || "/placeholder-team.png"} alt={team.name} />
                            <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {team.name}
                        </th>
                        <td className="px-4 py-3">{team.wins + team.draws + team.losses}</td> {/* Played */}
                        <td className="px-4 py-3">{team.wins}</td>
                        <td className="px-4 py-3">{team.draws}</td>
                        <td className="px-4 py-3">{team.losses}</td>
                        <td className="px-4 py-3">{team.goals_for}</td>
                        <td className="px-4 py-3">{team.goals_against}</td>
                        <td className="px-4 py-3">{team.goals_for - team.goals_against}</td> {/* Goal Difference */}
                        <td className="px-4 py-3 font-bold text-primary">{team.points}</td>
                      </tr>
                    ))}
                    {(!teamStandings || teamStandings.length === 0) && (
                      <tr><td colSpan={10} className="px-4 py-3 text-center text-muted-foreground">No team standings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Matches */}
        <Card className="glass-card animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-heading flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-500" /> Upcoming Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUpcoming ? renderLoading() : upcomingError ? renderError(upcomingError) : (
              <div className="space-y-4">
                {upcomingMatches?.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={match.home_team?.logo_url || "/placeholder-team.png"} alt={match.home_team?.name || "Home Team"} />
                        <AvatarFallback>{match.home_team?.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{match.home_team?.name}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{match.away_team?.name}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={match.away_team?.logo_url || "/placeholder-team.png"} alt={match.away_team?.name || "Away Team"} />
                        <AvatarFallback>{match.away_team?.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(match.match_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {(!upcomingMatches || upcomingMatches.length === 0) && <p className="text-muted-foreground text-center">No upcoming matches.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
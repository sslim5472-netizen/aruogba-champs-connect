import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Highlights = () => {
  const [filterTeam, setFilterTeam] = useState<string>("all");

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: highlights } = useQuery({
    queryKey: ['highlights', filterTeam],
    queryFn: async () => {
      let query = supabase
        .from('highlights')
        .select(`
          *,
          team:teams(*),
          match:matches(
            *,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (filterTeam !== 'all') {
        query = query.eq('team_id', filterTeam);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Match Highlights
          </h1>
          <p className="text-muted-foreground">
            Relive the best moments from the tournament
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-8 max-w-md mx-auto">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights?.map((highlight) => (
            <div key={highlight.id} className="glass-card rounded-xl overflow-hidden group hover:glow-effect transition-all">
              <div className="relative aspect-video bg-muted">
                {highlight.video_url.includes('youtube') || highlight.video_url.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(highlight.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-heading text-lg mb-2">{highlight.title}</h3>
                {highlight.description && (
                  <p className="text-sm text-muted-foreground mb-3">{highlight.description}</p>
                )}
                
                {highlight.match && (
                  <div className="text-xs text-muted-foreground">
                    {highlight.match.home_team.name} vs {highlight.match.away_team.name}
                  </div>
                )}
                
                {highlight.team && (
                  <div className="mt-2">
                    <span 
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        background: `${highlight.team.color}33`,
                        color: highlight.team.color
                      }}
                    >
                      {highlight.team.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {highlights?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No highlights available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Highlights;
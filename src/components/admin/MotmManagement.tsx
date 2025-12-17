import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const MotmManagement = () => {
  const queryClient = useQueryClient();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { data: matches } = useQuery({
    queryKey: ["finished-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, match_date, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .eq("status", "finished")
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: players, refetch: refetchPlayers } = useQuery({
    queryKey: ["match-players-motm", selectedMatchId],
    queryFn: async () => {
      if (!selectedMatchId) return [];
      const selectedMatch = matches?.find(m => m.id === selectedMatchId);
      if (!selectedMatch) return [];

      const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .in("team_id", [selectedMatch.home_team_id, selectedMatch.away_team_id])
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMatchId,
  });

  useEffect(() => {
    if (selectedMatchId) {
      refetchPlayers();
    }
    setSelectedPlayerId(null);
  }, [selectedMatchId, refetchPlayers]);

  const { data: awards, isLoading } = useQuery({
    queryKey: ["motm-awards-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motm_awards")
        .select("*, player:players(name), match:matches(home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ match_id, player_id }: { match_id: string; player_id: string }) => {
      const { error } = await supabase.from("motm_awards").insert([{ match_id, player_id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motm-awards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["players-admin"] });
      setSelectedMatchId(null);
      setSelectedPlayerId(null);
      toast.success("MOTM award granted successfully");
    },
    onError: (error) => toast.error(error.message || "Failed to grant award"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("motm_awards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motm-awards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["players-admin"] });
      toast.success("MOTM award revoked successfully");
    },
    onError: () => toast.error("Failed to revoke award"),
  });

  const handleSubmit = () => {
    if (selectedMatchId && selectedPlayerId) {
      createMutation.mutate({ match_id: selectedMatchId, player_id: selectedPlayerId });
    } else {
      toast.error("Please select a match and a player.");
    }
  };

  if (isLoading) return <div>Loading awards...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading gradient-text">Man of the Match Awards</h2>
      
      <Card className="p-6 glass-card">
        <h3 className="text-xl font-semibold mb-4">Grant New Award</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Finished Match</label>
            <Select onValueChange={setSelectedMatchId} value={selectedMatchId || ""}>
              <SelectTrigger><SelectValue placeholder="Select a match" /></SelectTrigger>
              <SelectContent>
                {matches?.map((match: any) => (
                  <SelectItem key={match.id} value={match.id}>
                    {match.home_team.name} vs {match.away_team.name} ({format(new Date(match.match_date), "MMM d")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Player</label>
            <Select onValueChange={setSelectedPlayerId} value={selectedPlayerId || ""} disabled={!selectedMatchId}>
              <SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger>
              <SelectContent>
                {players?.map((player) => (
                  <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!selectedPlayerId || createMutation.isPending}>
            <Award className="w-4 h-4 mr-2" />
            Grant Award
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Existing Awards</h3>
        {awards?.map((award: any) => (
          <Card key={award.id} className="p-4 glass-card flex justify-between items-center">
            <div>
              <p className="font-semibold">{award.player.name}</p>
              <p className="text-sm text-muted-foreground">
                {award.match.home_team.name} vs {award.match.away_team.name}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMutation.mutate(award.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
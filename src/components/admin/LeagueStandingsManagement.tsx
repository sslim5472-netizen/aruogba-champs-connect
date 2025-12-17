import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTeamLogo } from "@/lib/teamUtils";

const teamStatsSchema = z.object({
  wins: z.coerce.number().int().min(0, "Wins cannot be negative"),
  draws: z.coerce.number().int().min(0, "Draws cannot be negative"),
  losses: z.coerce.number().int().min(0, "Losses cannot be negative"),
  goals_for: z.coerce.number().int().min(0, "Goals For cannot be negative"),
  goals_against: z.coerce.number().int().min(0, "Goals Against cannot be negative"),
  played: z.coerce.number().int().min(0, "Played matches cannot be negative"),
});

interface TeamStat {
  id: string;
  name: string;
  logo_url: string;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  played: number;
  color: string;
}

export const LeagueStandingsManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamStat | null>(null);
  const [formData, setFormData] = useState({
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    played: 0,
  });

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ["league-standings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url, color, wins, draws, losses, goals_for, goals_against, played")
        .order("name");
      if (error) throw error;
      return data as TeamStat[];
    },
  });

  const standings = teamsData
    ? teamsData
        .map(team => ({
            ...team,
            points: (team.wins || 0) * 3 + (team.draws || 0) * 1,
            goal_difference: (team.goals_for || 0) - (team.goals_against || 0),
        }))
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
            return a.name.localeCompare(b.name);
        })
    : [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("teams").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league-standings-admin"] });
      queryClient.invalidateQueries({ queryKey: ["league-standings-full"] }); // Invalidate public standings
      queryClient.invalidateQueries({ queryKey: ["league-standings"] }); // Invalidate stats page standings
      queryClient.invalidateQueries({ queryKey: ["teams-with-player-count"] }); // Invalidate teams page
      queryClient.invalidateQueries({ queryKey: ["teams-with-player-count-index"] }); // Invalidate index page
      resetForm();
      toast.success("Team statistics updated successfully");
    },
    onError: () => toast.error("Failed to update team statistics"),
  });

  const resetForm = () => {
    setFormData({
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      played: 0,
    });
    setIsEditing(false);
    setEditingTeam(null);
  };

  const handleEdit = (team: TeamStat) => {
    setEditingTeam(team);
    setFormData({
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      goals_for: team.goals_for,
      goals_against: team.goals_against,
      played: team.played,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      teamStatsSchema.parse(formData);
      
      if (editingTeam) {
        updateMutation.mutate({ id: editingTeam.id, data: formData });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading standings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading gradient-text">League Standings Management</h2>
      <p className="text-muted-foreground">Manually adjust team statistics to update league standings.</p>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px] glass-card">
          <DialogHeader>
            <DialogTitle>Edit {editingTeam?.name} Statistics</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wins">Wins</Label>
                <Input
                  id="wins"
                  type="number"
                  min="0"
                  value={formData.wins}
                  onChange={(e) => setFormData({ ...formData, wins: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="draws">Draws</Label>
                <Input
                  id="draws"
                  type="number"
                  min="0"
                  value={formData.draws}
                  onChange={(e) => setFormData({ ...formData, draws: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="losses">Losses</Label>
                <Input
                  id="losses"
                  type="number"
                  min="0"
                  value={formData.losses}
                  onChange={(e) => setFormData({ ...formData, losses: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="played">Played</Label>
                <Input
                  id="played"
                  type="number"
                  min="0"
                  value={formData.played}
                  onChange={(e) => setFormData({ ...formData, played: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="goals_for">Goals For (GF)</Label>
                <Input
                  id="goals_for"
                  type="number"
                  min="0"
                  value={formData.goals_for}
                  onChange={(e) => setFormData({ ...formData, goals_for: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="goals_against">Goals Against (GA)</Label>
                <Input
                  id="goals_against"
                  type="number"
                  min="0"
                  value={formData.goals_against}
                  onChange={(e) => setFormData({ ...formData, goals_against: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                Update Stats
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                <th className="text-center p-3 font-heading text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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
                  <td className="p-3 text-center">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(team)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
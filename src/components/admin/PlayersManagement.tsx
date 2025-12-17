import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const playerSchema = z.object({
  name: z.string().trim().min(1, "Player name is required").max(100, "Name too long"),
  team_id: z.string().uuid("Must select a team"),
  position: z.enum(["Defender", "Forward", "Goalkeeper", "Midfielder"]),
  jersey_number: z.coerce.number().int().min(1).max(99, "Jersey number must be between 1-99"),
  is_captain: z.boolean(),
  goals: z.coerce.number().int().min(0, "Goals cannot be negative"),
  assists: z.coerce.number().int().min(0, "Assists cannot be negative"),
  yellow_cards: z.coerce.number().int().min(0, "Yellow cards cannot be negative"),
  red_cards: z.coerce.number().int().min(0, "Red cards cannot be negative"),
  clean_sheets: z.coerce.number().int().min(0, "Clean sheets cannot be negative"),
  motm_awards: z.coerce.number().int().min(0, "MOTM awards cannot be negative"),
});

interface Player {
  id: string;
  name: string;
  team_id: string;
  position: string;
  jersey_number: number;
  is_captain: boolean;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  motm_awards: number;
  teams: { name: string };
}

export const PlayersManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    team_id: string;
    position: "Defender" | "Forward" | "Goalkeeper" | "Midfielder";
    jersey_number: number;
    is_captain: boolean;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    clean_sheets: number;
    motm_awards: number;
  }>({
    name: "",
    team_id: "",
    position: "Forward",
    jersey_number: 1,
    is_captain: false,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheets: 0,
    motm_awards: 0,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ["players-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*, teams(name)")
        .order("name");
      if (error) throw error;
      return data as Player[];
    },
  });

  // Group players by team
  const groupedPlayers = players?.reduce((acc, player) => {
    const teamName = player.teams?.name || "Unassigned";
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, Player[]>) || {};

  const createMutation = useMutation({
    mutationFn: async (newPlayer: typeof formData) => {
      const { error } = await supabase.from("players").insert([newPlayer]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players-admin"] });
      resetForm();
      toast.success("Player created successfully");
    },
    onError: () => toast.error("Failed to create player"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("players").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players-admin"] });
      resetForm();
      toast.success("Player updated successfully");
    },
    onError: () => toast.error("Failed to update player"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players-admin"] });
      toast.success("Player deleted successfully");
    },
    onError: () => toast.error("Failed to delete player"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      team_id: "",
      position: "Forward",
      jersey_number: 1,
      is_captain: false,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      clean_sheets: 0,
      motm_awards: 0,
    });
    setIsEditing(false);
    setEditingPlayer(null);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      team_id: player.team_id,
      position: player.position as "Defender" | "Forward" | "Goalkeeper" | "Midfielder",
      jersey_number: player.jersey_number,
      is_captain: player.is_captain,
      goals: player.goals,
      assists: player.assists,
      yellow_cards: player.yellow_cards,
      red_cards: player.red_cards,
      clean_sheets: player.clean_sheets,
      motm_awards: player.motm_awards,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      playerSchema.parse(formData);
      
      if (editingPlayer) {
        updateMutation.mutate({ id: editingPlayer.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading players...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading gradient-text">Players Management</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px] glass-card">
          <DialogHeader>
            <DialogTitle>{editingPlayer ? "Edit Player" : "Create New Player"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="team">Team</Label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) => setFormData({ ...formData, team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: "Defender" | "Forward" | "Goalkeeper" | "Midfielder") => 
                    setFormData({ ...formData, position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jersey">Jersey #</Label>
                <Input
                  id="jersey"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="goals">Goals</Label>
                <Input
                  id="goals"
                  type="number"
                  min="0"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="assists">Assists</Label>
                <Input
                  id="assists"
                  type="number"
                  min="0"
                  value={formData.assists}
                  onChange={(e) => setFormData({ ...formData, assists: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="yellow">Yellow Cards</Label>
                <Input
                  id="yellow"
                  type="number"
                  min="0"
                  value={formData.yellow_cards}
                  onChange={(e) => setFormData({ ...formData, yellow_cards: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="red">Red Cards</Label>
                <Input
                  id="red"
                  type="number"
                  min="0"
                  value={formData.red_cards}
                  onChange={(e) => setFormData({ ...formData, red_cards: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="motm">MOTM Awards</Label>
                <Input
                  id="motm"
                  type="number"
                  min="0"
                  value={formData.motm_awards}
                  onChange={(e) => setFormData({ ...formData, motm_awards: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPlayer ? "Update Player" : "Create Player"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {Object.keys(groupedPlayers).sort().map((teamName) => (
          <div key={teamName} className="space-y-3">
            <h3 className="text-xl font-semibold gradient-text mt-6 mb-3">{teamName}</h3>
            <div className="grid grid-cols-1 gap-3">
              {groupedPlayers[teamName].map((player) => (
                <Card key={player.id} className="p-4 glass-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                        #{player.jersey_number}
                      </div>
                      <div>
                        <h3 className="font-semibold">{player.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {player.teams.name} • {player.position}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>⚽ {player.goals}</span>
                        <span>🎯 {player.assists}</span>
                        <span>🟨 {player.yellow_cards}</span>
                        <span>🟥 {player.red_cards}</span>
                        <span>🏆 {player.motm_awards}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(player)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this player?")) {
                              deleteMutation.mutate(player.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
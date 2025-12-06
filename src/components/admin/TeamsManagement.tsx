import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getTeamLogo } from "@/lib/teamUtils"; // Import the new utility

const teamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100, "Team name must be less than 100 characters"),
  captain_name: z.string().trim().min(1, "Captain name is required").max(100, "Captain name must be less than 100 characters"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #FF0000)"),
  logo_url: z.string().trim().min(1, "Logo URL is required").max(500, "URL too long"),
});

interface Team {
  id: string;
  name: string;
  captain_name: string;
  color: string;
  logo_url: string;
}

export const TeamsManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    captain_name: "",
    color: "#007BFF",
    logo_url: "",
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Team[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newTeam: typeof formData) => {
      const { error } = await supabase.from("teams").insert([newTeam]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams-admin"] });
      resetForm();
      toast.success("Team created successfully");
    },
    onError: () => toast.error("Failed to create team"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("teams").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams-admin"] });
      resetForm();
      toast.success("Team updated successfully");
    },
    onError: () => toast.error("Failed to update team"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams-admin"] });
      toast.success("Team deleted successfully");
    },
    onError: () => toast.error("Failed to delete team"),
  });

  const resetForm = () => {
    setFormData({ name: "", captain_name: "", color: "#007BFF", logo_url: "" });
    setIsEditing(false);
    setEditingTeam(null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      captain_name: team.captain_name,
      color: team.color,
      logo_url: team.logo_url,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      teamSchema.parse(formData);
      
      if (editingTeam) {
        updateMutation.mutate({ id: editingTeam.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading teams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading gradient-text">Teams Management</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="p-6 glass-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingTeam ? "Edit Team" : "Create New Team"}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="captain_name">Captain</Label>
                <Input
                  id="captain_name"
                  value={formData.captain_name}
                  onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="color">Team Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingTeam ? "Update Team" : "Create Team"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams?.map((team) => (
          <Card key={team.id} className="p-4 glass-card">
            <div className="flex items-start gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center p-3 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
                  border: `3px solid ${team.color}`,
                }}
              >
                <img 
                  src={getTeamLogo(team.name, team.logo_url)} 
                  alt={team.name} 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">{team.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Captain: <span className="text-foreground">{team.captain_name}</span>
                </p>
                <div 
                  className="text-xs text-muted-foreground flex items-center gap-2"
                  style={{ color: team.color }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: team.color }}
                  />
                  Team Color
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(team)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this team?")) {
                      deleteMutation.mutate(team.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
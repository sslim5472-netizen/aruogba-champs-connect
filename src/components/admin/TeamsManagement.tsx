import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  captain: string;
  color: string;
  logo_url: string;
}

export const TeamsManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    captain: "",
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
    setFormData({ name: "", captain: "", color: "#007BFF", logo_url: "" });
    setIsEditing(false);
    setEditingTeam(null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      captain: team.captain,
      color: team.color,
      logo_url: team.logo_url,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
                <Label htmlFor="captain">Captain</Label>
                <Input
                  id="captain"
                  value={formData.captain}
                  onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
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
                className="w-16 h-16 rounded-full flex items-center justify-center p-2"
                style={{
                  background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
                  border: `2px solid ${team.color}`,
                }}
              >
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{team.name}</h3>
                <p className="text-sm text-muted-foreground">Captain: {team.captain}</p>
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

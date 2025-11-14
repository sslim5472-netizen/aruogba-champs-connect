import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const highlightSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().trim().max(1000, "Description too long"),
  video_url: z.string().url("Must be a valid video URL"),
  thumbnail_url: z.string().url("Must be a valid thumbnail URL"),
  match_id: z.string().optional(),
  team_id: z.string().optional(),
});

interface Highlight {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  match_id: string | null;
  team_id: string | null;
}

export const HighlightsManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    match_id: "none",
    team_id: "none",
  });

  const { data: matches } = useQuery({
    queryKey: ["matches-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: highlights, isLoading } = useQuery({
    queryKey: ["highlights-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("highlights")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Highlight[];
    },
  });

  const handleFileUpload = async (file: File, type: 'video' | 'thumbnail') => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('highlights')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('highlights')
        .getPublicUrl(filePath);

      if (type === 'video') {
        setFormData({ ...formData, video_url: publicUrl });
      } else {
        setFormData({ ...formData, thumbnail_url: publicUrl });
      }

      toast.success(`${type === 'video' ? 'Video' : 'Thumbnail'} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (newHighlight: typeof formData) => {
      const { error } = await supabase.from("highlights").insert([{
        ...newHighlight,
        match_id: newHighlight.match_id && newHighlight.match_id !== 'none' ? newHighlight.match_id : null,
        team_id: newHighlight.team_id && newHighlight.team_id !== 'none' ? newHighlight.team_id : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights-admin"] });
      resetForm();
      toast.success("Highlight created successfully");
    },
    onError: () => toast.error("Failed to create highlight"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("highlights").update({
        ...data,
        match_id: data.match_id && data.match_id !== 'none' ? data.match_id : null,
        team_id: data.team_id && data.team_id !== 'none' ? data.team_id : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights-admin"] });
      resetForm();
      toast.success("Highlight updated successfully");
    },
    onError: () => toast.error("Failed to update highlight"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("highlights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights-admin"] });
      toast.success("Highlight deleted successfully");
    },
    onError: () => toast.error("Failed to delete highlight"),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      match_id: "none",
      team_id: "none",
    });
    setIsEditing(false);
    setEditingHighlight(null);
  };

  const handleEdit = (highlight: Highlight) => {
    setEditingHighlight(highlight);
    setFormData({
      title: highlight.title,
      description: highlight.description || "",
      video_url: highlight.video_url,
      thumbnail_url: highlight.thumbnail_url || "",
      match_id: highlight.match_id || "none",
      team_id: highlight.team_id || "none",
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      highlightSchema.parse(formData);
      
      if (editingHighlight) {
        updateMutation.mutate({ id: editingHighlight.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading highlights...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading gradient-text">Highlights Gallery</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Highlight
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="p-6 glass-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingHighlight ? "Edit Highlight" : "Create New Highlight"}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="video">Video Upload</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'video');
                  }}
                  disabled={uploading}
                />
                {formData.video_url && (
                  <p className="text-xs text-muted-foreground mt-1">Video uploaded ✓</p>
                )}
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail Upload</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'thumbnail');
                  }}
                  disabled={uploading}
                />
                {formData.thumbnail_url && (
                  <p className="text-xs text-muted-foreground mt-1">Thumbnail uploaded ✓</p>
                )}
              </div>

              <div>
                <Label htmlFor="match">Match (Optional)</Label>
                <Select
                  value={formData.match_id}
                  onValueChange={(value) => setFormData({ ...formData, match_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select match" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {matches?.map((match: any) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.home_team.name} vs {match.away_team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team">Team (Optional)</Label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) => setFormData({ ...formData, team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading || !formData.video_url}>
                {editingHighlight ? "Update Highlight" : "Create Highlight"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights?.map((highlight) => (
          <Card key={highlight.id} className="glass-card overflow-hidden">
            {highlight.thumbnail_url && (
              <img
                src={highlight.thumbnail_url}
                alt={highlight.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold mb-2">{highlight.title}</h3>
              {highlight.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {highlight.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(highlight)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this highlight?")) {
                      deleteMutation.mutate(highlight.id);
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

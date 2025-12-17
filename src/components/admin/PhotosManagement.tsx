import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription, // Import DialogDescription
} from "@/components/ui/dialog";

const photoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().trim().max(1000, "Description too long").optional(),
  image_url: z.string().url("An uploaded image is required"),
  match_id: z.string().optional(),
  player_id: z.string().optional(),
  team_id: z.string().optional(),
});

interface Photo {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  match_id: string | null;
  player_id: string | null;
  team_id: string | null;
}

export const PhotosManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    match_id: "none",
    player_id: "none",
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
  
  const { data: players } = useQuery({
    queryKey: ["players-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: photos, isLoading } = useQuery({
    queryKey: ["gallery_photos-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, title, description, image_url, match_id, player_id, team_id") // Explicitly select columns
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Photo[];
    },
  });

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success(`Image uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload image`);
    } finally {
      setUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (newPhoto: typeof formData) => {
      const { error } = await supabase.from("gallery_photos").insert([{
        ...newPhoto,
        match_id: newPhoto.match_id && newPhoto.match_id !== 'none' ? newPhoto.match_id : null,
        player_id: newPhoto.player_id && newPhoto.player_id !== 'none' ? newPhoto.player_id : null,
        team_id: newPhoto.team_id && newPhoto.team_id !== 'none' ? newPhoto.team_id : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery_photos-admin"] });
      resetForm();
      toast.success("Photo added successfully");
    },
    onError: () => toast.error("Failed to add photo"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("gallery_photos").update({
        ...data,
        match_id: data.match_id && data.match_id !== 'none' ? data.match_id : null,
        player_id: data.player_id && data.player_id !== 'none' ? data.player_id : null,
        team_id: data.team_id && data.team_id !== 'none' ? data.team_id : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery_photos-admin"] });
      resetForm();
      toast.success("Photo updated successfully");
    },
    onError: () => toast.error("Failed to update photo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery_photos-admin"] });
      toast.success("Photo deleted successfully");
    },
    onError: () => toast.error("Failed to delete photo"),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      match_id: "none",
      player_id: "none",
      team_id: "none",
    });
    setIsEditing(false);
    setEditingPhoto(null);
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setFormData({
      title: photo.title,
      description: photo.description || "",
      image_url: photo.image_url,
      match_id: photo.match_id || "none",
      player_id: photo.player_id || "none",
      team_id: photo.team_id || "none",
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      photoSchema.parse(formData);
      
      if (editingPhoto) {
        updateMutation.mutate({ id: editingPhoto.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading photos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading gradient-text">Photo Gallery Management</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px] glass-card">
          <DialogHeader>
            <DialogTitle>{editingPhoto ? "Edit Photo" : "Add New Photo"}</DialogTitle>
            <DialogDescription>
              {editingPhoto ? "Update the details for this gallery photo." : "Upload a new photo to the gallery."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="photo">Photo Upload</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <p className="text-xs text-muted-foreground mt-1">Image uploaded ✓</p>
                )}
              </div>

              <div>
                <Label htmlFor="match">Match (Optional)</Label>
                <Select
                  value={formData.match_id}
                  onValueChange={(value) => setFormData({ ...formData, match_id: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select match" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="player">Player (Optional)</Label>
                <Select
                  value={formData.player_id}
                  onValueChange={(value) => setFormData({ ...formData, player_id: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {players?.map((player) => (
                      <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !formData.image_url}>
                {editingPhoto ? "Update Photo" : "Add Photo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos?.map((photo) => (
          <Card key={photo.id} className="glass-card overflow-hidden">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold mb-2">{photo.title}</h3>
              {photo.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {photo.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(photo)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this photo?")) {
                      deleteMutation.mutate(photo.id);
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
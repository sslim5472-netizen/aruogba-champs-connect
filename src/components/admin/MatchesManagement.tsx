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
import { format } from "date-fns";
import { z } from "zod";

const DEFAULT_LIVE_STREAM_URL = "https://player.livepush.io/live/emqEku0-FJ7AZA7V";

const matchSchema = z.object({
  home_team_id: z.string().uuid("Must select home team"),
  away_team_id: z.string().uuid("Must select away team"),
  match_date: z.string().min(1, "Match date is required"),
  venue: z.string().trim().min(1, "Venue is required").max(200, "Venue name too long"),
  status: z.enum(["scheduled", "live", "finished"]),
  home_score: z.coerce.number().int().min(0, "Score cannot be negative"),
  away_score: z.coerce.number().int().min(0, "Score cannot be negative"),
  live_stream_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
}).refine((data) => data.home_team_id !== data.away_team_id, {
  message: "Home and away teams must be different",
  path: ["away_team_id"],
});

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue: string;
  status: string;
  home_score: number;
  away_score: number;
  home_team: { name: string };
  away_team: { name: string };
  live_stream_url: string | null;
}

// Helper function to get current local datetime in YYYY-MM-DDTHH:mm format
const getLocalDatetimeString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const MatchesManagement = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState<{
    home_team_id: string;
    away_team_id: string;
    match_date: string;
    venue: string;
    status: "scheduled" | "live" | "finished";
    home_score: number;
    away_score: number;
    live_stream_url: string;
  }>({
    home_team_id: "",
    away_team_id: "",
    match_date: getLocalDatetimeString(new Date()), // Default to current local datetime
    venue: "Main Pitch",
    status: "scheduled",
    home_score: 0,
    away_score: 0,
    live_stream_url: DEFAULT_LIVE_STREAM_URL,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .order("match_date", { ascending: false });
      if (error) throw error;
      return data as Match[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMatch: typeof formData) => {
      const { error } = await supabase.from("matches").insert([newMatch]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches-admin"] });
      resetForm();
      toast.success("Match created successfully");
    },
    onError: () => toast.error("Failed to create match"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("matches").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches-admin"] });
      resetForm();
      toast.success("Match updated successfully");
    },
    onError: () => toast.error("Failed to update match"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches-admin"] });
      toast.success("Match deleted successfully");
    },
    onError: () => toast.error("Failed to delete match"),
  });

  const resetForm = () => {
    setFormData({
      home_team_id: "",
      away_team_id: "",
      match_date: getLocalDatetimeString(new Date()), // Reset to current local datetime
      venue: "Main Pitch",
      status: "scheduled",
      home_score: 0,
      away_score: 0,
      live_stream_url: DEFAULT_LIVE_STREAM_URL,
    });
    setIsEditing(false);
    setEditingMatch(null);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: format(new Date(match.match_date), "yyyy-MM-dd'T'HH:mm"),
      venue: match.venue,
      status: match.status as "scheduled" | "live" | "finished",
      home_score: match.home_score,
      away_score: match.away_score,
      live_stream_url: match.live_stream_url || DEFAULT_LIVE_STREAM_URL, // Fallback to default if null
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      matchSchema.parse(formData);
      
      if (editingMatch) {
        updateMutation.mutate({ id: editingMatch.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (isLoading) return <div>Loading matches...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading gradient-text">Matches Management</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="p-6 glass-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingMatch ? "Edit Match" : "Create New Match"}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="home_team">Home Team</Label>
                <Select
                  value={formData.home_team_id}
                  onValueChange={(value) => setFormData({ ...formData, home_team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
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
                <Label htmlFor="away_team">Away Team</Label>
                <Select
                  value={formData.away_team_id}
                  onValueChange={(value) => setFormData({ ...formData, away_team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
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
                <Label htmlFor="match_date">Match Date & Time</Label>
                <Input
                  id="match_date"
                  type="datetime-local"
                  value={formData.match_date}
                  onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "scheduled" | "live" | "finished") => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="home_score">Home Score</Label>
                  <Input
                    id="home_score"
                    type="number"
                    min="0"
                    value={formData.home_score}
                    onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="away_score">Away Score</Label>
                  <Input
                    id="away_score"
                    type="number"
                    min="0"
                    value={formData.away_score}
                    onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="live_stream_url">Live Stream URL (Optional)</Label>
                <Input
                  id="live_stream_url"
                  type="url"
                  value={formData.live_stream_url}
                  onChange={(e) => setFormData({ ...formData, live_stream_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingMatch ? "Update Match" : "Create Match"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {matches?.map((match) => (
          <Card key={match.id} className="p-4 glass-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{match.home_team.name}</span>
                  <span className="text-2xl font-bold">{match.home_score}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{match.away_team.name}</span>
                  <span className="text-2xl font-bold">{match.away_score}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {format(new Date(match.match_date), "PPp")} • {match.venue}
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    match.status === 'live' ? 'bg-green-500/20 text-green-300' :
                    match.status === 'finished' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {match.status.toUpperCase()}
                  </span>
                  {match.live_stream_url && (
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                      Stream Available
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(match)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this match?")) {
                      deleteMutation.mutate(match.id);
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
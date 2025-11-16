import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PhotosView = () => {
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const { data: teams } = useQuery({
    queryKey: ['teams-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: photos, isLoading } = useQuery({
    queryKey: ['gallery_photos', filterTeam],
    queryFn: async () => {
      let query = supabase
        .from('gallery_photos')
        .select(`*, team:teams(name, color)`)
        .order('created_at', { ascending: false });
      
      if (filterTeam !== 'all') {
        query = query.eq('team_id', filterTeam);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <Dialog open={!!selectedPhoto} onOpenChange={(isOpen) => !isOpen && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.title}</DialogTitle>
          </DialogHeader>
          <img src={selectedPhoto?.image_url} alt={selectedPhoto?.title} className="w-full h-auto object-contain rounded-lg" />
          {selectedPhoto?.description && <p className="text-muted-foreground mt-2">{selectedPhoto.description}</p>}
        </DialogContent>
      </Dialog>
      
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

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading photos...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos?.map((photo) => (
            <div 
              key={photo.id} 
              className="glass-card rounded-xl overflow-hidden group hover:glow-effect transition-all cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative aspect-square bg-muted">
                <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-heading truncate">{photo.title}</h3>
                {photo.team && (
                  <span className="text-xs" style={{ color: photo.team.color }}>{photo.team.name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          No photos available yet.
        </div>
      )}
    </div>
  );
};

export default PhotosView;
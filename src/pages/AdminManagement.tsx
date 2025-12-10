import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsManagement } from "@/components/admin/TeamsManagement";
import { PlayersManagement } from "@/components/admin/PlayersManagement";
import { MatchesManagement } from "@/components/admin/MatchesManagement";
import { PhotosManagement } from "@/components/admin/PhotosManagement";
import { MotmManagement } from "@/components/admin/MotmManagement";
import { LeagueStandingsManagement } from "@/components/admin/LeagueStandingsManagement";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminManagement = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // AdminManagement page is now directly accessible without authentication.
  // This is a simplification based on the request to remove login functionality.

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-heading gradient-text">Tournament Management</h1>
                  <p className="text-sm text-muted-foreground">Full CRUD operations for all tournament data</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="teams" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 glass-card"> {/* Adjusted grid-cols to 5 */}
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="motm">MOTM</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
            </TabsList>

            <TabsContent value="teams">
              <TeamsManagement />
            </TabsContent>

            <TabsContent value="players">
              <PlayersManagement />
            </TabsContent>

            <TabsContent value="matches">
              <MatchesManagement />
            </TabsContent>
            
            <TabsContent value="photos">
              <PhotosManagement />
            </TabsContent>

            <TabsContent value="motm">
              <MotmManagement />
            </TabsContent>

            <TabsContent value="standings">
              <LeagueStandingsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
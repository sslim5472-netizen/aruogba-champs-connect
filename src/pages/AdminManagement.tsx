import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsManagement } from "@/components/admin/TeamsManagement";
import { PlayersManagement } from "@/components/admin/PlayersManagement";
import { MatchesManagement } from "@/components/admin/MatchesManagement";
import { HighlightsManagement } from "@/components/admin/HighlightsManagement";
import { PhotosManagement } from "@/components/admin/PhotosManagement";
import { MotmManagement } from "@/components/admin/MotmManagement";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminManagement = () => {
  const { user, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false); // New state for local sign out

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        if (isSigningOut) {
          navigate("/");
          setIsSigningOut(false);
        } else {
          navigate("/admin/login");
        }
      } else if (userRole !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
      }
    }
  }, [user, userRole, loading, navigate, mounted, isSigningOut]);

  if (loading || !mounted || isSigningOut) { // Show loading state if signing out
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Removed the problematic `if (!user || userRole !== 'admin') { return null; }`
  // The useEffect above handles the redirection logic.

  const handleSignOut = async () => {
    setIsSigningOut(true); // Indicate that sign out is in progress
    await signOut(); // This will eventually set user to null, triggering the useEffect
  };

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
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-destructive/50 hover:bg-destructive/10"
                disabled={isSigningOut} // Disable button while signing out
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs defaultValue="teams" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 glass-card">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="motm">MOTM</TabsTrigger>
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

            <TabsContent value="highlights">
              <HighlightsManagement />
            </TabsContent>
            
            <TabsContent value="photos">
              <PhotosManagement />
            </TabsContent>

            <TabsContent value="motm">
              <MotmManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
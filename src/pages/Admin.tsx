import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Shield, Users, Calendar, Trophy, LogOut, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Admin = () => {
  const { user, userRole, firstName, lastName, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false); // New state for local sign out

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        // If user is null and we were actively signing out from this page, go to home.
        // Otherwise, if user is null (e.g., not logged in, or logged out from Navigation), go to admin login.
        if (isSigningOut) {
          navigate("/");
          setIsSigningOut(false); // Reset the flag after navigation
        } else {
          navigate("/admin/login");
        }
      } else if (userRole !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
      }
    }
  }, [user, userRole, loading, navigate, mounted, isSigningOut]); // Added isSigningOut to dependencies

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

  // No need for `if (!user) { return null; }` here, as the useEffect handles redirection.

  const handleSignOut = async () => {
    setIsSigningOut(true); // Indicate that sign out is in progress
    await signOut(); // This will eventually set user to null, triggering the useEffect
    // The useEffect will handle the navigation to "/" because isSigningOut is true
  };

  const adminCards = [
    {
      title: "Full CRUD Management",
      description: "Complete control over teams, players, matches and highlights",
      icon: Shield,
      path: "/admin/manage",
      roles: ['admin'],
    },
    {
      title: "Teams & Players",
      description: "View team rosters and player statistics",
      icon: Users,
      path: "/teams",
      roles: ['admin', 'captain'],
    },
    {
      title: "Matches",
      description: "View match fixtures and scores",
      icon: Calendar,
      path: "/fixtures",
      roles: ['admin'],
    },
    {
      title: "Live Match",
      description: "Update live match scores and events",
      icon: Trophy,
      path: "/live",
      roles: ['admin'],
    },
    {
      title: "Highlights",
      description: "View and manage match highlights",
      icon: Video,
      path: "/highlights",
      roles: ['admin'],
    },
  ];

  const accessibleCards = adminCards.filter(card => 
    card.roles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="glass-card p-8 rounded-xl mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-heading gradient-text">Admin Dashboard</h1>
                  <p className="text-muted-foreground capitalize">
                    Welcome, {firstName && lastName ? `${firstName} ${lastName}` : user.email} (Role: {userRole || 'viewer'})
                  </p>
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

            <div className="text-sm text-muted-foreground">
              Welcome to the tournament management panel. Select an option below to get started.
            </div>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
            {accessibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.path}
                  className="glass-card p-6 cursor-pointer hover:glow-effect transition-all group"
                  onClick={() => navigate(card.path)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-heading text-lg mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {accessibleCards.length === 0 && (
            <div className="glass-card p-12 rounded-xl text-center">
              <p className="text-muted-foreground">
                No management options available. Contact an administrator to assign you a role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
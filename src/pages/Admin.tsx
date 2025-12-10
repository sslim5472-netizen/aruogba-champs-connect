import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Shield, Users, Calendar, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

const Admin = () => {
  const navigate = useNavigate();

  const adminCards = [
    {
      title: "Full CRUD Management",
      description: "Complete control over teams, players, matches and photos",
      icon: Shield,
      path: "/admin/manage",
    },
    {
      title: "Teams & Players",
      description: "View team rosters and player statistics",
      icon: Users,
      path: "/teams",
    },
    {
      title: "Matches",
      description: "View match fixtures and scores",
      icon: Calendar,
      path: "/fixtures",
    },
    {
      title: "Live Match",
      description: "Update live match scores and events",
      icon: Trophy,
      path: "/live",
    },
  ];

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
                    Welcome to the admin panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Welcome to the tournament management panel. Select an option below to get started.
            </div>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
            {adminCards.map((card) => {
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
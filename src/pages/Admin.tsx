import Navigation from "@/components/Navigation";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Admin = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="glass-card p-8 rounded-xl text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-heading gradient-text mb-4">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mb-8">
              Manage teams, matches, and tournament data
            </p>

            <div className="space-y-4">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Lock className="w-4 h-4 mr-2" />
                Login to Admin Panel
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Authentication required to access admin features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
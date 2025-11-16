import { Link, useLocation } from "react-router-dom";
import { Trophy, Users, Calendar, BarChart3, Vote, Radio, LogIn, LogOut, Image as GalleryIcon } from "lucide-react";
import aruogbaLogo from "@/assets/aruogba-logo.jpg";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  
  const navItems = [
    { path: "/", label: "Home", icon: Trophy },
    { path: "/teams", label: "Teams", icon: Users },
    { path: "/fixtures", label: "Fixtures", icon: Calendar },
    { path: "/live", label: "Live", icon: Radio },
    { path: "/stats", label: "Stats", icon: BarChart3 },
    { path: "/voting", label: "Vote", icon: Vote },
    { path: "/gallery", label: "Gallery", icon: GalleryIcon },
  ];

  return (
    <nav className="glass-card sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={aruogbaLogo} 
              alt="Aruogba FC" 
              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
            />
            <div className="hidden md:block">
              <div className="font-heading text-lg gradient-text">ARUOGBA FC</div>
              <div className="text-xs text-muted-foreground">Tournament 2025</div>
            </div>
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  location.pathname === path
                    ? "bg-gradient-to-r from-primary to-accent text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline text-sm font-heading">{label}</span>
              </Link>
              ))}
            
            {user && userRole === 'admin' ? (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    location.pathname.startsWith('/admin')
                      ? "bg-gradient-to-r from-primary to-accent text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-heading">Admin</span>
                </Link>
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-heading ml-2">Logout</span>
                </Button>
              </>
            ) : user ? (
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-sm font-heading ml-2">Logout</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-heading ml-2">Sign Up / Login</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
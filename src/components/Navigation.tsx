import { Link, useLocation } from "react-router-dom";
import { Trophy, Users, Calendar, BarChart3, Settings } from "lucide-react";
import aruogbaLogo from "@/assets/aruogba-logo.jpg";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: Trophy },
    { path: "/teams", label: "Teams", icon: Users },
    { path: "/fixtures", label: "Fixtures", icon: Calendar },
    { path: "/stats", label: "Stats", icon: BarChart3 },
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
            
            <Link
              to="/admin"
              className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
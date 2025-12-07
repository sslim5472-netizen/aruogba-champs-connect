import { Link } from "react-router-dom";
import { getTeamLogo } from "@/lib/teamUtils"; // Import the utility

interface TeamCardProps {
  name: string;
  captain_name: string;
  logo: string;
  color: string;
  playerCount: number; // Add new prop for player count
}

const TeamCard = ({ name, captain_name, logo, color, playerCount }: TeamCardProps) => {
  const logoSrc = getTeamLogo(name, logo); // Use the utility for logo

  return (
    <Link to={`/teams/${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all duration-300 group cursor-pointer">
        <div 
          className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center p-4 transition-all duration-300 group-hover:glow-effect"
          style={{ 
            background: `linear-gradient(135deg, ${color}33, ${color}66)`,
            border: `2px solid ${color}`
          }}
        >
          <img 
            src={logoSrc} 
            alt={name} 
            className="w-full h-full object-contain"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} // Fallback for broken images
          />
        </div>
        
        <h3 className="text-xl font-heading text-center mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground text-center">
          Captain: <span className="text-silver">{captain_name}</span>
        </p>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Players: {playerCount}</span> {/* Display dynamic player count */}
            <span className="text-primary">View Team →</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TeamCard;
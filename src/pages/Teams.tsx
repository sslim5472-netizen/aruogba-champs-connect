import Navigation from "@/components/Navigation";
import TeamCard from "@/components/TeamCard";
import airwayLogo from "@/assets/airway-fc.jpg";
import knightsLogo from "@/assets/knights-fc.jpg";
import starsLogo from "@/assets/stars-fc.jpg";
import spartaLogo from "@/assets/sparta-fc.jpg";
import kingsLogo from "@/assets/kings-fc.jpg";
import enjoymentLogo from "@/assets/enjoyment-fc.jpg";

const Teams = () => {
  const teams = [
    { name: "Airway FC", captain_name: "Presido", logo: airwayLogo, color: "#007BFF" },
    { name: "Knights FC", captain_name: "Musoko", logo: knightsLogo, color: "#0056B3" },
    { name: "Stars FC", captain_name: "Andre", logo: starsLogo, color: "#FFD700" },
    { name: "Sparta FC", captain_name: "Brazil", logo: spartaLogo, color: "#DC3545" },
    { name: "Kings FC", captain_name: "Ken", logo: kingsLogo, color: "#6B2C91" },
    { name: "Enjoyment FC", captain_name: "Odion", logo: enjoymentLogo, color: "#FF6600" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Tournament Teams
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Six elite teams competing for glory in the Aruogba Champion League 2025
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {teams.map((team) => (
            <TeamCard key={team.name} {...team} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;
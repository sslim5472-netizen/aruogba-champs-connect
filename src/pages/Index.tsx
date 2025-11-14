import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Countdown from "@/components/Countdown";
import TeamCard from "@/components/TeamCard";
import { Trophy, Calendar, BarChart3, Video, Vote, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import airwayLogo from "@/assets/airway-fc.jpg";
import knightsLogo from "@/assets/knights-fc.jpg";
import starsLogo from "@/assets/stars-fc.jpg";
import spartaLogo from "@/assets/sparta-fc.jpg";
import kingsLogo from "@/assets/kings-fc.jpg";
import enjoymentLogo from "@/assets/enjoyment-fc.jpg";

const Index = () => {
  const teams = [
    { name: "Airway FC", captain: "Presido", logo: airwayLogo, color: "#007BFF" },
    { name: "Knights FC", captain: "Musoko", logo: knightsLogo, color: "#0056B3" },
    { name: "Stars FC", captain: "Andre", logo: starsLogo, color: "#FFD700" },
    { name: "Sparta FC", captain: "Brazil", logo: spartaLogo, color: "#DC3545" },
    { name: "Kings FC", captain: "Ken", logo: kingsLogo, color: "#6B2C91" },
    { name: "Enjoyment FC", captain: "Odion", logo: enjoymentLogo, color: "#FF6600" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 stars-bg opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-heading gradient-text mb-6">
              ARUOGBA FC
            </h1>
            <p className="text-xl md:text-2xl text-silver mb-4">
              End of Year In-House Tournament 2025
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Six teams. One champion. Experience the thrill of competitive 7-a-side football
              in our premier year-end tournament.
            </p>
          </div>

          <Countdown />

          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <Link to="/live">
              <Button className="bg-gradient-to-r from-red-600 to-red-800 hover:opacity-90 text-lg px-8 py-6">
                <Radio className="w-5 h-5 mr-2" />
                Live Match
              </Button>
            </Link>
            <Link to="/voting">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6">
                <Vote className="w-5 h-5 mr-2" />
                Vote MOTM
              </Button>
            </Link>
            <Link to="/highlights">
              <Button variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <Video className="w-5 h-5 mr-2" />
                Highlights
              </Button>
            </Link>
            <Link to="/fixtures">
              <Button variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <Calendar className="w-5 h-5 mr-2" />
                View Fixtures
              </Button>
            </Link>
            <Link to="/stats">
              <Button variant="outline" className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Stats
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-heading gradient-text mb-4">
            Competing Teams
          </h2>
          <p className="text-muted-foreground">
            Meet the six teams battling for tournament glory
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-scale-in">
          {teams.map((team) => (
            <TeamCard key={team.name} {...team} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/teams">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Trophy className="w-4 h-4 mr-2" />
              Explore All Teams
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
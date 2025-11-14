import Navigation from "@/components/Navigation";
import { Calendar, MapPin, Users } from "lucide-react";

const Fixtures = () => {
  const matches = [
    { home: "Airway FC", away: "Knights FC", date: "Dec 8, 2025", time: "4:30 PM" },
    { home: "Stars FC", away: "Sparta FC", date: "Dec 8, 2025", time: "4:45 PM" },
    { home: "Kings FC", away: "Enjoyment FC", date: "Dec 8, 2025", time: "5:00 PM" },
    { home: "Airway FC", away: "Stars FC", date: "Dec 8, 2025", time: "5:15 PM" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Match Schedule
          </h1>
          <p className="text-muted-foreground">
            End of Year In-House Tournament
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4 animate-scale-in">
          {matches.map((match, index) => (
            <div key={index} className="glass-card p-6 rounded-xl hover:glow-effect transition-all">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-heading text-lg">{match.date}</div>
                    <div className="text-sm text-muted-foreground">{match.time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-center">
                  <div className="text-right flex-1">
                    <div className="font-heading text-lg">{match.home}</div>
                  </div>
                  
                  <div className="px-4 py-2 bg-muted rounded-lg font-heading text-sm">
                    VS
                  </div>
                  
                  <div className="text-left flex-1">
                    <div className="font-heading text-lg">{match.away}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Main Pitch</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fixtures;
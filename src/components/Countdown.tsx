import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

const Countdown = () => {
  const targetDate = new Date("2025-12-08T16:30:00").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]); // Added targetDate to dependency array

  return (
    <div className="glass-card p-8 rounded-2xl animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-gold animate-glow-pulse" />
        <h2 className="text-2xl md:text-3xl font-heading gradient-text">
          Tournament Kicks Off In
        </h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="bg-gradient-to-br from-primary to-accent p-6 rounded-xl mb-2 glow-effect">
              <div className="text-4xl md:text-5xl font-heading text-white font-bold">
                {value.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-sm md:text-base text-silver uppercase tracking-wider font-heading">
              {unit}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Monday, December 8, 2025 • 4:30 PM
        </p>
      </div>
    </div>
  );
};

export default Countdown;
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Countdown = () => {
  const queryClient = useQueryClient();
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hasMatch, setHasMatch] = useState(false);
  const [matchDateTime, setMatchDateTime] = useState<string | null>(null);

  // Fetch the next scheduled match
  const { data: nextMatch, isLoading: nextMatchLoading } = useQuery({
    queryKey: ["next-scheduled-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("match_date")
        .eq("status", "scheduled")
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to handle no results gracefully
      if (error) throw error;
      return data;
    },
    refetchInterval: 60 * 1000, // Refetch every minute to catch new scheduled matches
  });

  // Update target timestamp when nextMatch data changes
  useEffect(() => {
    if (nextMatch?.match_date) {
      const date = new Date(nextMatch.match_date);
      setTargetTimestamp(date.getTime());
      setMatchDateTime(format(date, "EEEE, MMMM d, yyyy • h:mm a"));
      setHasMatch(true);
    } else {
      setTargetTimestamp(null);
      setMatchDateTime(null);
      setHasMatch(false);
    }
  }, [nextMatch]);

  // Countdown interval logic
  useEffect(() => {
    if (targetTimestamp === null) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetTimestamp - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Invalidate the query to refetch and find the *next* next match
        queryClient.invalidateQueries({ queryKey: ["next-scheduled-match"] });
        setHasMatch(false); // No longer counting down to this match
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, queryClient]);

  if (nextMatchLoading) {
    return (
      <div className="glass-card p-8 rounded-2xl animate-fade-in text-center text-muted-foreground">
        Loading next match...
      </div>
    );
  }

  if (!hasMatch) {
    return (
      <div className="glass-card p-8 rounded-2xl animate-fade-in text-center">
        <Trophy className="w-8 h-8 mx-auto mb-4 text-gold" />
        <h2 className="text-2xl md:text-3xl font-heading gradient-text mb-4">
          No Upcoming Matches Scheduled
        </h2>
        <p className="text-muted-foreground">
          Check back later for new match announcements!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 rounded-2xl animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-gold animate-glow-pulse" />
        <h2 className="text-2xl md:text-3xl font-heading gradient-text">
          Next match starts in
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
      
      {matchDateTime && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            {matchDateTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default Countdown;
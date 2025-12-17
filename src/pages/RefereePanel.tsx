import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Play, Pause, StopCircle, FastForward, Clock, Plus, Minus, Target, AlertTriangle, Users, LogOut, Eye } from "lucide-react"; // Added Eye icon
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, differenceInSeconds, parseISO } from "date-fns";
import { z } from "zod";

// Zod schema for match setup validation
const matchSetupSchema = z.object({
  matchId: z.string().uuid("Please select an active fixture."),
  pitch: z.string().trim().min(1, "Pitch is required").max(100, "Pitch name too long").optional().or(z.literal("")),
  weather: z.string().trim().max(100, "Weather description too long").optional().or(z.literal("")),
});

// Zod schema for event creation validation
const eventSchema = z.object({
  teamId: z.string().uuid("Team is required"),
  playerId: z.string().uuid("Player is required"),
  eventType: z.enum(["goal", "yellow_card", "red_card", "substitution"]),
  assistPlayerId: z.string().uuid("Assist player is required").optional().or(z.literal("")),
  playerOutId: z.string().uuid("Player out is required").optional().or(z.literal("")),
  playerInId: z.string().uuid("Player in is required").optional().or(z.literal("")),
  description: z.string().trim().max(255, "Description too long").optional().or(z.literal("")),
});

interface Match {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string };
  away_team: { name: string };
  status: "scheduled" | "live" | "finished" | "half_time";
  home_score: number;
  away_score: number;
  match_start_time: string | null;
  match_pause_time: string | null;
  total_paused_duration: string | null; // INTERVAL type from DB
  match_end_time: string | null;
  pitch: string | null;
  weather: string | null;
}

interface Player {
  id: string;
  name: string;
  team_id: string;
}

const RefereePanel = () => {
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [pitch, setPitch] = useState("");
  const [weather, setWeather] = useState("");

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const timerIntervalRef = useRef<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Event form state
  const [eventTeamId, setEventTeamId] = useState<string | null>(null);
  const [eventPlayerId, setEventPlayerId] = useState<string | null>(null);
  const [eventAssistPlayerId, setEventAssistPlayerId] = useState<string | null>(null);
  const [eventPlayerOutId, setEventPlayerOutId] = useState<string | null>(null);
  const [eventPlayerInId, setEventPlayerInId] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<"goal" | "yellow_card" | "red_card" | "substitution">("goal");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      if (!user) {
        navigate("/referee/login", { replace: true });
      } else if (userRole !== 'referee') {
        toast.error("Access denied. Referee privileges required.");
        navigate("/", { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate, mounted]);

  // Fetch scheduled matches
  const { data: scheduledMatches, isLoading: matchesLoading, error: matchesError } = useQuery<Match[]>({
    queryKey: ["referee-scheduled-matches"],
    queryFn: async () => {
      console.log("RefereePanel: Fetching scheduled, live, and half_time matches...");
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          status,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          match_start_time,
          match_pause_time,
          total_paused_duration,
          match_end_time,
          pitch,
          weather,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .in("status", ["scheduled", "live", "half_time"])
        .order("match_date", { ascending: true });
      if (error) {
        console.error("RefereePanel: Error fetching matches:", error);
        throw error;
      }
      console.log("RefereePanel: Fetched matches data:", data);
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds to get latest match status
  });

  // Get current active match details
  const activeMatch = selectedMatchId
    ? scheduledMatches?.find(m => m.id === selectedMatchId)
    : null;

  // Fetch players for selected match's teams
  const { data: matchPlayers } = useQuery<Player[]>({
    queryKey: ["referee-match-players", activeMatch?.home_team_id, activeMatch?.away_team_id],
    queryFn: async () => {
      if (!activeMatch) return [];
      console.log("RefereePanel: Fetching players for match teams:", activeMatch.home_team_id, activeMatch.away_team_id);
      const { data, error } = await supabase
        .from("players")
        .select("id, name, team_id")
        .in("team_id", [activeMatch.home_team_id, activeMatch.away_team_id])
        .order("name");
      if (error) {
        console.error("RefereePanel: Error fetching match players:", error);
        throw error;
      }
      console.log("RefereePanel: Fetched match players:", data);
      return data;
    },
    enabled: !!activeMatch,
  });

  // Effect to initialize match state when a match is selected or updated
  useEffect(() => {
    if (activeMatch) {
      setPitch(activeMatch.pitch || "");
      setWeather(activeMatch.weather || "");

      // Initialize timer based on active match state
      if (activeMatch.status === 'live' && activeMatch.match_start_time) {
        const startTime = parseISO(activeMatch.match_start_time);
        const totalPausedDuration = parseIntervalToSeconds(activeMatch.total_paused_duration || "00:00:00");
        const now = new Date();
        let currentElapsed = differenceInSeconds(now, startTime) - totalPausedDuration;
        
        if (activeMatch.match_pause_time) {
          // If paused, calculate elapsed up to pause time
          const pauseTime = parseISO(activeMatch.match_pause_time);
          currentElapsed = differenceInSeconds(pauseTime, startTime) - totalPausedDuration;
          setIsTimerRunning(false);
        } else {
          // If live and not paused, start running
          setIsTimerRunning(true);
        }
        setElapsedTime(Math.max(0, currentElapsed));
      } else {
        setIsTimerRunning(false);
        setElapsedTime(0);
      }
    } else {
      setPitch("");
      setWeather("");
      setIsTimerRunning(false);
      setElapsedTime(0);
    }
  }, [activeMatch]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseIntervalToSeconds = (intervalString: string): number => {
    // Example interval string: "00:00:00" or "0 days 00:00:00"
    const parts = intervalString.split(' ');
    const timePart = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  const updateMatchMutation = useMutation({
    mutationFn: async (data: Partial<Match>) => {
      if (!selectedMatchId) throw new Error("No match selected.");
      const { error } = await supabase.from("matches").update(data).eq("id", selectedMatchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referee-scheduled-matches"] });
      queryClient.invalidateQueries({ queryKey: ["live-match"] }); // Invalidate live match for spectators
      queryClient.invalidateQueries({ queryKey: ["all-matches-fixtures"] }); // Invalidate fixtures page
      toast.success("Match updated successfully.");
    },
    onError: (error) => toast.error(`Failed to update match: ${error.message}`),
  });

  const handleStartMatch = async () => {
    try {
      matchSetupSchema.parse({ matchId: selectedMatchId, pitch, weather });
      if (!selectedMatchId) return;

      const now = new Date().toISOString();
      await updateMatchMutation.mutateAsync({
        status: "live",
        match_start_time: now,
        match_pause_time: null,
        total_paused_duration: "00:00:00",
        match_end_time: null,
        pitch: pitch || null,
        weather: weather || null,
      });
      setIsTimerRunning(true);
      setElapsedTime(0);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(`Error starting match: ${error.message}`);
      }
    }
  };

  const handlePauseMatch = async () => {
    if (!activeMatch || !activeMatch.match_start_time || activeMatch.status !== 'live') return;
    const now = new Date().toISOString();
    await updateMatchMutation.mutateAsync({
      status: "half_time", // Or 'paused' if we add that status
      match_pause_time: now,
    });
    setIsTimerRunning(false);
  };

  const handleResumeMatch = async () => {
    if (!activeMatch || !activeMatch.match_start_time || !activeMatch.match_pause_time || activeMatch.status !== 'half_time') return;
    
    const pauseTime = parseISO(activeMatch.match_pause_time);
    const now = new Date();
    const currentPausedDuration = differenceInSeconds(now, pauseTime);
    
    const existingTotalPausedDuration = parseIntervalToSeconds(activeMatch.total_paused_duration || "00:00:00");
    const newTotalPausedDuration = existingTotalPausedDuration + currentPausedDuration;

    // Convert seconds back to interval string (HH:MM:SS)
    const hours = Math.floor(newTotalPausedDuration / 3600);
    const minutes = Math.floor((newTotalPausedDuration % 3600) / 60);
    const seconds = newTotalPausedDuration % 60;
    const newTotalPausedDurationString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    await updateMatchMutation.mutateAsync({
      status: "live",
      match_pause_time: null, // Clear pause time
      total_paused_duration: newTotalPausedDurationString,
    });
    setIsTimerRunning(true);
  };

  const handleSetExtraTime = async (minutes: number) => {
    if (!activeMatch || !activeMatch.match_start_time || activeMatch.status !== 'live') return;
    
    // This is tricky as 'elapsedTime' is client-side.
    // For simplicity, we'll just add to the current elapsed time for display.
    // A more robust solution would involve adjusting match_start_time or adding an 'extra_time_added' field.
    setElapsedTime(prev => prev + (minutes * 60));
    toast.info(`Added ${minutes} minutes to the timer.`);
  };

  const handleEndMatch = async () => {
    if (!activeMatch || !activeMatch.match_start_time || activeMatch.status === 'finished') return;
    
    const now = new Date().toISOString();
    await updateMatchMutation.mutateAsync({
      status: "finished",
      match_end_time: now,
      match_pause_time: null, // Ensure no lingering pause state
    });
    setIsTimerRunning(false);
    toast.success("Match ended and finalized!");
    // Invalidate all queries that depend on match status or team standings
    queryClient.invalidateQueries({ queryKey: ["league-standings-full"] });
    queryClient.invalidateQueries({ queryKey: ["league-standings"] });
    queryClient.invalidateQueries({ queryKey: ["teams-with-player-count"] });
    queryClient.invalidateQueries({ queryKey: ["teams-with-player-count-index"] });
    queryClient.invalidateQueries({ queryKey: ["next-scheduled-match"] });
    queryClient.invalidateQueries({ queryKey: ["upcoming-matches-homepage"] });
  };

  const handleAddEvent = useMutation({
    mutationFn: async (eventData: {
      match_id: string;
      player_id: string;
      event_type: "goal" | "yellow_card" | "red_card" | "substitution";
      minute: number;
      description?: string;
      assist_player_id?: string; // For goals
      player_out_id?: string; // For substitutions
      player_in_id?: string; // For substitutions
    }) => {
      const { error } = await supabase.from("match_events").insert([eventData]);
      if (error) throw error;

      // Update player stats directly for goals/cards
      if (eventData.event_type === 'goal') {
        await supabase.from('players').update({ goals: (matchPlayers?.find(p => p.id === eventData.player_id)?.goals || 0) + 1 }).eq('id', eventData.player_id);
        if (eventData.assist_player_id) {
          await supabase.from('players').update({ assists: (matchPlayers?.find(p => p.id === eventData.assist_player_id)?.assists || 0) + 1 }).eq('id', eventData.assist_player_id);
        }
        // Update match score
        if (activeMatch) {
          const isHomeTeamScorer = matchPlayers?.find(p => p.id === eventData.player_id)?.team_id === activeMatch.home_team_id;
          await supabase.from('matches').update({
            home_score: isHomeTeamScorer ? activeMatch.home_score + 1 : activeMatch.home_score,
            away_score: !isHomeTeamScorer ? activeMatch.away_score + 1 : activeMatch.away_score,
          }).eq('id', activeMatch.id);
        }
      } else if (eventData.event_type === 'yellow_card') {
        await supabase.from('players').update({ yellow_cards: (matchPlayers?.find(p => p.id === eventData.player_id)?.yellow_cards || 0) + 1 }).eq('id', eventData.player_id);
      } else if (eventData.event_type === 'red_card') {
        await supabase.from('players').update({ red_cards: (matchPlayers?.find(p => p.id === eventData.player_id)?.red_cards || 0) + 1 }).eq('id', eventData.player_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-events-details"] }); // For match details page
      queryClient.invalidateQueries({ queryKey: ["live-match"] }); // For live match page
      queryClient.invalidateQueries({ queryKey: ["referee-match-players"] }); // To update player stats in referee panel
      queryClient.invalidateQueries({ queryKey: ["referee-scheduled-matches"] }); // To update scores in referee panel
      toast.success("Match event added successfully.");
      // Reset event form
      setEventTeamId(null);
      setEventPlayerId(null);
      setEventAssistPlayerId(null);
      setEventPlayerOutId(null);
      setEventPlayerInId(null);
      setEventDescription("");
    },
    onError: (error) => toast.error(`Failed to add event: ${error.message}`),
  });

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !activeMatch || activeMatch.status !== 'live') {
      toast.error("Please select a live match to add events.");
      return;
    }
    if (elapsedTime === 0 && activeMatch.match_start_time === null) {
      toast.error("Match has not started yet. Cannot add events.");
      return;
    }

    try {
      const baseEventData = {
        match_id: selectedMatchId,
        event_type: eventType,
        minute: Math.floor(elapsedTime / 60),
        description: eventDescription || null,
      };

      if (eventType === 'goal') {
        eventSchema.pick(['teamId', 'playerId', 'assistPlayerId']).parse({ teamId: eventTeamId, playerId: eventPlayerId, assistPlayerId: eventAssistPlayerId });
        await handleAddEvent.mutateAsync({
          ...baseEventData,
          player_id: eventPlayerId!,
          assist_player_id: eventAssistPlayerId !== 'none' ? eventAssistPlayerId : undefined,
        });
      } else if (eventType === 'yellow_card' || eventType === 'red_card') {
        eventSchema.pick(['teamId', 'playerId']).parse({ teamId: eventTeamId, playerId: eventPlayerId });
        await handleAddEvent.mutateAsync({
          ...baseEventData,
          player_id: eventPlayerId!,
        });
      } else if (eventType === 'substitution') {
        eventSchema.pick(['teamId', 'playerOutId', 'playerInId']).parse({ teamId: eventTeamId, playerOutId: eventPlayerOutId, playerInId: eventPlayerInId });
        await handleAddEvent.mutateAsync({
          ...baseEventData,
          player_id: eventPlayerOutId!, // Player_id for substitution event is the player going out
          player_out_id: eventPlayerOutId!,
          player_in_id: eventPlayerInId!,
          description: `Sub: ${matchPlayers?.find(p => p.id === eventPlayerOutId)?.name} OFF, ${matchPlayers?.find(p => p.id === eventPlayerInId)?.name} ON`
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(`Error adding event: ${error.message}`);
      }
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'referee') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const homeTeamPlayers = matchPlayers?.filter(p => p.team_id === activeMatch?.home_team_id) || [];
  const awayTeamPlayers = matchPlayers?.filter(p => p.team_id === activeMatch?.away_team_id) || [];
  const allMatchPlayers = matchPlayers || [];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
                  <Shield className="w-6 h-6 text-white" /> {/* Replaced Whistle with Shield */}
                </div>
                <div>
                  <h1 className="text-3xl font-heading gradient-text">Referee Panel</h1>
                  <p className="text-sm text-muted-foreground">Manage live match events and timer</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-destructive/50 hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Match Setup */}
          <Card className="glass-card p-6 rounded-xl mb-8">
            <h2 className="text-2xl font-heading gradient-text mb-4">Match Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="match-select">Select Active Fixture</Label>
                <div className="flex gap-2">
                  <Select value={selectedMatchId || ""} onValueChange={setSelectedMatchId} disabled={matchesLoading || activeMatch?.status === 'finished'}>
                    <SelectTrigger id="match-select">
                      <SelectValue placeholder="Select a match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchesLoading ? (
                        <SelectItem value="loading" disabled>Loading matches...</SelectItem>
                      ) : matchesError ? (
                        <SelectItem value="error" disabled>Error loading matches</SelectItem>
                      ) : scheduledMatches?.length === 0 ? (
                        <SelectItem value="no-matches" disabled>No scheduled/live matches</SelectItem>
                      ) : (
                        scheduledMatches?.map((match) => (
                          <SelectItem key={match.id} value={match.id}>
                            {match.home_team.name} vs {match.away_team.name} ({format(new Date(match.match_date), "MMM d, h:mm a")}) - {match.status.toUpperCase()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => selectedMatchId && navigate(`/matches/${selectedMatchId}`)}
                    disabled={!selectedMatchId}
                    title="View Match Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="pitch">Pitch (Optional)</Label>
                <Input id="pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="e.g., Main Field" disabled={!selectedMatchId || activeMatch?.status !== 'scheduled'} />
              </div>
              <div>
                <Label htmlFor="weather">Weather (Optional)</Label>
                <Input id="weather" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g., Sunny, 25°C" disabled={!selectedMatchId || activeMatch?.status !== 'scheduled'} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleStartMatch} disabled={!selectedMatchId || activeMatch?.status !== 'scheduled' || updateMatchMutation.isPending}>
                <Play className="w-4 h-4 mr-2" />
                Start Match
              </Button>
            </div>
          </Card>

          {activeMatch && (
            <>
              {/* Live Match Display */}
              <Card className="glass-card p-6 rounded-xl mb-8 text-center">
                <h2 className="text-3xl font-heading gradient-text mb-4">
                  {activeMatch.home_team.name} {activeMatch.home_score} - {activeMatch.away_score} {activeMatch.away_team.name}
                </h2>
                <p className="text-muted-foreground mb-4">
                  Status: <span className={`font-semibold ${activeMatch.status === 'live' ? 'text-green-400' : activeMatch.status === 'half_time' ? 'text-yellow-400' : 'text-blue-400'}`}>{activeMatch.status.toUpperCase()}</span>
                  {activeMatch.pitch && ` • Pitch: ${activeMatch.pitch}`}
                  {activeMatch.weather && ` • Weather: ${activeMatch.weather}`}
                </p>

                {/* Match Timer */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="text-6xl font-heading text-white mb-4 flex items-center gap-4">
                    <Clock className="w-12 h-12 text-primary" />
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handlePauseMatch} disabled={!isTimerRunning || activeMatch.status !== 'live' || updateMatchMutation.isPending}>
                      <Pause className="w-4 h-4 mr-2" /> Pause
                    </Button>
                    <Button onClick={handleResumeMatch} disabled={isTimerRunning || activeMatch.status !== 'half_time' || updateMatchMutation.isPending}>
                      <Play className="w-4 h-4 mr-2" /> Resume
                    </Button>
                    <Button onClick={() => handleSetExtraTime(5)} disabled={!isTimerRunning || activeMatch.status !== 'live' || updateMatchMutation.isPending}>
                      <Plus className="w-4 h-4 mr-2" /> 5 Min Extra
                    </Button>
                    <Button onClick={handleEndMatch} disabled={activeMatch.status === 'finished' || updateMatchMutation.isPending} variant="destructive">
                      <StopCircle className="w-4 h-4 mr-2" /> Full-Time
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Live Match Event Controls */}
              <Card className="glass-card p-6 rounded-xl mb-8">
                <h2 className="text-2xl font-heading gradient-text mb-4">Live Match Events</h2>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select value={eventType} onValueChange={(value: "goal" | "yellow_card" | "red_card" | "substitution") => setEventType(value)} disabled={activeMatch.status !== 'live'}>
                      <SelectTrigger id="event-type">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goal">Goal</SelectItem>
                        <SelectItem value="yellow_card">Yellow Card</SelectItem>
                        <SelectItem value="red_card">Red Card</SelectItem>
                        <SelectItem value="substitution">Substitution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {eventType !== 'substitution' && (
                    <>
                      <div>
                        <Label htmlFor="event-team">Team</Label>
                        <Select value={eventTeamId || ""} onValueChange={setEventTeamId} disabled={activeMatch.status !== 'live'}>
                          <SelectTrigger id="event-team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeMatch.home_team && <SelectItem value={activeMatch.home_team_id}>{activeMatch.home_team.name}</SelectItem>}
                            {activeMatch.away_team && <SelectItem value={activeMatch.away_team_id}>{activeMatch.away_team.name}</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="event-player">Player</Label>
                        <Select value={eventPlayerId || ""} onValueChange={setEventPlayerId} disabled={activeMatch.status !== 'live' || !eventTeamId}>
                          <SelectTrigger id="event-player">
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {(eventTeamId === activeMatch.home_team_id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                              <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {eventType === 'goal' && (
                    <div>
                      <Label htmlFor="assist-player">Assist Player (Optional)</Label>
                      <Select value={eventAssistPlayerId || "none"} onValueChange={setEventAssistPlayerId} disabled={activeMatch.status !== 'live' || !eventTeamId}>
                        <SelectTrigger id="assist-player">
                          <SelectValue placeholder="Select assist player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Assist</SelectItem>
                          {(eventTeamId === activeMatch.home_team_id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                            <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {eventType === 'substitution' && (
                    <>
                      <div>
                        <Label htmlFor="sub-team">Team</Label>
                        <Select value={eventTeamId || ""} onValueChange={setEventTeamId} disabled={activeMatch.status !== 'live'}>
                          <SelectTrigger id="sub-team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeMatch.home_team && <SelectItem value={activeMatch.home_team_id}>{activeMatch.home_team.name}</SelectItem>}
                            {activeMatch.away_team && <SelectItem value={activeMatch.away_team_id}>{activeMatch.away_team.name}</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="player-out">Player Out</Label>
                        <Select value={eventPlayerOutId || ""} onValueChange={setEventPlayerOutId} disabled={activeMatch.status !== 'live' || !eventTeamId}>
                          <SelectTrigger id="player-out">
                            <SelectValue placeholder="Select player out" />
                          </SelectTrigger>
                          <SelectContent>
                            {(eventTeamId === activeMatch.home_team_id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                              <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="player-in">Player In</Label>
                        <Select value={eventPlayerInId || ""} onValueChange={setEventPlayerInId} disabled={activeMatch.status !== 'live' || !eventTeamId}>
                          <SelectTrigger id="player-in">
                            <SelectValue placeholder="Select player in" />
                          </SelectTrigger>
                          <SelectContent>
                            {(eventTeamId === activeMatch.home_team_id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                              <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="event-description">Description (Optional)</Label>
                    <Input id="event-description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="e.g., Header from corner" disabled={activeMatch.status !== 'live'} />
                  </div>

                  <Button type="submit" className="w-full" disabled={activeMatch.status !== 'live' || handleAddEvent.isPending}>
                    <Plus className="w-4 h-4 mr-2" /> Add Event ({formatTime(elapsedTime)})
                  </Button>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefereePanel;
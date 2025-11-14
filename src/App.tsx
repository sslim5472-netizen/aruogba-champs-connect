import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Teams from "./pages/Teams";
import TeamProfile from "./pages/TeamProfile";
import Fixtures from "./pages/Fixtures";
import LiveMatch from "./pages/LiveMatch";
import Stats from "./pages/Stats";
import Voting from "./pages/Voting";
import Highlights from "./pages/Highlights";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamSlug" element={<TeamProfile />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/live" element={<LiveMatch />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/voting" element={<Voting />} />
            <Route path="/highlights" element={<Highlights />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

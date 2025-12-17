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
import TopScorers from "./pages/TopScorers";
import TopAssists from "./pages/TopAssists";
import TopYellowCards from "./pages/TopYellowCards";
import TopRedCards from "./pages/TopRedCards";
import Standings from "./pages/Standings";
import Voting from "./pages/Voting";
import Media from "./pages/Media";
import MotmAwards from "./pages/MotmAwards";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminManagement from "./pages/AdminManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import VotingNotification from "./components/VotingNotification"; // Import the new component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> {/* Added v7_relativeSplatPath */}
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              <VotingNotification /> {/* Place the notification component here */}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:teamSlug" element={<TeamProfile />} />
                <Route path="/fixtures" element={<Fixtures />} />
                <Route path="/live" element={<LiveMatch />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/stats/top-scorers" element={<TopScorers />} />
                <Route path="/stats/top-assists" element={<TopAssists />} />
                <Route path="/stats/top-yellow-cards" element={<TopYellowCards />} />
                <Route path="/stats/top-red-cards" element={<TopRedCards />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/voting" element={<Voting />} />
                <Route path="/media" element={<Media />} />
                <Route path="/highlights" element={<Media />} />
                <Route path="/motm" element={<MotmAwards />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/manage" element={<AdminManagement />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
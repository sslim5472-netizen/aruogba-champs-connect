import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Teams from "./pages/Teams";
import TeamProfile from "./pages/TeamProfile";
import Fixtures from "./pages/Fixtures";
import LiveMatch from "./pages/LiveMatch";
import MatchDetails from "./pages/MatchDetails";
import Stats from "./pages/Stats";
import TopScorers from "./pages/TopScorers";
import TopAssists from "./pages/TopAssists";
import TopYellowCards from "./pages/TopYellowCards";
import TopRedCards from "./pages/TopRedCards";
import Standings from "./pages/Standings";
import Media from "./pages/Media";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:teamSlug" element={<TeamProfile />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/live" element={<LiveMatch />} />
              <Route path="/matches/:matchId" element={<MatchDetails />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/stats/top-scorers" element={<TopScorers />} />
              <Route path="/stats/top-assists" element={<TopAssists />} />
              <Route path="/stats/top-yellow-cards" element={<TopYellowCards />} />
              <Route path="/stats/top-red-cards" element={<TopRedCards />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/media" element={<Media />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
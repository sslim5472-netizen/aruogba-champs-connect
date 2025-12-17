import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HighlightsView from "@/components/media/HighlightsView";
import PhotosView from "@/components/media/PhotosView";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Media = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("highlights");

  // If accessed via /highlights, default to highlights tab
  useEffect(() => {
    if (location.pathname === "/highlights") {
      setActiveTab("highlights");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Media Center
          </h1>
          <p className="text-muted-foreground">
            Relive the best moments from the tournament
          </p>
        </div>

        <Tabs defaultValue="highlights" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 glass-card max-w-md mx-auto">
            <TabsTrigger value="highlights">Match Highlights</TabsTrigger>
            <TabsTrigger value="photos">Photo Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="highlights">
            <HighlightsView />
          </TabsContent>
          
          <TabsContent value="photos">
            <PhotosView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Media;
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhotosView from "@/components/media/PhotosView";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Media = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("photos"); // Default to photos

  // If accessed via /highlights, default to photos tab now
  useEffect(() => {
    if (location.pathname === "/highlights") {
      setActiveTab("photos");
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading gradient-text mb-4">
            Photo Gallery
          </h1>
          <p className="text-muted-foreground">
            Relive the best moments from the tournament
          </p>
        </div>

        <Tabs defaultValue="photos" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 glass-card max-w-md mx-auto"> {/* Changed grid-cols to 1 */}
            {/* Removed Highlights TabTrigger */}
            <TabsTrigger value="photos">Photo Gallery</TabsTrigger>
          </TabsList>

          {/* Removed HighlightsContent */}
          
          <TabsContent value="photos">
            <PhotosView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Media;
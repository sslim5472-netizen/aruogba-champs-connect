import React from "react"; // Added React import
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SessionContextProvider } from "./components/SessionContextProvider.tsx";
import { Toaster } from "sonner"; // Re-adding Toaster for general app notifications

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SessionContextProvider>
      <App />
      <Toaster />
    </SessionContextProvider>
  </React.StrictMode>
);
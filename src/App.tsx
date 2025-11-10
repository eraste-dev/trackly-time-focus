import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ActiveTimerFooter } from "@/components/ActiveTimerFooter";
import { migrateFromLocalStorage } from "@/lib/db";
import { loadSyncData, startAutoSync, stopAutoSync } from "@/lib/sync";

const queryClient = new QueryClient();

const App = () => {
  // Migration et initialisation au démarrage
  useEffect(() => {
    const initialize = async () => {
      // Migration depuis localStorage (première fois uniquement)
      await migrateFromLocalStorage();

      // Charger depuis le store de synchronisation optimisé
      const result = await loadSyncData();
      if (result.success) {
        console.log('✅', result.message);
      } else {
        console.log('ℹ️', result.message);
      }

      // Démarrer la synchronisation automatique (toutes les 5 minutes + détection de changements)
      startAutoSync(5);
    };

    initialize();

    // Nettoyer à la fermeture
    return () => {
      stopAutoSync();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ActiveTimerFooter />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

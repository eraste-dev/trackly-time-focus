import { useEffect, useState } from "react";
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
import { LoadingScreen } from "@/components/LoadingScreen";
import { migrateFromLocalStorage } from "@/lib/db";
import { loadSyncData, startAutoSync, stopAutoSync, saveSyncData } from "@/lib/sync";
import { SelectedProjectProvider } from "@/contexts/SelectedProjectContext";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initialisation...');

  // Migration et initialisation au démarrage
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Étape 1: Migration
        setLoadingMessage('Migration des données...');
        await migrateFromLocalStorage();
        await new Promise(resolve => setTimeout(resolve, 300));

        // Étape 2: Chargement depuis les fichiers de synchronisation
        setLoadingMessage('Synchronisation en cours...');
        const result = await loadSyncData();
        if (result.success) {
          console.log('✅', result.message);
        } else {
          console.log('ℹ️', result.message);
        }
        await new Promise(resolve => setTimeout(resolve, 500));

        // Étape 3: Démarrer la synchronisation automatique
        setLoadingMessage('Configuration de la synchronisation automatique...');
        startAutoSync(5);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Étape 4: Prêt
        setLoadingMessage('Application prête!');
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Nettoyer à la fermeture
    return () => {
      stopAutoSync();
      saveSyncData(); // Sauvegarder avant de quitter
    };
  }, []);

  // Afficher l'écran de chargement pendant l'initialisation
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} details="Veuillez patienter pendant que nous chargeons vos données..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SelectedProjectProvider>
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
      </SelectedProjectProvider>
    </QueryClientProvider>
  );
};

export default App;

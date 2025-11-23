import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import { ActiveTimerFooter } from "@/components/ActiveTimerFooter";
import { LoadingScreen } from "@/components/LoadingScreen";
import { migrateFromLocalStorage, initializeAdmin } from "@/lib/db";
import { loadSyncData, startAutoSync, stopAutoSync, saveSyncData } from "@/lib/sync";
import { SelectedProjectProvider } from "@/contexts/SelectedProjectContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Vérification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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

        // Étape 1.5: Initialiser l'admin
        setLoadingMessage('Initialisation de l\'admin...');
        await initializeAdmin();
        await new Promise(resolve => setTimeout(resolve, 200));

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
      <AuthProvider>
        <SelectedProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
              <ActiveTimerFooter />
            </BrowserRouter>
          </TooltipProvider>
        </SelectedProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

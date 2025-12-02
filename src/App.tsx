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
import { FloatingProjectSelector } from "@/components/FloatingProjectSelector";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SelectedProjectProvider } from "@/contexts/SelectedProjectContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { healthApi } from "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

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
  const [apiError, setApiError] = useState<string | null>(null);

  // Vérification de la connexion API au démarrage
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage('Connexion au serveur...');

        // Vérifier que l'API est disponible
        await healthApi.check();

        setLoadingMessage('Application prête!');
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Erreur lors de la connexion au serveur:', error);
        setApiError('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Afficher l'écran de chargement pendant l'initialisation
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} details="Veuillez patienter..." />;
  }

  // Afficher un message d'erreur si l'API n'est pas disponible
  if (apiError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-destructive">Erreur de connexion</h1>
          <p className="text-muted-foreground">{apiError}</p>
          <p className="text-sm text-muted-foreground">
            Assurez-vous que le serveur backend est démarré sur le port 3001.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
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
              <FloatingProjectSelector />
              <ActiveTimerFooter />
            </BrowserRouter>
          </TooltipProvider>
        </SelectedProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, FolderOpen, Settings, Home, Timer, Clock, Users, LogOut } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useSelectedProject } from '@/contexts/SelectedProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const Header = () => {
  const { projects } = useProjects();
  const { isRunning, activeTimer } = useActiveTimer();
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject();
  const { isAdmin, logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleSettingsClick = (e: React.MouseEvent) => {
    if (isRunning) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4 max-w-5xl">
        <div className="space-y-4">
          {/* Ligne 1: Logo et sélecteur de projet */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo et titre */}
            <Link to="/" className="flex-shrink-0 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Trackly
                  </h1>
                  <p className="text-xs text-muted-foreground">Time Tracker</p>
                </div>
              </div>
            </Link>

            {/* Sélecteur de projet global */}
            {projects.length > 0 && (
              <div className="flex-grow max-w-sm">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={isRunning}
                >
                  <SelectTrigger
                    disabled={isRunning}
                    className={cn(
                      "w-full border-2 transition-all",
                      isRunning && "border-success/30 bg-success/5 cursor-not-allowed",
                      !isRunning && "hover:border-primary/30"
                    )}
                  >
                    <SelectValue placeholder="Sélectionner un projet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isRunning && activeTimer && (
                  <p className="text-xs text-success mt-1 ml-1 font-medium animate-pulse">
                    ● Timer en cours sur {projects.find(p => p.id === activeTimer.projectId)?.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Ligne 2: Menu de navigation */}
          <nav className="flex gap-1 justify-start">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isActive('/') && "shadow-sm"
                )}
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Accueil</span>
              </Button>
            </Link>
            <Link to="/projects">
              <Button
                variant={isActive('/projects') ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isActive('/projects') && "shadow-sm"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Projets</span>
              </Button>
            </Link>
            <Link to="/reports">
              <Button
                variant={isActive('/reports') ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isActive('/reports') && "shadow-sm"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Rapports</span>
              </Button>
            </Link>
            <Link to="/sessions">
              <Button
                variant={isActive('/sessions') ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isActive('/sessions') && "shadow-sm"
                )}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Sessions</span>
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/users">
                <Button
                  variant={isActive('/users') ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    isActive('/users') && "shadow-sm"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Utilisateurs</span>
                </Button>
              </Link>
            )}
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "gap-2 transition-all",
                isActive('/settings') && "shadow-sm"
              )}
              disabled={isRunning}
              onClick={handleSettingsClick}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {currentUser?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

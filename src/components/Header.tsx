import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart3,
  FolderOpen,
  Settings,
  Home,
  Timer,
  Clock,
  Users,
  LogOut,
  Moon,
  Sun,
  Monitor,
  User,
  ChevronDown
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export const Header = () => {
  const { projects } = useProjects();
  const { isRunning, activeTimer } = useActiveTimer();
  const { isAdmin, logout, currentUser } = useAuth();
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();
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

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/projects', icon: FolderOpen, label: 'Projets' },
    { path: '/reports', icon: BarChart3, label: 'Rapports' },
    { path: '/sessions', icon: Clock, label: 'Sessions' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ];

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-3 max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-primary to-primary/60",
                  "group-hover:shadow-lg group-hover:shadow-primary/25 group-hover:scale-105"
                )}>
                  <Timer className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Trackly
                  </h1>
                </div>
              </div>
            </Link>

            {/* Navigation centrale */}
            <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "gap-2 h-8 px-3 transition-all duration-200",
                      isActive(item.path)
                        ? "shadow-sm"
                        : "hover:bg-background/80"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                </Link>
              ))}
              {isAdmin && (
                <Link to="/users">
                  <Button
                    variant={isActive('/users') ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "gap-2 h-8 px-3 transition-all duration-200",
                      isActive('/users')
                        ? "shadow-sm"
                        : "hover:bg-background/80"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Utilisateurs</span>
                  </Button>
                </Link>
              )}
            </nav>

            {/* Navigation mobile */}
            <nav className="flex md:hidden items-center gap-1">
              {navItems.map((item) => (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path}>
                      <Button
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          "h-8 w-8 transition-all",
                          isActive(item.path) && "shadow-sm"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>

            {/* Actions à droite */}
            <div className="flex items-center gap-2">
              {/* Sélecteur de projet (si timer actif) */}
              {isRunning && activeTimer && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  <span className="text-xs font-medium text-success">
                    {projects.find(p => p.id === activeTimer.projectId)?.name}
                  </span>
                </div>
              )}

              {/* Toggle thème */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {resolvedTheme === 'dark' ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuLabel className="text-xs">Thème</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {themeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setTheme(option.value as any)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        theme === option.value && "bg-accent"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Paramètres */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive('/settings') ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    disabled={isRunning}
                    onClick={handleSettingsClick}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRunning ? 'Arrêtez le timer pour accéder aux paramètres' : 'Paramètres'}
                </TooltipContent>
              </Tooltip>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8 pl-2 pr-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                      {currentUser?.username}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? 'Administrateur' : 'Utilisateur'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>
      </header>
    </TooltipProvider>
  );
};

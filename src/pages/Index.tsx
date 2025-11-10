import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer } from '@/components/Timer';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, BarChart3, FolderOpen, Plus, Settings } from 'lucide-react';
import { TimeEntry, formatDurationShort, calculateTotalDuration } from '@/lib/timeTracking';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { toast } from 'sonner';

// Sons de notification
const playStartSound = () => {
  const audio = new Audio('/notifications/start.mp3');
  audio.play().catch(() => {});
};

const playStopSound = () => {
  const audio = new Audio('/notifications/stop.mp3');
  audio.play().catch(() => {});
};

const Index = () => {
  const { projects } = useProjects();
  const { timeEntries, addTimeEntry, getEntriesByTimePeriod } = useTimeEntries();
  const { activeTimer, startTimer, stopTimer } = useActiveTimer();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  // Restaurer l'état du timer depuis la DB
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.projectId) {
      setSelectedProjectId(activeTimer.projectId);
    }
  }, [activeTimer]);

  // Auto-sélectionner le premier projet si disponible
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId && !activeTimer?.isRunning) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, activeTimer]);

  const handleStartTimer = () => {
    if (!selectedProjectId) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }
    setShowStartConfirm(true);
  };

  const confirmStartTimer = async () => {
    if (!selectedProjectId) return;

    await startTimer(selectedProjectId);
    setShowStartConfirm(false);
    playStartSound();
    toast.success('Timer démarré');
  };

  const handleStopTimer = async () => {
    if (!activeTimer?.startTime || !activeTimer.projectId) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId: activeTimer.projectId,
      startTime: activeTimer.startTime,
      endTime,
      duration
    };

    await addTimeEntry(newEntry);
    await stopTimer();
    playStopSound();
  };

  const todayEntries = getEntriesByTimePeriod('day');
  const weekEntries = getEntriesByTimePeriod('week');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimaliste */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">Trackly</h1>
              <p className="text-sm text-muted-foreground mt-1">Suivi du temps simplifié</p>
            </div>
            <div className="flex gap-2">
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Projets</span>
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Rapports</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Paramètres</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* Stats minimalistes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="text-center py-6 border border-border rounded-lg bg-white">
            <div className="flex justify-center mb-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">
              {formatDurationShort(calculateTotalDuration(todayEntries))}
            </div>
            <div className="text-xs text-muted-foreground">Aujourd'hui</div>
          </div>

          <div className="text-center py-6 border border-border rounded-lg bg-white">
            <div className="flex justify-center mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">
              {formatDurationShort(calculateTotalDuration(weekEntries))}
            </div>
            <div className="text-xs text-muted-foreground">Cette semaine</div>
          </div>

          <div className="text-center py-6 border border-border rounded-lg bg-white col-span-2 sm:col-span-1">
            <div className="flex justify-center mb-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-light text-foreground mb-1">
              {projects.length}
            </div>
            <div className="text-xs text-muted-foreground">Projets</div>
          </div>
        </div>

        {/* Timer central */}
        <Card className="mb-8 border border-border shadow-none">
          <div className="p-6 sm:p-8">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Aucun projet disponible</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Créez d'abord un projet pour commencer à suivre votre temps
                </p>
                <Link to="/projects">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    Créer un projet
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Sélectionner un projet
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full mb-6 h-12">
                    <SelectValue placeholder="Choisir un projet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

            <div className="flex flex-col items-center py-8">
              <Timer
                isRunning={activeTimer?.isRunning || false}
                onStart={handleStartTimer}
                onStop={handleStopTimer}
                projectId={selectedProjectId}
                startTime={activeTimer?.startTime}
              />
            </div>

                {selectedProject && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-3 justify-center">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedProject.color }}
                      />
                      <span className="text-sm text-muted-foreground">{selectedProject.name}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Dialog de confirmation démarrage timer */}
        <AlertDialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Démarrer le timer ?</AlertDialogTitle>
              <AlertDialogDescription>
                Vous allez démarrer le suivi du temps pour le projet{' '}
                <span className="font-semibold">{selectedProject?.name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStartTimer} className="bg-primary hover:bg-primary/90">
                Démarrer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Liste des projets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Projets actifs</h2>
            <Link to="/projects">
              <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" />
                Nouveau
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.slice(0, 4).map((project) => {
              const projectTime = todayEntries.filter(e => e.projectId === project.id);
              const duration = formatDurationShort(calculateTotalDuration(projectTime));

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedProjectId === project.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <div className="font-medium text-sm text-foreground">{project.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{duration} aujourd'hui</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Entrées du jour */}
        <div>
          <h2 className="text-lg font-medium text-foreground mb-4">Aujourd'hui</h2>
          <Card className="border border-border shadow-none">
            <div className="divide-y divide-border">
              {todayEntries.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucune entrée aujourd'hui</p>
                </div>
              ) : (
                todayEntries.slice(0, 8).map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  if (!project) return null;
                  return <TimeEntryRow key={entry.id} entry={entry} project={project} />;
                })
              )}
            </div>
            {todayEntries.length > 8 && (
              <div className="p-4 border-t border-border">
                <Link to="/reports">
                  <Button variant="ghost" className="w-full text-sm">
                    Voir toutes les entrées
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

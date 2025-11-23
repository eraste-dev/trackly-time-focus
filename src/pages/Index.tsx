import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Timer } from '@/components/Timer';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { FocusMode } from '@/components/FocusMode';
import { EditTimeEntryDialog } from '@/components/EditTimeEntryDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, FolderOpen, Plus } from 'lucide-react';
import { TimeEntry, formatDurationShort, calculateTotalDuration } from '@/lib/timeTracking';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useSelectedProject } from '@/contexts/SelectedProjectContext';
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
  const { timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, getEntriesByTimePeriod } = useTimeEntries();
  const { activeTimer, startTimer, stopTimer, pauseTimer, resumeTimer } = useActiveTimer();
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);

  // Auto-sélectionner le premier projet si disponible
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId && !activeTimer?.isRunning) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, activeTimer, setSelectedProjectId]);

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
    const totalElapsed = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000);
    const duration = totalElapsed - (activeTimer.totalPausedDuration || 0);

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

  const handlePauseTimer = async () => {
    await pauseTimer();
    toast.info('Timer mis en pause');
  };

  const handleResumeTimer = async () => {
    await resumeTimer();
    playStartSound();
    toast.success('Timer repris');
  };

  // Handlers pour édition et suppression
  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEntry = async (updatedEntry: TimeEntry) => {
    await updateTimeEntry(updatedEntry.id, updatedEntry);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entry: TimeEntry) => {
    setDeletingEntry(entry);
  };

  const confirmDeleteEntry = async () => {
    if (deletingEntry) {
      await deleteTimeEntry(deletingEntry.id);
      setDeletingEntry(null);
    }
  };

  // Filtrer les entrées par projet sélectionné
  const allTodayEntries = getEntriesByTimePeriod('day');
  const allWeekEntries = getEntriesByTimePeriod('week');

  const todayEntries = selectedProjectId
    ? allTodayEntries.filter(e => e.projectId === selectedProjectId)
    : allTodayEntries;

  const weekEntries = selectedProjectId
    ? allWeekEntries.filter(e => e.projectId === selectedProjectId)
    : allWeekEntries;

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec sélecteur de projet global */}
      <Header />

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
              <div className="flex flex-col items-center py-8">
                <Timer
                  isRunning={activeTimer?.isRunning || false}
                  isPaused={activeTimer?.isPaused || false}
                  onStart={handleStartTimer}
                  onStop={handleStopTimer}
                  onPause={handlePauseTimer}
                  onResume={handleResumeTimer}
                  projectId={activeTimer?.isRunning ? activeTimer.projectId : selectedProjectId}
                  startTime={activeTimer?.startTime}
                  totalPausedDuration={activeTimer?.totalPausedDuration || 0}
                />
                {/* Afficher le projet du timer si actif, sinon le projet sélectionné */}
                {((activeTimer?.isRunning && activeTimer.projectId) || selectedProjectId) && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-3 justify-center">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: activeTimer?.isRunning
                            ? projects.find(p => p.id === activeTimer.projectId)?.color
                            : selectedProject?.color
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {activeTimer?.isRunning
                          ? projects.find(p => p.id === activeTimer.projectId)?.name
                          : selectedProject?.name
                        }
                      </span>
                      {activeTimer?.isRunning && (
                        <span className="text-xs text-success font-medium">(en cours)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                  return (
                    <TimeEntryRow
                      key={entry.id}
                      entry={entry}
                      project={project}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  );
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

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette session ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La session de temps sera définitivement supprimée.
              {deletingEntry && (
                <div className="mt-3 p-3 rounded-lg bg-muted">
                  <p className="text-sm text-foreground font-medium">
                    Durée : {formatDurationShort(deletingEntry.duration)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(deletingEntry.startTime).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingEntry(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog d'édition */}
      <EditTimeEntryDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={handleSaveEntry}
      />

      {/* Mode Focus - affiché par-dessus tout le contenu */}
      {showFocusMode && activeTimer?.isRunning && (
        <FocusMode onClose={() => setShowFocusMode(false)} />
      )}
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { Square, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/timeTracking';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { TimeEntry } from '@/lib/timeTracking';
import { toast } from 'sonner';

const playStopSound = () => {
  const audio = new Audio('/notifications/stop.mp3');
  audio.play().catch(() => {});
};

const playStartSound = () => {
  const audio = new Audio('/notifications/start.mp3');
  audio.play().catch(() => {});
};

export const ActiveTimerFooter = () => {
  const { activeTimer, stopTimer, pauseTimer, resumeTimer } = useActiveTimer();
  const { projects } = useProjects();
  const { addTimeEntry } = useTimeEntries();
  const [elapsed, setElapsed] = useState(0);

  // Calculer le temps écoulé (en excluant les pauses)
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.startTime) {
      const updateElapsed = () => {
        const totalElapsed = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000);
        const activeElapsed = totalElapsed - (activeTimer.totalPausedDuration || 0);
        setElapsed(activeElapsed);
      };

      updateElapsed();

      // Si en pause, ne pas mettre à jour
      if (activeTimer.isPaused) {
        return;
      }

      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const handleStop = async () => {
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
    toast.success('Timer arrêté');
  };

  const handlePause = async () => {
    await pauseTimer();
    toast.info('Timer mis en pause');
  };

  const handleResume = async () => {
    await resumeTimer();
    playStartSound();
    toast.success('Timer repris');
  };

  if (!activeTimer?.isRunning) return null;

  const project = projects.find(p => p.id === activeTimer.projectId);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 py-3 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {project && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {project.name}
                </span>
              </div>
            )}
            <div className={`text-lg font-bold ${activeTimer.isPaused ? 'text-warning' : 'text-success'}`}>
              {formatDuration(elapsed)}
            </div>
            {activeTimer.isPaused && (
              <span className="text-xs text-warning font-medium hidden sm:inline animate-pulse">
                En pause
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {activeTimer.isPaused ? (
              <Button
                onClick={handleResume}
                size="sm"
                className="gap-2 bg-success hover:bg-success/90"
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Reprendre</span>
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
                className="gap-2 border-warning text-warning hover:bg-warning/10"
              >
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </Button>
            )}
            <Button
              onClick={handleStop}
              size="sm"
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">Arrêter</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

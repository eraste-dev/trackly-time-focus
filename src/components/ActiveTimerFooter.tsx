import { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
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

export const ActiveTimerFooter = () => {
  const { activeTimer, stopTimer } = useActiveTimer();
  const { projects } = useProjects();
  const { addTimeEntry } = useTimeEntries();
  const [elapsed, setElapsed] = useState(0);

  // Calculer le temps écoulé
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.startTime) {
      const updateElapsed = () => {
        const currentElapsed = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000);
        setElapsed(currentElapsed);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const handleStop = async () => {
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
    toast.success('Timer arrêté');
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
            <div className="text-lg font-bold text-success">
              {formatDuration(elapsed)}
            </div>
          </div>
          <Button
            onClick={handleStop}
            size="sm"
            variant="destructive"
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Arrêter
          </Button>
        </div>
      </div>
    </footer>
  );
};

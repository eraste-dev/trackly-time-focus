import { useState, useEffect } from 'react';
import { Play, Square, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/timeTracking';
import { cn } from '@/lib/utils';

interface TimerProps {
  isRunning: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  projectId?: string;
  startTime?: Date;
  totalPausedDuration?: number;
}

export const Timer = ({
  isRunning,
  isPaused = false,
  onStart,
  onStop,
  onPause,
  onResume,
  projectId,
  startTime,
  totalPausedDuration = 0
}: TimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  // Calculer le temps écoulé depuis startTime, en excluant les pauses
  useEffect(() => {
    if (isRunning && startTime) {
      const updateElapsed = () => {
        const totalElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const activeElapsed = totalElapsed - totalPausedDuration;
        setElapsed(activeElapsed);
      };

      // Calculer immédiatement
      updateElapsed();

      // Si en pause, ne pas mettre à jour
      if (isPaused) {
        return;
      }

      // Mettre à jour chaque seconde si pas en pause
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else if (!isRunning) {
      setElapsed(0);
    }
  }, [isRunning, isPaused, startTime, totalPausedDuration]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={cn(
        "text-6xl font-bold tracking-wider transition-all duration-300",
        isRunning && !isPaused ? "text-success" : isPaused ? "text-warning" : "text-foreground"
      )}>
        {formatDuration(elapsed)}
      </div>

      {isPaused && (
        <div className="text-sm text-warning font-medium animate-pulse">
          En pause
        </div>
      )}

      <div className="flex gap-4">
        {!isRunning ? (
          <Button
            onClick={onStart}
            disabled={!projectId}
            size="lg"
            className="gap-2 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 px-8 py-6 text-lg shadow-lg"
          >
            <Play className="h-5 w-5" />
            Démarrer
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={onResume}
                size="lg"
                className="gap-2 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 px-8 py-6 text-lg shadow-lg"
              >
                <Play className="h-5 w-5" />
                Reprendre
              </Button>
            ) : (
              <Button
                onClick={onPause}
                size="lg"
                variant="outline"
                className="gap-2 px-8 py-6 text-lg shadow-lg border-warning text-warning hover:bg-warning/10"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
            )}
            <Button
              onClick={onStop}
              size="lg"
              variant="destructive"
              className="gap-2 px-8 py-6 text-lg shadow-lg"
            >
              <Square className="h-5 w-5" />
              Arrêter
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

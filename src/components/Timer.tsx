import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/timeTracking';
import { cn } from '@/lib/utils';

interface TimerProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  projectId?: string;
  startTime?: Date;
}

export const Timer = ({ isRunning, onStart, onStop, projectId, startTime }: TimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  // Calculer le temps écoulé depuis startTime
  useEffect(() => {
    if (isRunning && startTime) {
      // Calculer le temps initial écoulé
      const initialElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(initialElapsed);

      // Mettre à jour chaque seconde
      const interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsed(currentElapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else if (!isRunning) {
      setElapsed(0);
    }
  }, [isRunning, startTime]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={cn(
        "text-6xl font-bold tracking-wider transition-all duration-300",
        isRunning ? "text-success" : "text-foreground"
      )}>
        {formatDuration(elapsed)}
      </div>
      
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
          <Button
            onClick={onStop}
            size="lg"
            variant="destructive"
            className="gap-2 px-8 py-6 text-lg shadow-lg"
          >
            <Square className="h-5 w-5" />
            Arrêter
          </Button>
        )}
      </div>
    </div>
  );
};

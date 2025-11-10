import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ActiveTimer } from '@/lib/timeTracking';

export const useActiveTimer = () => {
  // Récupérer le timer actif en temps réel
  const activeTimer = useLiveQuery(() => db.activeTimer.get('active'));

  // Démarrer le timer
  const startTimer = async (projectId: string) => {
    const timer: ActiveTimer = {
      id: 'active',
      projectId,
      startTime: new Date(),
      isRunning: true,
      isPaused: false,
      totalPausedDuration: 0
    };
    await db.activeTimer.put(timer);
  };

  // Arrêter le timer
  const stopTimer = async () => {
    await db.activeTimer.delete('active');
  };

  // Mettre en pause le timer
  const pauseTimer = async () => {
    if (activeTimer && !activeTimer.isPaused) {
      await db.activeTimer.update('active', {
        isPaused: true,
        pausedAt: new Date()
      });
    }
  };

  // Reprendre le timer après une pause
  const resumeTimer = async () => {
    if (activeTimer && activeTimer.isPaused && activeTimer.pausedAt) {
      const pauseDuration = Math.floor((Date.now() - activeTimer.pausedAt.getTime()) / 1000);
      const newTotalPausedDuration = (activeTimer.totalPausedDuration || 0) + pauseDuration;

      await db.activeTimer.update('active', {
        isPaused: false,
        pausedAt: undefined,
        totalPausedDuration: newTotalPausedDuration
      });
    }
  };

  // Mettre à jour le projet du timer
  const updateTimerProject = async (projectId: string) => {
    if (activeTimer) {
      await db.activeTimer.update('active', { projectId });
    }
  };

  return {
    activeTimer,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateTimerProject,
    isRunning: activeTimer?.isRunning || false,
    isPaused: activeTimer?.isPaused || false
  };
};

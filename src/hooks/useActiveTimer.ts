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
      isRunning: true
    };
    await db.activeTimer.put(timer);
  };

  // Arrêter le timer
  const stopTimer = async () => {
    await db.activeTimer.delete('active');
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
    updateTimerProject,
    isRunning: activeTimer?.isRunning || false
  };
};

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TimeEntry, getEntriesByPeriod } from '@/lib/timeTracking';
import { toast } from 'sonner';

export const useTimeEntries = () => {
  // Récupération en temps réel de toutes les entrées de temps
  const timeEntries = useLiveQuery(() =>
    db.timeEntries.orderBy('startTime').reverse().toArray()
  ) || [];

  // Ajouter une nouvelle entrée de temps
  const addTimeEntry = async (entry: TimeEntry) => {
    try {
      await db.timeEntries.add(entry);
      toast.success('Temps enregistré');
      return entry;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du temps:', error);
      toast.error('Erreur lors de l\'enregistrement');
      throw error;
    }
  };

  // Mettre à jour une entrée de temps
  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      await db.timeEntries.update(id, updates);
      toast.success('Entrée mise à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'entrée:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  // Supprimer une entrée de temps
  const deleteTimeEntry = async (id: string) => {
    try {
      await db.timeEntries.delete(id);
      toast.success('Entrée supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  // Obtenir une entrée par ID
  const getTimeEntry = async (id: string) => {
    return await db.timeEntries.get(id);
  };

  // Obtenir les entrées par projet
  const getEntriesByProject = async (projectId: string) => {
    return await db.timeEntries.where('projectId').equals(projectId).toArray();
  };

  // Obtenir les entrées par période (utilise la fonction existante)
  const getEntriesByTimePeriod = (period: 'day' | 'week' | 'month') => {
    return getEntriesByPeriod(timeEntries, period);
  };

  return {
    timeEntries,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntry,
    getEntriesByProject,
    getEntriesByTimePeriod
  };
};

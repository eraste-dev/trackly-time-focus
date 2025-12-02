import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi, TimeEntry } from '@/lib/api';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Helper to filter entries by period
function getEntriesByPeriod(entries: TimeEntry[], period: 'day' | 'week' | 'month'): TimeEntry[] {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return entries.filter((entry) => entry.startTime >= start);
}

export const useTimeEntries = () => {
  const queryClient = useQueryClient();

  // Récupération de toutes les entrées de temps
  const { data: timeEntries = [], isLoading, error } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => timeEntriesApi.getAll(),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Mutation pour ajouter une entrée
  const addMutation = useMutation({
    mutationFn: (entry: Omit<TimeEntry, 'id' | 'project'>) => timeEntriesApi.create(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Temps enregistré');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de l\'enregistrement du temps:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });

  // Mutation pour mettre à jour une entrée
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeEntry> }) =>
      timeEntriesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Entrée mise à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour de l\'entrée:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Mutation pour supprimer une entrée
  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Entrée supprimée');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  // Fonctions wrapper pour maintenir l'API existante
  const addTimeEntry = async (entry: TimeEntry) => {
    const created = await addMutation.mutateAsync({
      projectId: entry.projectId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      description: entry.description,
    });
    return created;
  };

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteTimeEntry = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const getTimeEntry = async (id: string) => {
    return timeEntriesApi.getById(id);
  };

  const getEntriesByProject = async (projectId: string) => {
    return timeEntriesApi.getAll({ projectId });
  };

  const getEntriesByTimePeriod = (period: 'day' | 'week' | 'month') => {
    return getEntriesByPeriod(timeEntries, period);
  };

  return {
    timeEntries,
    isLoading,
    error,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntry,
    getEntriesByProject,
    getEntriesByTimePeriod,
  };
};

// Re-export TimeEntry type for convenience
export type { TimeEntry } from '@/lib/api';

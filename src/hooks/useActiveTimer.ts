import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timerApi, ActiveTimer, TimeEntry } from '@/lib/api';

export const useActiveTimer = () => {
  const queryClient = useQueryClient();

  // Récupérer le timer actif
  const { data: activeTimer, isLoading, error } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: timerApi.get,
    staleTime: 1000 * 5, // 5 seconds - refresh more often for timer
    refetchInterval: 1000 * 10, // Poll every 10 seconds
  });

  // Mutation pour démarrer le timer
  const startMutation = useMutation({
    mutationFn: (projectId: string) => timerApi.start(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Mutation pour arrêter le timer
  const stopMutation = useMutation({
    mutationFn: () => timerApi.stop(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Mutation pour mettre en pause
  const pauseMutation = useMutation({
    mutationFn: () => timerApi.pause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });

  // Mutation pour reprendre
  const resumeMutation = useMutation({
    mutationFn: () => timerApi.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });

  // Mutation pour changer de projet
  const updateProjectMutation = useMutation({
    mutationFn: (projectId: string) => timerApi.updateProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
    },
  });

  // Fonctions wrapper
  const startTimer = async (projectId: string) => {
    await startMutation.mutateAsync(projectId);
  };

  const stopTimer = async () => {
    await stopMutation.mutateAsync();
  };

  const pauseTimer = async () => {
    await pauseMutation.mutateAsync();
  };

  const resumeTimer = async () => {
    await resumeMutation.mutateAsync();
  };

  const updateTimerProject = async (projectId: string) => {
    await updateProjectMutation.mutateAsync(projectId);
  };

  return {
    activeTimer: activeTimer ?? undefined,
    isLoading,
    error,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateTimerProject,
    isRunning: activeTimer?.isRunning || false,
    isPaused: activeTimer?.isPaused || false,
  };
};

// Re-export ActiveTimer type for convenience
export type { ActiveTimer } from '@/lib/api';

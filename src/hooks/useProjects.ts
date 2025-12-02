import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Project } from '@/lib/api';
import { toast } from 'sonner';

export const useProjects = () => {
  const queryClient = useQueryClient();

  // Récupération de tous les projets
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Mutation pour ajouter un projet
  const addMutation = useMutation({
    mutationFn: ({ name, plannedHoursPerDay }: { name: string; plannedHoursPerDay?: number }) =>
      projectsApi.create(name, plannedHoursPerDay),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès');
      return newProject;
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la création du projet:', error);
      toast.error('Erreur lors de la création du projet');
    },
  });

  // Mutation pour mettre à jour un projet
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      projectsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour du projet:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Mutation pour supprimer un projet
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Projet supprimé');
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la suppression du projet:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  // Fonctions wrapper pour maintenir l'API existante
  const addProject = async (name: string, plannedHoursPerDay?: number) => {
    return addMutation.mutateAsync({ name, plannedHoursPerDay });
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteProject = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const getProject = async (id: string) => {
    return projectsApi.getById(id);
  };

  return {
    projects,
    isLoading,
    error,
    addProject,
    updateProject,
    deleteProject,
    getProject,
  };
};

// Re-export Project type for convenience
export type { Project } from '@/lib/api';

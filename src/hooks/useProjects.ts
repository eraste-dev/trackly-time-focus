import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Project, PROJECT_COLORS } from '@/lib/timeTracking';
import { toast } from 'sonner';

export const useProjects = () => {
  // Récupération en temps réel de tous les projets
  const projects = useLiveQuery(() => db.projects.toArray()) || [];

  // Ajouter un nouveau projet
  const addProject = async (name: string, plannedHoursPerDay?: number) => {
    try {
      const colorIndex = projects.length % PROJECT_COLORS.length;
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        color: PROJECT_COLORS[colorIndex],
        createdAt: new Date(),
        plannedHoursPerDay
      };

      await db.projects.add(newProject);
      toast.success('Projet créé avec succès');
      return newProject;
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      toast.error('Erreur lors de la création du projet');
      throw error;
    }
  };

  // Mettre à jour un projet
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await db.projects.update(id, updates);
      toast.success('Projet mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  // Supprimer un projet
  const deleteProject = async (id: string) => {
    try {
      // Supprimer toutes les entrées de temps associées
      await db.timeEntries.where('projectId').equals(id).delete();
      // Supprimer le projet
      await db.projects.delete(id);
      toast.success('Projet supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  // Obtenir un projet par ID
  const getProject = async (id: string) => {
    return await db.projects.get(id);
  };

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    getProject
  };
};

import { useState, useEffect } from 'react';
import { useActiveTimer } from './useActiveTimer';

const SELECTED_PROJECT_KEY = 'trackly-selected-project';

export const useSelectedProject = () => {
  const { activeTimer } = useActiveTimer();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(() => {
    // Initialiser depuis localStorage
    const stored = localStorage.getItem(SELECTED_PROJECT_KEY);
    return stored || undefined;
  });

  // Synchroniser avec le timer actif
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.projectId) {
      setSelectedProjectId(activeTimer.projectId);
      localStorage.setItem(SELECTED_PROJECT_KEY, activeTimer.projectId);
    }
  }, [activeTimer]);

  // Fonction pour changer le projet sélectionné
  const changeSelectedProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
  };

  return {
    selectedProjectId,
    setSelectedProjectId: changeSelectedProject
  };
};

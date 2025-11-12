import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SELECTED_PROJECT_KEY = 'trackly-selected-project';

interface SelectedProjectContextType {
  selectedProjectId: string | undefined;
  setSelectedProjectId: (id: string) => void;
}

const SelectedProjectContext = createContext<SelectedProjectContextType | undefined>(undefined);

export const SelectedProjectProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | undefined>(() => {
    // Initialiser depuis localStorage
    const stored = localStorage.getItem(SELECTED_PROJECT_KEY);
    return stored || undefined;
  });

  // Fonction pour changer le projet sélectionné
  const setSelectedProjectId = (projectId: string) => {
    setSelectedProjectIdState(projectId);
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
  };

  return (
    <SelectedProjectContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
      {children}
    </SelectedProjectContext.Provider>
  );
};

export const useSelectedProject = () => {
  const context = useContext(SelectedProjectContext);
  if (!context) {
    throw new Error('useSelectedProject must be used within SelectedProjectProvider');
  }
  return context;
};

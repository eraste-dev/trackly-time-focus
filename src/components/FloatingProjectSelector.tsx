import { useState } from 'react';
import { FolderOpen, Check, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useSelectedProject } from '@/contexts/SelectedProjectContext';
import { cn } from '@/lib/utils';

export const FloatingProjectSelector = () => {
  const { projects } = useProjects();
  const { isRunning } = useActiveTimer();
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject();
  const [open, setOpen] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Ne pas afficher si pas de projets
  if (projects.length === 0) return null;

  const handleSelectProject = (projectId: string) => {
    if (!isRunning) {
      setSelectedProjectId(projectId);
      setOpen(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          size="lg"
          disabled={isRunning}
          className={cn(
            "fixed z-40 shadow-lg transition-all duration-300",
            "left-1/2 -translate-x-1/2",
            // Position au-dessus du footer si timer actif, sinon en bas
            isRunning ? "bottom-20" : "bottom-6",
            "h-12 px-4 gap-3 rounded-full",
            "bg-primary hover:bg-primary/90",
            "border border-primary-foreground/10",
            isRunning && "opacity-50 cursor-not-allowed"
          )}
        >
          {selectedProject ? (
            <>
              <div
                className="w-3 h-3 rounded-full ring-2 ring-primary-foreground/20"
                style={{ backgroundColor: selectedProject.color }}
              />
              <span className="text-sm font-medium max-w-[150px] truncate">
                {selectedProject.name}
              </span>
            </>
          ) : (
            <>
              <FolderOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Sélectionner un projet</span>
            </>
          )}
          <ChevronUp className="h-4 w-4 opacity-60" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle>Sélectionner un projet</DrawerTitle>
          <DrawerDescription>
            {isRunning
              ? "Arrêtez le timer pour changer de projet"
              : "Choisissez le projet sur lequel vous travaillez"
            }
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            {projects.map((project) => {
              const isSelected = project.id === selectedProjectId;

              return (
                <DrawerClose key={project.id} asChild>
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    disabled={isRunning}
                    className={cn(
                      "flex items-center gap-3 w-full p-4 rounded-xl transition-all",
                      "text-left",
                      isSelected
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted/50 border-2 border-transparent hover:bg-muted",
                      isRunning && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex-shrink-0",
                        "ring-2 ring-offset-2 ring-offset-background",
                        isSelected ? "ring-primary" : "ring-transparent"
                      )}
                      style={{ backgroundColor: project.color }}
                    />
                    <span className={cn(
                      "flex-1 font-medium",
                      isSelected && "text-primary"
                    )}>
                      {project.name}
                    </span>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                </DrawerClose>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

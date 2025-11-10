import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PROJECT_COLORS, calculateTotalDuration, Project } from '@/lib/timeTracking';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { toast } from 'sonner';

const Projects = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { timeEntries } = useTimeEntries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [plannedHoursPerDay, setPlannedHoursPerDay] = useState<number | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Veuillez entrer un nom de projet');
      return;
    }

    try {
      await addProject(newProjectName, plannedHoursPerDay);
      setNewProjectName('');
      setSelectedColor(PROJECT_COLORS[0]);
      setPlannedHoursPerDay(undefined);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setNewProjectName(project.name);
    setSelectedColor(project.color);
    setPlannedHoursPerDay(project.plannedHoursPerDay);
    setIsEditDialogOpen(true);
  };

  const confirmEditProject = async () => {
    if (!projectToEdit || !newProjectName.trim()) {
      toast.error('Veuillez entrer un nom de projet');
      return;
    }

    try {
      await updateProject(projectToEdit.id, {
        name: newProjectName,
        color: selectedColor,
        plannedHoursPerDay
      });
      setProjectToEdit(null);
      setNewProjectName('');
      setSelectedColor(PROJECT_COLORS[0]);
      setPlannedHoursPerDay(undefined);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getProjectTotalTime = (projectId: string) => {
    const projectEntries = timeEntries.filter((e: any) => e.projectId === projectId);
    const total = calculateTotalDuration(projectEntries);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">Projets</h1>
              <p className="text-sm text-muted-foreground mt-1">Gérez vos projets</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau projet</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-light">Nouveau projet</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div>
                    <Label htmlFor="projectName" className="text-sm font-medium">Nom du projet</Label>
                    <Input
                      id="projectName"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Mon nouveau projet"
                      className="mt-2 h-11"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Couleur</Label>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            selectedColor === color
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPlannedHours" className="text-sm font-medium">Heures planifiées par jour (optionnel)</Label>
                    <Input
                      id="newPlannedHours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={plannedHoursPerDay ?? ''}
                      onChange={(e) => setPlannedHoursPerDay(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: 8"
                      className="mt-2 h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Permet de mieux suivre votre progression dans les rapports
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateProject}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Créer le projet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {projects.length === 0 ? (
          <Card className="p-12 sm:p-16 text-center border border-border shadow-none">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun projet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Créez votre premier projet pour commencer à suivre votre temps
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Créer un projet
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="border border-border shadow-none hover:border-primary/50 transition-colors">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-foreground truncate mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Total: {getProjectTotalTime(project.id)}
                      </p>
                      {project.plannedHoursPerDay && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Planifié: {project.plannedHoursPerDay}h/jour
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="flex-1 gap-2 text-primary hover:text-primary hover:bg-primary/10 h-9"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                      className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog d'édition de projet */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">Modifier le projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label htmlFor="editProjectName" className="text-sm font-medium">Nom du projet</Label>
                <Input
                  id="editProjectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mon projet"
                  className="mt-2 h-11"
                  onKeyDown={(e) => e.key === 'Enter' && confirmEditProject()}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Couleur</Label>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        selectedColor === color
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="plannedHours" className="text-sm font-medium">Heures planifiées par jour (optionnel)</Label>
                <Input
                  id="plannedHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={plannedHoursPerDay ?? ''}
                  onChange={(e) => setPlannedHoursPerDay(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Ex: 8"
                  className="mt-2 h-11"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Permet de mieux suivre votre progression dans les rapports
                </p>
              </div>
              <Button
                onClick={confirmEditProject}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation suppression */}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le projet{' '}
                <span className="font-semibold">{projectToDelete?.name}</span> ?
                Cette action supprimera également toutes les entrées de temps associées et ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteProject}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Projects;

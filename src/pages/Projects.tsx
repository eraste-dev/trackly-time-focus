import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Project, PROJECT_COLORS, calculateTotalDuration } from '@/lib/timeTracking';
import { toast } from 'sonner';
import { ProjectCard } from '@/components/ProjectCard';

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    const savedEntries = localStorage.getItem('timeEntries');
    
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })));
    }
    
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Veuillez entrer un nom de projet');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      color: selectedColor,
      createdAt: new Date()
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjectName('');
    setSelectedColor(PROJECT_COLORS[0]);
    setIsDialogOpen(false);
    toast.success('Projet créé');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Projet supprimé');
  };

  const getProjectTotalTime = (projectId: string) => {
    const projectEntries = timeEntries.filter((e: any) => e.projectId === projectId);
    const total = calculateTotalDuration(projectEntries);
    const hours = Math.floor(total / 3600);
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Projets</h1>
              <p className="text-muted-foreground">Gérez vos projets</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau projet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="projectName">Nom du projet</Label>
                    <Input
                      id="projectName"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Mon nouveau projet"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Couleur</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateProject} className="w-full">
                    Créer le projet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-card-foreground truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: {getProjectTotalTime(project.id)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteProject(project.id)}
                className="w-full gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun projet pour le moment</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer votre premier projet
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Projects;

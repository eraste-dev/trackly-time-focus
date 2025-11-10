import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer } from '@/components/Timer';
import { ProjectCard } from '@/components/ProjectCard';
import { StatsCard } from '@/components/StatsCard';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, FolderKanban, TrendingUp, Plus } from 'lucide-react';
import { Project, TimeEntry, formatDurationShort, calculateTotalDuration, getEntriesByPeriod, PROJECT_COLORS } from '@/lib/timeTracking';
import { toast } from 'sonner';

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStartTime, setCurrentStartTime] = useState<Date | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    const savedEntries = localStorage.getItem('timeEntries');
    
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })));
    } else {
      // Create sample projects
      const sampleProjects: Project[] = [
        { id: '1', name: 'Site Web Client A', color: PROJECT_COLORS[0], createdAt: new Date() },
        { id: '2', name: 'Application Mobile', color: PROJECT_COLORS[4], createdAt: new Date() },
        { id: '3', name: 'Marketing Digital', color: PROJECT_COLORS[3], createdAt: new Date() },
      ];
      setProjects(sampleProjects);
      localStorage.setItem('projects', JSON.stringify(sampleProjects));
    }
    
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries).map((e: any) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: e.endTime ? new Date(e.endTime) : undefined
      })));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (timeEntries.length > 0) {
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }
  }, [timeEntries]);

  const handleStartTimer = () => {
    if (!selectedProjectId) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }
    setCurrentStartTime(new Date());
    setIsRunning(true);
    toast.success('Timer démarré');
  };

  const handleStopTimer = () => {
    if (!currentStartTime || !selectedProjectId) return;
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentStartTime.getTime()) / 1000);
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      startTime: currentStartTime,
      endTime,
      duration
    };
    
    setTimeEntries(prev => [newEntry, ...prev]);
    setIsRunning(false);
    setCurrentStartTime(null);
    toast.success('Temps enregistré');
  };

  const todayEntries = getEntriesByPeriod(timeEntries, 'day');
  const weekEntries = getEntriesByPeriod(timeEntries, 'week');
  const monthEntries = getEntriesByPeriod(timeEntries, 'month');

  const getProjectTime = (projectId: string) => {
    const projectEntries = todayEntries.filter(e => e.projectId === projectId);
    return formatDurationShort(calculateTotalDuration(projectEntries));
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TimeTracker</h1>
          <p className="text-muted-foreground">Suivez votre temps de travail efficacement</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <StatsCard
            title="Aujourd'hui"
            value={formatDurationShort(calculateTotalDuration(todayEntries))}
            icon={Clock}
            trend="Total du jour"
          />
          <StatsCard
            title="Cette semaine"
            value={formatDurationShort(calculateTotalDuration(weekEntries))}
            icon={TrendingUp}
            trend="7 derniers jours"
          />
          <StatsCard
            title="Projets actifs"
            value={projects.length.toString()}
            icon={FolderKanban}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Projet en cours
              </label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center py-6">
              <Timer
                isRunning={isRunning}
                onStart={handleStartTimer}
                onStop={handleStopTimer}
                projectId={selectedProjectId}
              />
            </div>

            {selectedProject && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="font-medium text-sm">{selectedProject.name}</span>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Projets actifs</h2>
                <Link to="/projects">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau
                  </Button>
                </Link>
              </div>
              <div className="grid gap-3">
                {projects.slice(0, 4).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    totalTime={getProjectTime(project.id)}
                    isSelected={selectedProjectId === project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                  />
                ))}
              </div>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Aujourd'hui</h2>
              <div className="space-y-1">
                {todayEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucune entrée aujourd'hui
                  </p>
                ) : (
                  todayEntries.slice(0, 5).map((entry) => {
                    const project = projects.find(p => p.id === entry.projectId);
                    if (!project) return null;
                    return <TimeEntryRow key={entry.id} entry={entry} project={project} />;
                  })
                )}
              </div>
              {todayEntries.length > 5 && (
                <Link to="/reports">
                  <Button variant="ghost" className="w-full mt-4">
                    Voir tout
                  </Button>
                </Link>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

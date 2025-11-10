import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { 
  Project, 
  TimeEntry, 
  getEntriesByPeriod, 
  calculateTotalDuration, 
  formatDurationShort 
} from '@/lib/timeTracking';

const Reports = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

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
      setTimeEntries(JSON.parse(savedEntries).map((e: any) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: e.endTime ? new Date(e.endTime) : undefined
      })));
    }
  }, []);

  const filteredEntries = getEntriesByPeriod(timeEntries, period);
  const totalDuration = calculateTotalDuration(filteredEntries);

  const projectStats = projects.map(project => {
    const projectEntries = filteredEntries.filter(e => e.projectId === project.id);
    const duration = calculateTotalDuration(projectEntries);
    const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
    
    return {
      project,
      duration,
      percentage,
      entries: projectEntries.length
    };
  }).filter(stat => stat.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return "Aujourd'hui";
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
    }
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Rapports</h1>
          <p className="text-muted-foreground">Analysez votre temps de travail</p>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              {getPeriodLabel()}
            </h2>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Temps total</p>
              <p className="text-4xl font-bold text-foreground">
                {formatDurationShort(totalDuration)}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-card-foreground">Par projet</h3>
              {projectStats.map(({ project, duration, percentage }) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDurationShort(duration)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>
              ))}
              {projectStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune donnée pour cette période
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Historique
            </h2>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune entrée pour cette période
                </p>
              ) : (
                filteredEntries.map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  if (!project) return null;
                  return <TimeEntryRow key={entry.id} entry={entry} project={project} />;
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;

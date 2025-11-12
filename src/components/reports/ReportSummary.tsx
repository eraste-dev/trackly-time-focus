import { Card } from '@/components/ui/card';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project, TimeEntry } from '@/lib/timeTracking';

interface ProjectStat {
  project: Project;
  duration: number;
  percentage: number;
  entries: number;
  plannedProgress?: number;
  plannedTotal?: number;
}

interface ReportSummaryProps {
  periodLabel: string;
  totalDuration: number;
  projectStats: ProjectStat[];
  filteredEntries: TimeEntry[];
  projects: Project[];
}

export const ReportSummary = ({
  periodLabel,
  totalDuration,
  projectStats,
  filteredEntries,
  projects
}: ReportSummaryProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Statistiques globales */}
      <Card className="border border-border shadow-none">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-6">
            {periodLabel}
          </h2>

          {/* Temps total */}
          <div className="mb-8 pb-8 border-b border-border">
            <p className="text-sm text-muted-foreground mb-2">Temps total</p>
            <p className="text-4xl font-light text-foreground">
              {formatDurationShort(totalDuration)}
            </p>
          </div>

          {/* Par projet */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-foreground">Répartition par projet</h3>
            {projectStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Aucune donnée pour cette période
                </p>
              </div>
            ) : (
              projectStats.map(({ project, duration, percentage }) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium text-foreground">{project.name}</span>
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
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Historique */}
      <Card className="border border-border shadow-none">
        <div className="p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Historique
          </h2>
          <div className="space-y-0.5 max-h-[600px] overflow-y-auto -mx-6 px-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Aucune entrée pour cette période
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEntries.map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  if (!project) return null;
                  return <TimeEntryRow key={entry.id} entry={entry} project={project} />;
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

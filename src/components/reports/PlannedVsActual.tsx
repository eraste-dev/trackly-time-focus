import { Card } from '@/components/ui/card';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project } from '@/lib/timeTracking';

interface ProjectStat {
  project: Project;
  duration: number;
  plannedProgress: number;
  plannedTotal: number;
}

interface PlannedVsActualProps {
  projectStats: ProjectStat[];
}

export const PlannedVsActual = ({ projectStats }: PlannedVsActualProps) => {
  const statsWithPlanning = projectStats.filter(s => s.project.plannedHoursPerDay);

  if (statsWithPlanning.length === 0) {
    return null;
  }

  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          Planifié vs Réalisé
        </h2>
        <div className="space-y-6">
          {statsWithPlanning.map(({ project, duration, plannedProgress, plannedTotal }) => (
            <div key={project.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {project.name}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  plannedProgress >= 100 ? 'text-green-600' :
                  plannedProgress >= 75 ? 'text-primary' :
                  plannedProgress >= 50 ? 'text-orange-500' :
                  'text-red-500'
                }`}>
                  {Math.round(plannedProgress)}%
                </span>
              </div>

              {/* Barre de comparaison */}
              <div className="space-y-2">
                {/* Objectif planifié */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Planifié</span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gray-300 transition-all"
                      style={{ width: '100%' }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {formatDurationShort(plannedTotal)}
                    </span>
                  </div>
                </div>

                {/* Temps réalisé */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Réalisé</span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(plannedProgress, 100)}%`,
                        backgroundColor: project.color
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                      {formatDurationShort(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicateur de performance */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {plannedProgress >= 100
                    ? `+${formatDurationShort(duration - plannedTotal)} au-dessus de l'objectif`
                    : `${formatDurationShort(plannedTotal - duration)} restant`
                  }
                </span>
                {plannedProgress >= 100 && (
                  <span className="text-green-600 font-medium">✓ Objectif atteint</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

import { Card } from '@/components/ui/card';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project } from '@/lib/timeTracking';

interface ProjectStat {
  project: Project;
  duration: number;
  percentage: number;
  entries: number;
}

interface ProjectChartProps {
  projectStats: ProjectStat[];
  periodLabel: string;
  totalDuration: number;
}

export const ProjectChart = ({ projectStats, periodLabel }: ProjectChartProps) => {
  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          Temps par projet - {periodLabel}
        </h2>

        {/* Graphique */}
        <div className="relative bg-background rounded-lg p-4 border border-border">
          <div className="flex items-end justify-between gap-2 h-64 relative">
            {/* Grille horizontale de fond */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((value) => (
                <div key={value} className="flex items-center">
                  <span className="text-xs text-muted-foreground w-8 text-right pr-2">
                    {value}%
                  </span>
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>
              ))}
            </div>

            {/* Barres et lignes */}
            {projectStats.map((stat, index) => {
              const maxDuration = Math.max(...projectStats.map(s => s.duration));
              const heightPercent = maxDuration > 0 ? (stat.duration / maxDuration) * 100 : 0;

              // Calculer la position pour la ligne de tendance
              const nextStat = projectStats[index + 1];
              const currentPercent = stat.percentage;

              return (
                <div
                  key={stat.project.id}
                  className="flex-1 flex flex-col items-center justify-end relative group"
                  style={{ minWidth: '60px' }}
                >
                  {/* Valeur au-dessus de la barre */}
                  <div className="absolute -top-6 text-xs font-medium text-foreground">
                    {Math.round(currentPercent)}%
                  </div>

                  {/* Point de la ligne de tendance */}
                  <div
                    className="absolute w-2 h-2 rounded-full bg-primary border-2 border-white shadow-sm z-20"
                    style={{
                      bottom: `${heightPercent}%`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />

                  {/* Ligne de connexion au point suivant */}
                  {nextStat && (
                    <svg
                      className="absolute top-0 left-1/2 pointer-events-none z-10"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <line
                        x1="0"
                        y1={`${100 - heightPercent}%`}
                        x2="100%"
                        y2={`${100 - (maxDuration > 0 ? (nextStat.duration / maxDuration) * 100 : 0)}%`}
                        stroke={stat.project.color}
                        strokeWidth="2"
                        opacity="0.7"
                      />
                    </svg>
                  )}

                  {/* Barre */}
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 ease-out relative"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: stat.project.color,
                      opacity: 0.85,
                      minHeight: heightPercent > 0 ? '4px' : '0'
                    }}
                  >
                    {/* Tooltip au survol */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                      <div className="font-medium">{stat.project.name}</div>
                      <div className="text-gray-300">{formatDurationShort(stat.duration)}</div>
                    </div>
                  </div>

                  {/* Label du projet */}
                  <div className="mt-2 text-xs text-center text-muted-foreground truncate w-full px-1">
                    {stat.project.name.length > 8 ? stat.project.name.slice(0, 8) + '...' : stat.project.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 justify-center">
            {projectStats.map((stat) => (
              <div key={stat.project.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: stat.project.color }}
                />
                <span className="text-xs text-foreground">{stat.project.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatDurationShort(stat.duration)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

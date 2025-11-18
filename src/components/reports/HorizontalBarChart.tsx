import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project } from '@/lib/timeTracking';

interface ProjectStat {
  project: Project;
  duration: number;
  percentage: number;
  entries: number;
}

interface HorizontalBarChartProps {
  projectStats: ProjectStat[];
  periodLabel: string;
}

export const HorizontalBarChart = ({ projectStats, periodLabel }: HorizontalBarChartProps) => {
  // Prendre seulement le top 8 pour ne pas surcharger
  const topProjects = projectStats.slice(0, 8);

  const data = topProjects.map(stat => ({
    name: stat.project.name,
    duration: stat.duration / 3600, // Convertir en heures
    durationFormatted: formatDurationShort(stat.duration),
    color: stat.project.color,
    entries: stat.entries
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Temps total:</span>
              <span className="font-medium">{payload[0].payload.durationFormatted}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Sessions:</span>
              <span className="font-medium">{payload[0].payload.entries}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Moyenne:</span>
              <span className="font-medium">
                {formatDurationShort(payload[0].value * 3600 / payload[0].payload.entries)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (value: number) => {
    return `${value.toFixed(1)}h`;
  };

  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          Top Projets - {periodLabel}
        </h2>

        <ResponsiveContainer width="100%" height={Math.max(300, topProjects.length * 60)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={formatXAxis}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="duration"
              radius={[0, 8, 8, 0]}
              animationDuration={1000}
              label={{
                position: 'right',
                formatter: (value: number, entry: any) => {
                  // entry est le point de données complet, pas juste entry
                  if (!entry || !entry.payload) return '';
                  return entry.payload.durationFormatted || formatDurationShort(value * 3600);
                },
                style: { fontSize: '12px', fill: '#374151', fontWeight: 600 }
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {projectStats.length > 8 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Affichage des 8 projets principaux sur {projectStats.length} total
          </p>
        )}
      </div>
    </Card>
  );
};

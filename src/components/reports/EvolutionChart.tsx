import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDurationShort, calculateTotalDuration } from '@/lib/timeTracking';
import { Project, TimeEntry } from '@/lib/timeTracking';
import { useMemo } from 'react';

interface EvolutionChartProps {
  projects: Project[];
  timeEntries: TimeEntry[];
  period: 'day' | 'week' | 'month';
}

export const EvolutionChart = ({ projects, timeEntries, period }: EvolutionChartProps) => {
  const chartData = useMemo(() => {
    const daysCount = period === 'month' ? 30 : period === 'week' ? 7 : 1;
    const data: any[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayData: any = {
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        fullDate: date
      };

      // Calculer la durée pour chaque projet ce jour-là
      projects.forEach(project => {
        const dayEntries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entry.projectId === project.id &&
                 entryDate >= date &&
                 entryDate < nextDate;
        });

        const duration = calculateTotalDuration(dayEntries);
        dayData[project.id] = duration / 3600; // Convertir en heures pour l'affichage
      });

      data.push(dayData);
    }

    return data;
  }, [projects, timeEntries, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              if (entry.value === 0) return null;
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-medium">
                    {formatDurationShort(entry.value * 3600)}
                  </span>
                </div>
              );
            })}
          </div>
          {total > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>{formatDurationShort(total * 3600)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    return `${value}h`;
  };

  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          Évolution sur {period === 'month' ? '30 jours' : period === 'week' ? '7 jours' : 'aujourd\'hui'}
        </h2>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {projects.map((project) => (
                <linearGradient key={project.id} id={`color${project.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={project.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={project.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const project = projects.find(p => p.id === value);
                return project?.name || value;
              }}
            />

            {projects.map((project) => (
              <Area
                key={project.id}
                type="monotone"
                dataKey={project.id}
                name={project.id}
                stackId="1"
                stroke={project.color}
                strokeWidth={2}
                fill={`url(#color${project.id})`}
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

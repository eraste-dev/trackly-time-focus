import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project } from '@/lib/timeTracking';

interface ProjectStat {
  project: Project;
  duration: number;
  percentage: number;
  entries: number;
}

interface DoughnutChartProps {
  projectStats: ProjectStat[];
  totalDuration: number;
  periodLabel: string;
}

export const DoughnutChart = ({ projectStats, totalDuration, periodLabel }: DoughnutChartProps) => {
  const data = projectStats.map(stat => ({
    name: stat.project.name,
    value: stat.duration,
    color: stat.project.color,
    percentage: stat.percentage
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-gray-300">{formatDurationShort(payload[0].value)}</p>
          <p className="text-gray-400">{Math.round(payload[0].payload.percentage)}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Ne pas afficher les labels pour les petits segments

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${Math.round(percentage)}%`}
      </text>
    );
  };

  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">
          Répartition du temps - {periodLabel}
        </h2>

        <div className="relative">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                innerRadius={70}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre du doughnut avec le temps total */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-3xl font-bold text-foreground">
              {formatDurationShort(totalDuration)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total
            </div>
          </div>
        </div>

        {/* Légende personnalisée */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {projectStats.map((stat) => (
            <div key={stat.project.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: stat.project.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {stat.project.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDurationShort(stat.duration)} ({Math.round(stat.percentage)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

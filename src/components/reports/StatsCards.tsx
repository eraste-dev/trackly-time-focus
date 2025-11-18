import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Target, Activity, Calendar } from 'lucide-react';
import { formatDurationShort } from '@/lib/timeTracking';
import { TimeEntry } from '@/lib/timeTracking';

interface StatsCardsProps {
  totalDuration: number;
  projectsCount: number;
  averagePerDay: number;
  filteredEntries: TimeEntry[];
  period: 'day' | 'week' | 'month';
  previousPeriodDuration?: number;
}

export const StatsCards = ({
  totalDuration,
  projectsCount,
  averagePerDay,
  filteredEntries,
  period,
  previousPeriodDuration = 0
}: StatsCardsProps) => {

  const percentageChange = previousPeriodDuration > 0
    ? ((totalDuration - previousPeriodDuration) / previousPeriodDuration) * 100
    : 0;

  const isPositive = percentageChange > 0;
  const hasChange = Math.abs(percentageChange) > 0.1;

  const daysCount = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const sessionsCount = filteredEntries.length;
  const averageSessionDuration = sessionsCount > 0 ? totalDuration / sessionsCount : 0;

  const stats = [
    {
      title: 'Temps Total',
      value: formatDurationShort(totalDuration),
      icon: Clock,
      description: hasChange
        ? `${isPositive ? '+' : ''}${Math.round(percentageChange)}% vs période précédente`
        : 'Aucun changement',
      trend: hasChange ? (isPositive ? 'up' : 'down') : null,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Projets Actifs',
      value: projectsCount.toString(),
      icon: Target,
      description: `Sur ${period === 'day' ? 'aujourd\'hui' : period === 'week' ? 'cette semaine' : 'ce mois'}`,
      trend: null,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Moyenne / Jour',
      value: formatDurationShort(averagePerDay),
      icon: Calendar,
      description: `Sur ${daysCount} jour${daysCount > 1 ? 's' : ''}`,
      trend: null,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Sessions',
      value: sessionsCount.toString(),
      icon: Activity,
      description: `Moyenne: ${formatDurationShort(averageSessionDuration)}`,
      trend: null,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-border shadow-none hover:shadow-md transition-shadow">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(percentageChange))}%
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

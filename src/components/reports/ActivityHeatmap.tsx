import { Card } from '@/components/ui/card';
import { formatDurationShort, calculateTotalDuration } from '@/lib/timeTracking';
import { TimeEntry } from '@/lib/timeTracking';
import { useMemo } from 'react';

interface ActivityHeatmapProps {
  timeEntries: TimeEntry[];
}

export const ActivityHeatmap = ({ timeEntries }: ActivityHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const weeks: any[][] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculer les 12 dernières semaines (84 jours)
    const daysCount = 84;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysCount + 1);
    startDate.setHours(0, 0, 0, 0);

    // Trouver le lundi de la première semaine
    const firstMonday = new Date(startDate);
    const dayOfWeek = firstMonday.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstMonday.getDate() - daysToMonday);

    // Générer les données
    let currentWeek: any[] = [];
    const totalDays = 12 * 7; // 12 semaines

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      // Calculer la durée pour ce jour
      const dayEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= date && entryDate < nextDate;
      });

      const duration = calculateTotalDuration(dayEntries);
      const isFuture = date > today;

      currentWeek.push({
        date,
        duration,
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        isFuture
      });

      // Nouvelle semaine tous les 7 jours
      if ((i + 1) % 7 === 0) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return weeks;
  }, [timeEntries]);

  // Calculer l'intensité de couleur basée sur la durée
  const getIntensity = (duration: number) => {
    if (duration === 0) return 0;
    if (duration < 3600) return 1;        // < 1h
    if (duration < 7200) return 2;        // 1-2h
    if (duration < 14400) return 3;       // 2-4h
    return 4;                              // 4h+
  };

  const getColor = (intensity: number, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30';
    if (intensity === 0) return 'bg-muted';

    const colors = [
      'bg-muted',
      'bg-primary/30',
      'bg-primary/50',
      'bg-primary/70',
      'bg-primary'
    ];
    return colors[intensity];
  };

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <Card className="border border-border shadow-none">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-foreground">
            Activité sur les 12 dernières semaines
          </h2>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-max">
            {/* Jours de la semaine */}
            <div className="flex gap-1 mb-2">
              <div className="w-10"></div>
              {dayLabels.map((day, idx) => (
                <div key={idx} className="w-3 text-[10px] text-muted-foreground text-center">
                  {idx % 2 === 0 ? day[0] : ''}
                </div>
              ))}
            </div>

            {/* Semaines */}
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {/* Label de la semaine (première semaine de chaque mois) */}
                <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                  {weekIndex % 4 === 0 ? week[0].date.toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                </div>

                {/* Cellules de la semaine */}
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.duration);
                  const color = getColor(intensity, day.isFuture);

                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${color} transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1 cursor-pointer group relative`}
                      title={`${day.label}: ${formatDurationShort(day.duration)}`}
                    >
                      {/* Tooltip au survol */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        <div className="font-medium">{day.label}</div>
                        <div className="text-gray-300">{formatDurationShort(day.duration)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Moins</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/30"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/50"></div>
              <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
              <div className="w-3 h-3 rounded-sm bg-primary"></div>
            </div>
            <span>Plus</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

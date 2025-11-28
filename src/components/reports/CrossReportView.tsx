import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, TrendingUp, TrendingDown, Clock, Calendar, Award, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { formatDurationShort, calculateTotalDuration } from '@/lib/timeTracking';
import { Project, TimeEntry } from '@/lib/timeTracking';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export type CrossReportPeriodType = '1week' | '1month' | '12weeks' | '6months' | 'custom';

interface PeriodData {
  label: string;
  start: Date;
  end: Date;
  data: Record<string, number>;
}

interface CrossReportViewProps {
  projects: Project[];
  timeEntries: TimeEntry[];
}

export const CrossReportView = ({
  projects,
  timeEntries
}: CrossReportViewProps) => {
  const [periodType, setPeriodType] = useState<CrossReportPeriodType>('12weeks');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Générer les données selon la période sélectionnée
  const crossReportData = useMemo(() => {
    const now = new Date();
    const periods: PeriodData[] = [];

    if (periodType === '1week') {
      // 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        periods.push({
          label: format(date, 'EEE d', { locale: fr }),
          start: date,
          end: endDate,
          data: {}
        });
      }
    } else if (periodType === '1month') {
      // 4 dernières semaines
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));
        const day = weekEnd.getDay();
        const diff = weekEnd.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEndDate = new Date(weekStart);
        weekEndDate.setDate(weekStart.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);

        periods.push({
          label: `${format(weekStart, 'd', { locale: fr })}-${format(weekEndDate, 'd MMM', { locale: fr })}`,
          start: weekStart,
          end: weekEndDate,
          data: {}
        });
      }
    } else if (periodType === '12weeks') {
      // 12 dernières semaines
      for (let i = 11; i >= 0; i--) {
        const periodDate = new Date(now);
        periodDate.setDate(now.getDate() - (i * 7));
        const startOfWeek = new Date(periodDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        periods.push({
          label: `S${Math.ceil(startOfWeek.getDate() / 7)} ${format(startOfWeek, 'MMM', { locale: fr })}`,
          start: startOfWeek,
          end: endOfWeek,
          data: {}
        });
      }
    } else if (periodType === '6months') {
      // 6 derniers mois
      for (let i = 5; i >= 0; i--) {
        const periodDate = new Date(now);
        periodDate.setMonth(now.getMonth() - i);
        const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        periods.push({
          label: format(startOfMonth, 'MMM yy', { locale: fr }),
          start: startOfMonth,
          end: endOfMonth,
          data: {}
        });
      }
    } else if (periodType === 'custom' && customDateRange.from && customDateRange.to) {
      // Période personnalisée - diviser en jours ou semaines selon la durée
      const diffDays = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 14) {
        // Par jour
        for (let i = 0; i <= diffDays; i++) {
          const date = new Date(customDateRange.from);
          date.setDate(customDateRange.from.getDate() + i);
          date.setHours(0, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);

          if (date <= customDateRange.to) {
            periods.push({
              label: format(date, 'd MMM', { locale: fr }),
              start: date,
              end: endDate,
              data: {}
            });
          }
        }
      } else {
        // Par semaine
        let currentDate = new Date(customDateRange.from);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate <= customDateRange.to) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          periods.push({
            label: `${format(weekStart, 'd', { locale: fr })}-${format(weekEnd, 'd MMM', { locale: fr })}`,
            start: weekStart,
            end: weekEnd > customDateRange.to ? customDateRange.to : weekEnd,
            data: {}
          });

          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    }

    // Calculer les durées par projet et par période
    periods.forEach(period => {
      projects.forEach(project => {
        const entries = timeEntries.filter(entry => {
          const entryDate = new Date(entry.startTime);
          return entry.projectId === project.id &&
                 entryDate >= period.start &&
                 entryDate <= period.end;
        });
        period.data[project.id] = calculateTotalDuration(entries);
      });
    });

    return periods;
  }, [periodType, customDateRange, projects, timeEntries]);

  // Calculs des KPIs
  const kpis = useMemo(() => {
    const totalDuration = crossReportData.reduce((sum, period) =>
      sum + Object.values(period.data as Record<string, number>).reduce((s, v) => s + v, 0), 0
    );

    const periodsWithData = crossReportData.filter(p =>
      Object.values(p.data as Record<string, number>).reduce((s, v) => s + v, 0) > 0
    ).length;
    const averagePerPeriod = periodsWithData > 0 ? totalDuration / periodsWithData : 0;

    const midPoint = Math.floor(crossReportData.length / 2);
    const firstHalfTotal = crossReportData.slice(0, midPoint).reduce((sum, period) =>
      sum + Object.values(period.data as Record<string, number>).reduce((s, v) => s + v, 0), 0
    );
    const secondHalfTotal = crossReportData.slice(midPoint).reduce((sum, period) =>
      sum + Object.values(period.data as Record<string, number>).reduce((s, v) => s + v, 0), 0
    );
    const trend = firstHalfTotal > 0 ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 : 0;

    const projectTotals = projects.map(project => ({
      project,
      total: crossReportData.reduce((sum, period) => sum + (period.data[project.id] || 0), 0)
    })).sort((a, b) => b.total - a.total);
    const bestProject = projectTotals[0];

    return {
      totalDuration,
      averagePerPeriod,
      trend,
      bestProject,
      projectTotals
    };
  }, [crossReportData, projects]);

  // Données pour le graphique d'évolution
  const evolutionData = useMemo(() => {
    return crossReportData.map(period => ({
      label: period.label,
      total: Object.values(period.data as Record<string, number>).reduce((s, v) => s + v, 0)
    }));
  }, [crossReportData]);

  const maxTotal = Math.max(...evolutionData.map(d => d.total), 1);

  // Heatmap data (12 dernières semaines)
  const heatmapData = useMemo(() => {
    const weeks: { date: Date; duration: number }[][] = [];
    const now = new Date();

    for (let w = 11; w >= 0; w--) {
      const weekData: { date: Date; duration: number }[] = [];
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w * 7) - now.getDay() + 1);

      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        date.setHours(0, 0, 0, 0);

        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const duration = timeEntries
          .filter(entry => {
            const entryDate = new Date(entry.startTime);
            return entryDate >= date && entryDate <= dayEnd;
          })
          .reduce((sum, entry) => sum + entry.duration, 0);

        weekData.push({ date, duration });
      }
      weeks.push(weekData);
    }
    return weeks;
  }, [timeEntries]);

  const maxDayDuration = Math.max(...heatmapData.flat().map(d => d.duration), 1);

  const getHeatColor = (duration: number) => {
    if (duration === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = duration / maxDayDuration;
    if (intensity < 0.25) return 'bg-primary/20';
    if (intensity < 0.5) return 'bg-primary/40';
    if (intensity < 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  const exportCrossReportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const headers = ['Projet', ...crossReportData.map(p => p.label), 'Total'];
      const rows = projects.map(project => {
        const row = [project.name];
        let projectTotal = 0;
        crossReportData.forEach(period => {
          const duration = period.data[project.id] || 0;
          projectTotal += duration;
          row.push(formatDurationShort(duration));
        });
        row.push(formatDurationShort(projectTotal));
        return row;
      });

      const totalRow = ['TOTAL'];
      let grandTotal = 0;
      crossReportData.forEach(period => {
        const total = Object.values(period.data as Record<string, number>).reduce((sum, val) => sum + val, 0);
        grandTotal += total;
        totalRow.push(formatDurationShort(total));
      });
      totalRow.push(formatDurationShort(grandTotal));
      rows.push(totalRow);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');

      const fileName = `rapport_croise_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Export Excel réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case '1week': return 'jour';
      case '1month': return 'semaine';
      case '12weeks': return 'semaine';
      case '6months': return 'mois';
      case 'custom': return 'période';
    }
  };

  const daysLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const periodOptions = [
    { value: '1week', label: '1 semaine' },
    { value: '1month', label: '1 mois' },
    { value: '12weeks', label: '12 semaines' },
    { value: '6months', label: '6 mois' },
  ];

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {periodOptions.map(option => (
            <Button
              key={option.value}
              variant={periodType === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodType(option.value as CrossReportPeriodType)}
            >
              {option.label}
            </Button>
          ))}

          {/* Sélecteur de période personnalisée */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={periodType === 'custom' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  periodType === 'custom' && customDateRange.from && "min-w-[200px]"
                )}
              >
                <CalendarRange className="h-4 w-4 mr-2" />
                {periodType === 'custom' && customDateRange.from && customDateRange.to ? (
                  <span>
                    {format(customDateRange.from, 'd MMM', { locale: fr })} - {format(customDateRange.to, 'd MMM yy', { locale: fr })}
                  </span>
                ) : (
                  <span>Personnalisé</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={customDateRange.from}
                selected={{ from: customDateRange.from, to: customDateRange.to }}
                onSelect={(range) => {
                  setCustomDateRange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    setPeriodType('custom');
                  }
                }}
                numberOfMonths={2}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" size="sm" onClick={exportCrossReportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Exporter Excel
        </Button>
      </div>

      {/* Message si période custom non définie */}
      {periodType === 'custom' && (!customDateRange.from || !customDateRange.to) && (
        <Card className="border border-border shadow-none">
          <div className="p-8 text-center">
            <CalendarRange className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Sélectionnez une plage de dates pour afficher le rapport
            </p>
          </div>
        </Card>
      )}

      {/* Contenu du rapport */}
      {(periodType !== 'custom' || (customDateRange.from && customDateRange.to)) && (
        <>
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temps Total */}
            <Card className="border border-border shadow-none">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Temps Total</p>
                <p className="text-2xl font-bold text-foreground">{formatDurationShort(kpis.totalDuration)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur la période
                </p>
              </div>
            </Card>

            {/* Moyenne par période */}
            <Card className="border border-border shadow-none">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Moyenne / {getPeriodLabel()}</p>
                <p className="text-2xl font-bold text-foreground">{formatDurationShort(kpis.averagePerPeriod)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Par {getPeriodLabel()} active
                </p>
              </div>
            </Card>

            {/* Tendance */}
            <Card className="border border-border shadow-none">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${kpis.trend >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {kpis.trend >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Tendance</p>
                <p className={`text-2xl font-bold ${kpis.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.trend >= 0 ? '+' : ''}{Math.round(kpis.trend)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs période précédente
                </p>
              </div>
            </Card>

            {/* Meilleur projet */}
            <Card className="border border-border shadow-none">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Projet principal</p>
                {kpis.bestProject && kpis.bestProject.total > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: kpis.bestProject.project.color }}
                      />
                      <p className="text-lg font-bold text-foreground truncate">
                        {kpis.bestProject.project.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDurationShort(kpis.bestProject.total)}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground">-</p>
                )}
              </div>
            </Card>
          </div>

          {/* Graphiques en grille */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique d'évolution */}
            <Card className="border border-border shadow-none">
              <div className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Évolution du temps
                </h3>
                <div className="h-48 flex items-end gap-1">
                  {evolutionData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{
                          height: `${(data.total / maxTotal) * 100}%`,
                          minHeight: data.total > 0 ? '4px' : '0'
                        }}
                        title={`${data.label}: ${formatDurationShort(data.total)}`}
                      />
                      <span className="text-[10px] text-muted-foreground mt-2 rotate-[-45deg] origin-top-left whitespace-nowrap">
                        {data.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Heatmap */}
            <Card className="border border-border shadow-none">
              <div className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Activité quotidienne
                </h3>
                <div className="space-y-1">
                  {/* Labels des jours */}
                  <div className="flex gap-1 mb-2">
                    <div className="w-8" />
                    {daysLabels.map((day, i) => (
                      <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Grille */}
                  {heatmapData.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex gap-1">
                      <div className="w-8 text-[10px] text-muted-foreground flex items-center">
                        {weekIdx === 0 || weekIdx === 6 || weekIdx === 11 ? `S${12 - weekIdx}` : ''}
                      </div>
                      {week.map((day, dayIdx) => (
                        <div
                          key={dayIdx}
                          className={`flex-1 aspect-square rounded-sm ${getHeatColor(day.duration)} transition-colors`}
                          title={`${day.date.toLocaleDateString('fr-FR')}: ${formatDurationShort(day.duration)}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Légende */}
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
                  <span>Moins</span>
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <div className="w-3 h-3 rounded-sm bg-primary/20" />
                    <div className="w-3 h-3 rounded-sm bg-primary/40" />
                    <div className="w-3 h-3 rounded-sm bg-primary/60" />
                    <div className="w-3 h-3 rounded-sm bg-primary/90" />
                  </div>
                  <span>Plus</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Projets */}
          <Card className="border border-border shadow-none">
            <div className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">
                Répartition par projet
              </h3>
              <div className="space-y-3">
                {kpis.projectTotals.filter(p => p.total > 0).slice(0, 6).map(({ project, total }, idx) => {
                  const percentage = kpis.totalDuration > 0 ? (total / kpis.totalDuration) * 100 : 0;
                  return (
                    <div key={project.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{idx + 1}.</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="font-medium text-foreground">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">{Math.round(percentage)}%</span>
                          <span className="font-medium text-foreground w-20 text-right">
                            {formatDurationShort(total)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden ml-6">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {kpis.projectTotals.filter(p => p.total > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune donnée pour cette période
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Tableau détaillé (collapsible) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              Voir le tableau détaillé
            </summary>
            <Card className="border border-border shadow-none mt-4">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-foreground sticky left-0 bg-background">Projet</th>
                        {crossReportData.map((periodData, idx) => (
                          <th key={idx} className="text-right py-2 px-3 font-medium text-foreground whitespace-nowrap">
                            {periodData.label}
                          </th>
                        ))}
                        <th className="text-right py-2 px-3 font-medium text-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => {
                        const projectTotal = crossReportData.reduce((sum, period) =>
                          sum + (period.data[project.id] || 0), 0
                        );

                        if (projectTotal === 0) return null;

                        return (
                          <tr key={project.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-2 px-3 sticky left-0 bg-background">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="text-foreground truncate">{project.name}</span>
                              </div>
                            </td>
                            {crossReportData.map((periodData, idx) => (
                              <td key={idx} className="text-right py-2 px-3 text-muted-foreground whitespace-nowrap">
                                {periodData.data[project.id] > 0
                                  ? formatDurationShort(periodData.data[project.id])
                                  : '-'
                                }
                              </td>
                            ))}
                            <td className="text-right py-2 px-3 font-medium text-foreground whitespace-nowrap">
                              {formatDurationShort(projectTotal)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-border font-medium">
                        <td className="py-2 px-3 text-foreground sticky left-0 bg-background">TOTAL</td>
                        {crossReportData.map((periodData, idx) => {
                          const total = Object.values(periodData.data as Record<string, number>).reduce((sum, val) => sum + val, 0);
                          return (
                            <td key={idx} className="text-right py-2 px-3 text-foreground whitespace-nowrap">
                              {total > 0 ? formatDurationShort(total) : '-'}
                            </td>
                          );
                        })}
                        <td className="text-right py-2 px-3 text-foreground whitespace-nowrap">
                          {formatDurationShort(kpis.totalDuration)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </details>
        </>
      )}
    </div>
  );
};

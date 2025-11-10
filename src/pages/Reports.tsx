import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { calculateTotalDuration, formatDurationShort } from '@/lib/timeTracking';
import { useProjects } from '@/hooks/useProjects';
import { useTimeEntries } from '@/hooks/useTimeEntries';

const Reports = () => {
  const { projects } = useProjects();
  const { timeEntries } = useTimeEntries();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Filtrer les entrées selon la période et la date sélectionnée
  const filteredEntries = useMemo(() => {
    const startOfPeriod = new Date(selectedDate);
    let endOfPeriod = new Date(selectedDate);

    if (period === 'day') {
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = startOfPeriod.getDay();
      const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
      startOfPeriod.setDate(diff);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod.getFullYear(), startOfPeriod.getMonth() + 1, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startOfPeriod && entryDate <= endOfPeriod;
    });
  }, [timeEntries, period, selectedDate]);

  const totalDuration = calculateTotalDuration(filteredEntries);

  // Navigation de dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    if (period === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (period === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (period === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const projectStats = projects.map(project => {
    const projectEntries = filteredEntries.filter(e => e.projectId === project.id);
    const duration = calculateTotalDuration(projectEntries);
    const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;

    // Calculer le progrès par rapport aux heures planifiées
    let plannedProgress = 0;
    let plannedTotal = 0;
    if (project.plannedHoursPerDay) {
      const daysInPeriod = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      plannedTotal = project.plannedHoursPerDay * daysInPeriod * 3600; // en secondes
      plannedProgress = plannedTotal > 0 ? (duration / plannedTotal) * 100 : 0;
    }

    return {
      project,
      duration,
      percentage,
      entries: projectEntries.length,
      plannedProgress,
      plannedTotal
    };
  }).filter(stat => stat.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  const formatDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = {};

    if (period === 'day') {
      options.weekday = 'long';
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
    } else if (period === 'week') {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `Semaine du ${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('fr-FR', { month: 'long' })} au ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('fr-FR', { month: 'long' })}`;
    } else if (period === 'month') {
      options.month = 'long';
      options.year = 'numeric';
    }

    return selectedDate.toLocaleDateString('fr-FR', options);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const getPeriodLabel = () => {
    if (period === 'day') return 'Aujourd\'hui';
    if (period === 'week') return 'Cette semaine';
    return 'Ce mois';
  };

  // Générer les options de mois et années disponibles
  const getAvailableMonths = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months.map((name, index) => ({ value: index, label: name }));
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setSelectedDate(newDate);
    setDatePickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header global */}
      <Header />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* Filtres de période */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="day" className="data-[state=active]:bg-white">Jour</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-white">Semaine</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-white">Mois</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navigation de date */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium text-foreground min-w-[200px] text-center">
              {formatDateLabel()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Sélecteur de mois/année */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-foreground">Sélectionner une date</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Mois</label>
                      <Select
                        value={selectedDate.getMonth().toString()}
                        onValueChange={(value) => handleMonthYearChange(parseInt(value), selectedDate.getFullYear())}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableMonths().map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Année</label>
                      <Select
                        value={selectedDate.getFullYear().toString()}
                        onValueChange={(value) => handleMonthYearChange(selectedDate.getMonth(), parseInt(value))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {!isToday() && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-2"
              >
                Aujourd'hui
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Graphique avec barres verticales et lignes */}
          {projectStats.length > 0 && (
            <Card className="border border-border shadow-none">
              <div className="p-6">
                <h2 className="text-lg font-medium text-foreground mb-6">
                  Temps par projet - {getPeriodLabel()}
                </h2>

                {/* Graphique */}
                <div className="relative bg-white rounded-lg p-4 border border-border">
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
                      const currentPercent = (stat.duration / totalDuration) * 100;
                      const nextPercent = nextStat ? (nextStat.duration / totalDuration) * 100 : null;

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
                          {nextStat && nextPercent !== null && (
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
          )}

          {/* Statistiques globales */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-border shadow-none">
              <div className="p-6">
                <h2 className="text-lg font-medium text-foreground mb-6">
                  {getPeriodLabel()}
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

          {/* Graphiques de comparaison planifié vs réalisé */}
          {projectStats.some(s => s.project.plannedHoursPerDay) && (
            <Card className="border border-border shadow-none">
              <div className="p-6">
                <h2 className="text-lg font-medium text-foreground mb-6">
                  Planifié vs Réalisé
                </h2>
                <div className="space-y-6">
                  {projectStats
                    .filter(s => s.project.plannedHoursPerDay)
                    .map(({ project, duration, plannedProgress, plannedTotal }) => (
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
                    ))
                  }
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

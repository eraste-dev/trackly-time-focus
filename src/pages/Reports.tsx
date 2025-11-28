import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateTotalDuration, formatDurationShort } from "@/lib/timeTracking";
import { useProjects } from "@/hooks/useProjects";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useSelectedProject } from "@/contexts/SelectedProjectContext";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ProjectChart } from "@/components/reports/ProjectChart";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { CrossReportView } from "@/components/reports/CrossReportView";
import { PlannedVsActual } from "@/components/reports/PlannedVsActual";
import { StatsCards } from "@/components/reports/StatsCards";
import { EvolutionChart } from "@/components/reports/EvolutionChart";
import { HorizontalBarChart } from "@/components/reports/HorizontalBarChart";
import { ActivityHeatmap } from "@/components/reports/ActivityHeatmap";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const Reports = () => {
  const { projects } = useProjects();
  const { timeEntries } = useTimeEntries();
  const { selectedProjectId } = useSelectedProject();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCrossReport, setShowCrossReport] = useState(false);
  const [crossReportPeriod, setCrossReportPeriod] = useState<"week" | "month">("week");

  // Filtrer les entrées selon la période, la date et le projet sélectionné
  const filteredEntries = useMemo(() => {
    const startOfPeriod = new Date(selectedDate);
    let endOfPeriod = new Date(selectedDate);

    if (period === "day") {
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      const day = startOfPeriod.getDay();
      const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
      startOfPeriod.setDate(diff);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      endOfPeriod = new Date(startOfPeriod.getFullYear(), startOfPeriod.getMonth() + 1, 0);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    return timeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime);
      const isInPeriod = entryDate >= startOfPeriod && entryDate <= endOfPeriod;
      const isInProject = !selectedProjectId || entry.projectId === selectedProjectId;
      return isInPeriod && isInProject;
    });
  }, [timeEntries, period, selectedDate, selectedProjectId]);

  const totalDuration = calculateTotalDuration(filteredEntries);

  const projectStats = useMemo(() => {
    return projects
      .map((project) => {
        const projectEntries = filteredEntries.filter((e) => e.projectId === project.id);
        const duration = calculateTotalDuration(projectEntries);
        const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;

        // Calculer le progrès par rapport aux heures planifiées
        let plannedProgress = 0;
        let plannedTotal = 0;
        if (project.plannedHoursPerDay) {
          const daysInPeriod = period === "day" ? 1 : period === "week" ? 7 : 30;
          plannedTotal = project.plannedHoursPerDay * daysInPeriod * 3600; // en secondes
          plannedProgress = plannedTotal > 0 ? (duration / plannedTotal) * 100 : 0;
        }

        return {
          project,
          duration,
          percentage,
          entries: projectEntries.length,
          plannedProgress,
          plannedTotal,
        };
      })
      .filter((stat) => stat.duration > 0)
      .sort((a, b) => b.duration - a.duration);
  }, [projects, filteredEntries, totalDuration, period]);

  const formatDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = {};

    if (period === "day") {
      options.weekday = "long";
      options.day = "numeric";
      options.month = "long";
      options.year = "numeric";
    } else if (period === "week") {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `Semaine du ${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString("fr-FR", { month: "long" })} au ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString("fr-FR", { month: "long" })}`;
    } else if (period === "month") {
      options.month = "long";
      options.year = "numeric";
    }

    return selectedDate.toLocaleDateString("fr-FR", options);
  };

  const getPeriodLabel = () => {
    if (period === "day") return "Aujourd'hui";
    if (period === "week") return "Cette semaine";
    return "Ce mois";
  };

  // Calculer la moyenne par jour
  const averagePerDay = useMemo(() => {
    const daysCount = period === "day" ? 1 : period === "week" ? 7 : 30;
    return totalDuration / daysCount;
  }, [totalDuration, period]);

  // Générer les données pour le rapport croisé
  const crossReportData = useMemo(() => {
    const now = new Date();
    const periodsCount = crossReportPeriod === "week" ? 12 : 6; // 12 semaines ou 6 mois
    const periods: any[] = [];

    for (let i = periodsCount - 1; i >= 0; i--) {
      const periodDate = new Date(now);

      if (crossReportPeriod === "week") {
        periodDate.setDate(now.getDate() - i * 7);
        const startOfWeek = new Date(periodDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const label = `S${Math.ceil(startOfWeek.getDate() / 7)} ${startOfWeek.toLocaleDateString("fr-FR", { month: "short" })}`;

        periods.push({
          label,
          start: startOfWeek,
          end: endOfWeek,
          data: {},
        });
      } else {
        periodDate.setMonth(now.getMonth() - i);
        const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const label = startOfMonth.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

        periods.push({
          label,
          start: startOfMonth,
          end: endOfMonth,
          data: {},
        });
      }
    }

    // Calculer les durées par projet et par période
    periods.forEach((period) => {
      projects.forEach((project) => {
        const entries = timeEntries.filter((entry) => {
          const entryDate = new Date(entry.startTime);
          return entry.projectId === project.id && entryDate >= period.start && entryDate <= period.end;
        });
        period.data[project.id] = calculateTotalDuration(entries);
      });
    });

    return periods;
  }, [projects, timeEntries, crossReportPeriod]);

  // Fonction pour exporter les données en Excel
  const exportToExcel = () => {
    try {
      // Créer le classeur
      const wb = XLSX.utils.book_new();

      // Feuille 1: Résumé par projet
      const summaryData = projectStats.map((stat) => ({
        Projet: stat.project.name,
        "Temps total": formatDurationShort(stat.duration),
        "Nombre d'entrées": stat.entries,
        Pourcentage: `${Math.round(stat.percentage)}%`,
      }));
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "Résumé");

      // Feuille 2: Détail des entrées
      const detailData = filteredEntries.map((entry) => {
        const project = projects.find((p) => p.id === entry.projectId);
        return {
          Date: new Date(entry.startTime).toLocaleDateString("fr-FR"),
          "Heure début": new Date(entry.startTime).toLocaleTimeString("fr-FR"),
          "Heure fin": entry.endTime ? new Date(entry.endTime).toLocaleTimeString("fr-FR") : "-",
          Projet: project?.name || "Inconnu",
          Durée: formatDurationShort(entry.duration),
          Description: entry.description || "-",
        };
      });
      const ws2 = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, ws2, "Détails");

      // Générer le nom du fichier
      const fileName = `rapport_${formatDateLabel().replace(/\s+/g, "_")}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);
      toast.success("Export Excel réussi !");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export Excel");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header global */}
      <Header />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* En-tête avec boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Rapports</h1>
          <div className="flex gap-2">
            <Button variant={showCrossReport ? "default" : "outline"} size="sm" onClick={() => setShowCrossReport(!showCrossReport)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Rapport croisé
            </Button>
            {!showCrossReport && (
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
            )}
          </div>
        </div>

        {/* Contenu conditionnel : rapport normal ou rapport croisé */}
        {showCrossReport ? (
          <CrossReportView crossReportData={crossReportData} crossReportPeriod={crossReportPeriod} setCrossReportPeriod={setCrossReportPeriod} projects={projects} />
        ) : (
          <>
            {/* Filtres de période */}
            <div className="mb-8">
              <ReportFilters period={period} setPeriod={setPeriod} selectedDate={selectedDate} setSelectedDate={setSelectedDate} formatDateLabel={formatDateLabel} />
            </div>

            <div className="space-y-6">
              {/* Stats Cards avec KPIs */}
              <StatsCards totalDuration={totalDuration} projectsCount={projectStats.length} averagePerDay={averagePerDay} filteredEntries={filteredEntries} period={period} />

              {/* Layout en grille pour Heatmap et Barres Horizontales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Heatmap Calendar - Activité sur 12 semaines */}
                <ActivityHeatmap timeEntries={timeEntries} />

                {/* Barres Horizontales - Top Projets */}
                {projectStats.length > 0 && <HorizontalBarChart projectStats={projectStats} periodLabel={getPeriodLabel()} />}
              </div>

              {/* Area Chart - Évolution temporelle */}
              {period !== "day" && <EvolutionChart projects={projects} timeEntries={timeEntries} period={period} />}

              {/* Graphiques de comparaison planifié vs réalisé */}
              <PlannedVsActual projectStats={projectStats} />

              {/* Ancien graphique en mode replié (pour référence) */}
              {false && projectStats.length > 0 && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-4">Afficher l'ancien graphique (legacy)</summary>
                  <ProjectChart projectStats={projectStats} periodLabel={getPeriodLabel()} totalDuration={totalDuration} />
                </details>
              )}

              {/* Statistiques détaillées */}
              <ReportSummary periodLabel={getPeriodLabel()} totalDuration={totalDuration} projectStats={projectStats} filteredEntries={filteredEntries} projects={projects} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;

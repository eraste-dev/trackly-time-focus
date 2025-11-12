import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDurationShort } from '@/lib/timeTracking';
import { Project } from '@/lib/timeTracking';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface PeriodData {
  label: string;
  start: Date;
  end: Date;
  data: Record<string, number>;
}

interface CrossReportViewProps {
  crossReportData: PeriodData[];
  crossReportPeriod: 'week' | 'month';
  setCrossReportPeriod: (period: 'week' | 'month') => void;
  projects: Project[];
}

export const CrossReportView = ({
  crossReportData,
  crossReportPeriod,
  setCrossReportPeriod,
  projects
}: CrossReportViewProps) => {

  const exportCrossReportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Préparer les données
      const headers = ['Projet', ...crossReportData.map(p => p.label)];
      const rows = projects.map(project => {
        const row = [project.name];
        crossReportData.forEach(period => {
          const duration = period.data[project.id] || 0;
          row.push(formatDurationShort(duration));
        });
        return row;
      });

      // Ajouter une ligne de total
      const totalRow = ['TOTAL'];
      crossReportData.forEach(period => {
        const total = Object.values(period.data as Record<string, number>).reduce((sum, val) => sum + val, 0);
        totalRow.push(formatDurationShort(total));
      });
      rows.push(totalRow);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, `Rapport ${crossReportPeriod === 'week' ? 'hebdo' : 'mensuel'}`);

      const fileName = `rapport_croise_${crossReportPeriod === 'week' ? 'hebdo' : 'mensuel'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Export Excel réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-none">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-foreground">
              Rapport croisé - {crossReportPeriod === 'week' ? '12 dernières semaines' : '6 derniers mois'}
            </h2>
            <div className="flex gap-2">
              <Tabs value={crossReportPeriod} onValueChange={(v) => setCrossReportPeriod(v as any)}>
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="week" className="data-[state=active]:bg-white">Semaines</TabsTrigger>
                  <TabsTrigger value="month" className="data-[state=active]:bg-white">Mois</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" onClick={exportCrossReportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
            </div>
          </div>

          {/* Graphique en barres empilées */}
          <div className="relative bg-white rounded-lg p-4 border border-border mb-6">
            <div className="flex items-end justify-between gap-2 h-80">
              {crossReportData.map((periodData, idx) => {
                const totalDuration = Object.values(periodData.data as Record<string, number>).reduce((sum, val) => sum + val, 0);
                const maxTotal = Math.max(...crossReportData.map(p =>
                  Object.values(p.data as Record<string, number>).reduce((sum, val) => sum + val, 0)
                ));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
                    {/* Valeur totale au-dessus */}
                    <div className="text-xs font-medium text-foreground mb-1 min-h-[20px]">
                      {totalDuration > 0 ? formatDurationShort(totalDuration) : ''}
                    </div>

                    {/* Barre empilée */}
                    <div
                      className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden"
                      style={{
                        height: maxTotal > 0 ? `${(totalDuration / maxTotal) * 100}%` : '0%',
                        minHeight: totalDuration > 0 ? '8px' : '0'
                      }}
                    >
                      {projects.map(project => {
                        const duration = periodData.data[project.id] || 0;
                        const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;

                        if (duration === 0) return null;

                        return (
                          <div
                            key={project.id}
                            className="relative"
                            style={{
                              height: `${percentage}%`,
                              backgroundColor: project.color,
                              minHeight: '4px'
                            }}
                            title={`${project.name}: ${formatDurationShort(duration)}`}
                          />
                        );
                      })}
                    </div>

                    {/* Label de période */}
                    <div className="mt-2 text-xs text-center text-muted-foreground">
                      {periodData.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 justify-center">
              {projects.map(project => (
                <div key={project.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-xs text-foreground">{project.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau des données */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-foreground">Projet</th>
                  {crossReportData.map((periodData, idx) => (
                    <th key={idx} className="text-right py-2 px-3 font-medium text-foreground">
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
                    <tr key={project.id} className="border-b border-border/50">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-foreground">{project.name}</span>
                        </div>
                      </td>
                      {crossReportData.map((periodData, idx) => (
                        <td key={idx} className="text-right py-2 px-3 text-muted-foreground">
                          {periodData.data[project.id] > 0
                            ? formatDurationShort(periodData.data[project.id])
                            : '-'
                          }
                        </td>
                      ))}
                      <td className="text-right py-2 px-3 font-medium text-foreground">
                        {formatDurationShort(projectTotal)}
                      </td>
                    </tr>
                  );
                })}
                {/* Ligne de total */}
                <tr className="border-t-2 border-border font-medium">
                  <td className="py-2 px-3 text-foreground">TOTAL</td>
                  {crossReportData.map((periodData, idx) => {
                    const total = Object.values(periodData.data as Record<string, number>).reduce((sum, val) => sum + val, 0);
                    return (
                      <td key={idx} className="text-right py-2 px-3 text-foreground">
                        {total > 0 ? formatDurationShort(total) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-right py-2 px-3 text-foreground">
                    {formatDurationShort(
                      crossReportData.reduce((sum, period) =>
                        sum + Object.values(period.data as Record<string, number>).reduce((s, v) => s + v, 0), 0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

import { useState } from 'react';
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { EditTimeEntryDialog } from '@/components/EditTimeEntryDialog';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Clock, Trash2, Search, Shield, Lock } from 'lucide-react';
import { TimeEntry, formatDuration, calculateTotalDuration } from '@/lib/timeTracking';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

export default function Sessions() {
  const { timeEntries, updateTimeEntry, deleteTimeEntry } = useTimeEntries();
  const { projects } = useProjects();
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les entrées selon la période sélectionnée
  const getFilteredEntries = () => {
    let startDate: Date;
    let endDate: Date;

    switch (viewMode) {
      case 'day':
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
        break;
      case 'week':
        startDate = startOfWeek(selectedDate, { locale: fr });
        endDate = endOfWeek(selectedDate, { locale: fr });
        break;
      case 'month':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
    }

    let filtered = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Filtrer par recherche (nom de projet ou description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const project = projects.find(p => p.id === entry.projectId);
        const projectName = project?.name.toLowerCase() || '';
        const description = entry.description?.toLowerCase() || '';
        return projectName.includes(query) || description.includes(query);
      });
    }

    return filtered;
  };

  // Navigation entre les dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;

    switch (viewMode) {
      case 'day':
        setSelectedDate(addDays(selectedDate, amount));
        break;
      case 'week':
        setSelectedDate(addDays(selectedDate, amount * 7));
        break;
      case 'month':
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, 1));
        break;
    }
  };

  // Handlers
  const handleEditEntry = (entry: TimeEntry) => {
    if (!isAdmin) {
      toast.error('Seuls les administrateurs peuvent modifier les sessions');
      return;
    }
    setEditingEntry(entry);
  };

  const handleSaveEntry = async (updatedEntry: TimeEntry) => {
    await updateTimeEntry(updatedEntry.id, updatedEntry);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entry: TimeEntry) => {
    if (!isAdmin) {
      toast.error('Seuls les administrateurs peuvent supprimer les sessions');
      return;
    }
    setDeletingEntry(entry);
  };

  const confirmDelete = async () => {
    if (deletingEntry) {
      await deleteTimeEntry(deletingEntry.id);
      setDeletingEntry(null);
      toast.success('Session supprimée');
    }
  };

  const filteredEntries = getFilteredEntries();
  const totalDuration = calculateTotalDuration(filteredEntries);

  // Grouper par jour
  const entriesByDay = filteredEntries.reduce((acc, entry) => {
    const dayKey = format(new Date(entry.startTime), 'yyyy-MM-dd');
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  // Formater le titre de la période
  const getPeriodTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });
      case 'week':
        const weekStart = startOfWeek(selectedDate, { locale: fr });
        const weekEnd = endOfWeek(selectedDate, { locale: fr });
        return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy', { locale: fr });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Badge admin */}
        {!isAdmin && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-sm">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Modification réservée aux administrateurs</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Vous pouvez consulter toutes les sessions mais seuls les admins peuvent les modifier ou supprimer</p>
            </div>
          </div>
        )}

        {/* Barre de contrôle minimaliste */}
        <div className="mb-6 space-y-3">
          {/* Navigation et période */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('prev')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h1 className="text-lg font-semibold capitalize min-w-[260px] text-center">
                {getPeriodTitle()}
              </h1>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('next')}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Mode de vue */}
              {['day', 'week', 'month'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as ViewMode)}
                  className="h-8"
                >
                  {mode === 'day' && 'Jour'}
                  {mode === 'week' && 'Semaine'}
                  {mode === 'month' && 'Mois'}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className="h-8 ml-2"
              >
                Aujourd'hui
              </Button>
            </div>
          </div>

          {/* Recherche et stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{filteredEntries.length} sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des sessions */}
        {Object.keys(entriesByDay).length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Aucune session trouvée' : 'Aucune session pour cette période'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(entriesByDay)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([dayKey, entries]) => {
                const dayDate = new Date(dayKey);
                const dayTotal = calculateTotalDuration(entries);

                return (
                  <div key={dayKey} className="space-y-2">
                    {/* En-tête du jour */}
                    <div className="flex items-center justify-between px-1 pb-2 border-b">
                      <h3 className="text-sm font-medium capitalize text-muted-foreground">
                        {format(dayDate, 'EEEE d MMMM', { locale: fr })}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{entries.length} sessions</span>
                        <span className="font-semibold">{formatDuration(dayTotal)}</span>
                      </div>
                    </div>

                    {/* Sessions du jour */}
                    <div className="space-y-1">
                      {entries
                        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                        .map(entry => {
                          const project = projects.find(p => p.id === entry.projectId);
                          if (!project) return null;

                          return (
                            <TimeEntryRow
                              key={entry.id}
                              entry={entry}
                              project={project}
                              onEdit={isAdmin ? handleEditEntry : undefined}
                              onDelete={isAdmin ? handleDeleteEntry : undefined}
                            />
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Dialog d'édition */}
      <EditTimeEntryDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSave={handleSaveEntry}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Supprimer cette session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La session et son temps enregistré seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

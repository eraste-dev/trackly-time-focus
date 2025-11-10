import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEntry, Project, formatDurationShort } from '@/lib/timeTracking';

interface TimeEntryRowProps {
  entry: TimeEntry;
  project: Project;
}

export const TimeEntryRow = ({ entry, project }: TimeEntryRowProps) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-card-foreground truncate">
            {project.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(entry.startTime), 'HH:mm', { locale: fr })} - 
            {entry.endTime ? format(new Date(entry.endTime), 'HH:mm', { locale: fr }) : 'En cours'}
          </p>
        </div>
      </div>
      <div className="text-sm font-semibold text-card-foreground">
        {formatDurationShort(entry.duration)}
      </div>
    </div>
  );
};

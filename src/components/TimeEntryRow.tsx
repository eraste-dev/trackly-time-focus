import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEntry, Project, formatDurationShort } from '@/lib/timeTracking';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

interface TimeEntryRowProps {
  entry: TimeEntry;
  project: Project;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entry: TimeEntry) => void;
}

export const TimeEntryRow = ({ entry, project, onEdit, onDelete }: TimeEntryRowProps) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-card-foreground truncate">
            {project.name}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.startTime), 'HH:mm', { locale: fr })} -
              {entry.endTime ? format(new Date(entry.endTime), 'HH:mm', { locale: fr }) : 'En cours'}
            </p>
            {entry.description && (
              <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                • {entry.description}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-card-foreground min-w-[60px] text-right">
          {formatDurationShort(entry.duration)}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(entry)}
              title="Modifier cette session"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              onClick={() => onDelete(entry)}
              title="Supprimer cette session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

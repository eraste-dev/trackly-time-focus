import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/timeTracking';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  totalTime?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const ProjectCard = ({ project, totalTime, isSelected, onClick }: ProjectCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md border-2",
        isSelected ? "border-primary shadow-md" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">
            {project.name}
          </h3>
          {totalTime && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalTime}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

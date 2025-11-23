import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry, formatDuration } from '@/lib/timeTracking';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditTimeEntryDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedEntry: TimeEntry) => void;
}

export const EditTimeEntryDialog = ({ entry, open, onOpenChange, onSave }: EditTimeEntryDialogProps) => {
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  // Initialiser les valeurs quand l'entrée change
  useEffect(() => {
    if (entry) {
      setProjectId(entry.projectId);
      setDescription(entry.description || '');

      const start = new Date(entry.startTime);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));

      if (entry.endTime) {
        const end = new Date(entry.endTime);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      } else {
        // Si pas de fin, utiliser maintenant
        const now = new Date();
        setEndDate(now.toISOString().split('T')[0]);
        setEndTime(now.toTimeString().slice(0, 5));
      }
    }
  }, [entry]);

  const calculateDuration = () => {
    if (!startDate || !startTime || !endDate || !endTime) return 0;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    return Math.floor((end.getTime() - start.getTime()) / 1000);
  };

  const handleSave = () => {
    if (!entry) return;

    // Validation
    if (!projectId) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }

    if (!startDate || !startTime) {
      toast.error('Veuillez entrer une date et heure de début');
      return;
    }

    if (!endDate || !endTime) {
      toast.error('Veuillez entrer une date et heure de fin');
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    // Vérifier que la fin est après le début
    if (end <= start) {
      toast.error('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    // Vérifier que les dates ne sont pas dans le futur
    const now = new Date();
    if (end > now) {
      toast.error('L\'heure de fin ne peut pas être dans le futur');
      return;
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    const updatedEntry: TimeEntry = {
      ...entry,
      projectId,
      startTime: start,
      endTime: end,
      duration,
      description: description.trim() || undefined
    };

    onSave(updatedEntry);
    onOpenChange(false);
    toast.success('Session mise à jour avec succès');
  };

  const currentDuration = calculateDuration();
  const project = projects.find(p => p.id === projectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Modifier la session
          </DialogTitle>
          <DialogDescription>
            Corrigez les informations de cette session de temps
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Projet */}
          <div className="grid gap-2">
            <Label htmlFor="project">Projet</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date et heure de début */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="start-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date de début
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Heure de début
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Date et heure de fin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="end-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date de fin
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Heure de fin
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Durée calculée */}
          {currentDuration > 0 && (
            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durée calculée:</span>
                <span className="text-lg font-semibold text-foreground">
                  {formatDuration(currentDuration)}
                </span>
              </div>
              {project && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-muted-foreground">{project.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ajouter une note sur cette session..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

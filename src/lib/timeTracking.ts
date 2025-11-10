export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  plannedHoursPerDay?: number; // Heures planifiées par jour
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
}

export interface ActiveTimer {
  id: string; // Toujours 'active' pour avoir un seul enregistrement
  projectId: string;
  startTime: Date;
  isRunning: boolean;
  isPaused?: boolean;
  pausedAt?: Date;
  totalPausedDuration?: number; // Durée totale des pauses en secondes
}

export const PROJECT_COLORS = [
  '#8ecae6', // couleur principale - bleu clair
  '#219ebc', // bleu océan
  '#023047', // bleu foncé
  '#ffb703', // jaune/ambre
  '#fb8500', // orange
  '#06b6d4', // cyan
  '#10b981', // vert
  '#6b7280', // gris
];

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Toujours afficher au format HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Toujours afficher au format HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateTotalDuration = (entries: TimeEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.duration, 0);
};

export const getEntriesByPeriod = (
  entries: TimeEntry[],
  period: 'day' | 'week' | 'month'
): TimeEntry[] => {
  const now = new Date();
  const startOfPeriod = new Date(now);
  
  if (period === 'day') {
    startOfPeriod.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = startOfPeriod.getDay();
    const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
    startOfPeriod.setDate(diff);
    startOfPeriod.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startOfPeriod.setDate(1);
    startOfPeriod.setHours(0, 0, 0, 0);
  }
  
  return entries.filter(entry => new Date(entry.startTime) >= startOfPeriod);
};

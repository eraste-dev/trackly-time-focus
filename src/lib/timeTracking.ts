export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
}

export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#ef4444', // red
  '#f97316', // orange
];

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationShort = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

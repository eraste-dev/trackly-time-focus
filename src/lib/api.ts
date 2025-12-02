const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Project types
export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  plannedHoursPerDay?: number | null;
}

// Time entry types
export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date | null;
  duration: number;
  description?: string | null;
  project?: Project;
}

// Active timer types
export interface ActiveTimer {
  id: string;
  projectId: string;
  startTime: Date;
  isRunning: boolean;
  isPaused?: boolean;
  pausedAt?: Date | null;
  totalPausedDuration?: number;
  project?: Project;
}

// User types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'standard';
  createdAt: Date;
  createdBy?: string | null;
}

// Helper to convert date strings to Date objects
function parseDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
}

function parseProject(project: any): Project {
  return {
    ...project,
    createdAt: parseDate(project.createdAt)!,
  };
}

function parseTimeEntry(entry: any): TimeEntry {
  return {
    ...entry,
    startTime: parseDate(entry.startTime)!,
    endTime: parseDate(entry.endTime),
    project: entry.project ? parseProject(entry.project) : undefined,
  };
}

function parseActiveTimer(timer: any): ActiveTimer | null {
  if (!timer) return null;
  return {
    ...timer,
    startTime: parseDate(timer.startTime)!,
    pausedAt: parseDate(timer.pausedAt),
    project: timer.project ? parseProject(timer.project) : undefined,
  };
}

function parseUser(user: any): User {
  return {
    ...user,
    createdAt: parseDate(user.createdAt)!,
  };
}

// ============ Projects API ============

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const data = await fetchApi<any[]>('/projects');
    return data.map(parseProject);
  },

  getById: async (id: string): Promise<Project> => {
    const data = await fetchApi<any>(`/projects/${id}`);
    return parseProject(data);
  },

  create: async (name: string, plannedHoursPerDay?: number): Promise<Project> => {
    const data = await fetchApi<any>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, plannedHoursPerDay }),
    });
    return parseProject(data);
  },

  update: async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> => {
    const data = await fetchApi<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return parseProject(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/projects/${id}`, { method: 'DELETE' });
  },
};

// ============ Time Entries API ============

export const timeEntriesApi = {
  getAll: async (filters?: { projectId?: string; period?: 'day' | 'week' | 'month' }): Promise<TimeEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.period) params.set('period', filters.period);

    const query = params.toString() ? `?${params}` : '';
    const data = await fetchApi<any[]>(`/time-entries${query}`);
    return data.map(parseTimeEntry);
  },

  getById: async (id: string): Promise<TimeEntry> => {
    const data = await fetchApi<any>(`/time-entries/${id}`);
    return parseTimeEntry(data);
  },

  create: async (entry: Omit<TimeEntry, 'id' | 'project'>): Promise<TimeEntry> => {
    const data = await fetchApi<any>('/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        ...entry,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime?.toISOString(),
      }),
    });
    return parseTimeEntry(data);
  },

  update: async (id: string, updates: Partial<Omit<TimeEntry, 'id' | 'project'>>): Promise<TimeEntry> => {
    const body: any = { ...updates };
    if (updates.startTime) body.startTime = updates.startTime.toISOString();
    if (updates.endTime) body.endTime = updates.endTime.toISOString();

    const data = await fetchApi<any>(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return parseTimeEntry(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/time-entries/${id}`, { method: 'DELETE' });
  },
};

// ============ Active Timer API ============

export const timerApi = {
  get: async (): Promise<ActiveTimer | null> => {
    const data = await fetchApi<any>('/timer');
    return parseActiveTimer(data);
  },

  start: async (projectId: string): Promise<ActiveTimer> => {
    const data = await fetchApi<any>('/timer/start', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
    return parseActiveTimer(data)!;
  },

  stop: async (): Promise<TimeEntry> => {
    const data = await fetchApi<any>('/timer/stop', { method: 'POST' });
    return parseTimeEntry(data);
  },

  pause: async (): Promise<ActiveTimer> => {
    const data = await fetchApi<any>('/timer/pause', { method: 'POST' });
    return parseActiveTimer(data)!;
  },

  resume: async (): Promise<ActiveTimer> => {
    const data = await fetchApi<any>('/timer/resume', { method: 'POST' });
    return parseActiveTimer(data)!;
  },

  updateProject: async (projectId: string): Promise<ActiveTimer> => {
    const data = await fetchApi<any>('/timer/project', {
      method: 'PUT',
      body: JSON.stringify({ projectId }),
    });
    return parseActiveTimer(data)!;
  },
};

// ============ Users API ============

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const data = await fetchApi<any[]>('/users');
    return data.map(parseUser);
  },

  getById: async (id: string): Promise<User> => {
    const data = await fetchApi<any>(`/users/${id}`);
    return parseUser(data);
  },

  create: async (username: string, password: string, role: 'admin' | 'standard' = 'standard', createdBy?: string): Promise<User> => {
    const data = await fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role, createdBy }),
    });
    return parseUser(data);
  },

  login: async (username: string, password: string): Promise<User> => {
    const data = await fetchApi<any>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return parseUser(data);
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/users/${id}`, { method: 'DELETE' });
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    return fetchApi('/health');
  },
};

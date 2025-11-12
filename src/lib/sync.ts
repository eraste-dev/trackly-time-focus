/**
 * Système de synchronisation optimisé pour Trackly
 * Synchronise les données entre IndexedDB, localStorage et fichiers JSON
 */

import { db } from './db';
import { Project, TimeEntry, ActiveTimer } from './timeTracking';

// Types pour la synchronisation
interface SyncData {
  version: string;
  timestamp: number;
  lastSync: string;
  projects: Project[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  checksum: string; // Pour vérifier l'intégrité
}

interface SyncStatus {
  lastSync: Date | null;
  isSyncing: boolean;
  error: string | null;
}

const SYNC_STORAGE_KEY = 'trackly_sync_store';
const SYNC_STATUS_KEY = 'trackly_sync_status';
const SYNC_VERSION = '2.0';
const SYNC_FILE_PROJECTS = '/data/projects.json';
const SYNC_FILE_ENTRIES = '/data/timeEntries.json';
const SYNC_FILE_TIMER = '/data/activeTimer.json';

// Générer un checksum simple pour vérifier l'intégrité
const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Obtenir toutes les données actuelles
const getCurrentData = async (): Promise<Omit<SyncData, 'checksum' | 'timestamp' | 'lastSync'>> => {
  const projects = await db.projects.toArray();
  const timeEntries = await db.timeEntries.toArray();
  const activeTimer = await db.activeTimer.get('active') || null;

  return {
    version: SYNC_VERSION,
    projects,
    timeEntries,
    activeTimer
  };
};

// Sauvegarder dans les fichiers JSON (public/data)
const saveToJsonFiles = async (data: Omit<SyncData, 'checksum' | 'timestamp' | 'lastSync'>): Promise<boolean> => {
  try {
    const timestamp = Date.now();
    const lastSync = new Date().toISOString();

    // Sauvegarder les projets
    const projectsData = {
      version: data.version,
      timestamp,
      lastSync,
      projects: data.projects,
      checksum: generateChecksum(data.projects)
    };

    // Sauvegarder les entrées de temps
    const entriesData = {
      version: data.version,
      timestamp,
      lastSync,
      timeEntries: data.timeEntries,
      checksum: generateChecksum(data.timeEntries)
    };

    // Sauvegarder le timer actif
    const timerData = {
      version: data.version,
      timestamp,
      lastSync,
      activeTimer: data.activeTimer,
      checksum: generateChecksum(data.activeTimer)
    };

    // Utiliser l'API Fetch pour envoyer au serveur (développement uniquement)
    // En production, on utilisera localStorage comme fallback
    const saveFile = async (filename: string, content: any) => {
      try {
        const response = await fetch(`/api/save-sync${filename}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content)
        });
        return response.ok;
      } catch (error) {
        // Fallback: sauvegarder dans localStorage avec un préfixe spécial
        const key = `trackly_file_${filename.replace(/\//g, '_')}`;
        localStorage.setItem(key, JSON.stringify(content));
        return true;
      }
    };

    await Promise.all([
      saveFile(SYNC_FILE_PROJECTS, projectsData),
      saveFile(SYNC_FILE_ENTRIES, entriesData),
      saveFile(SYNC_FILE_TIMER, timerData)
    ]);

    console.log('✅ Données sauvegardées dans les fichiers JSON');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde dans les fichiers:', error);
    return false;
  }
};

// Sauvegarder les données dans le store de synchronisation
export const saveSyncData = async (): Promise<boolean> => {
  try {
    const data = await getCurrentData();
    const syncData: SyncData = {
      ...data,
      timestamp: Date.now(),
      lastSync: new Date().toISOString(),
      checksum: generateChecksum(data)
    };

    // Sauvegarder dans localStorage
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncData));

    // Sauvegarder dans les fichiers JSON
    await saveToJsonFiles(data);

    // Mettre à jour le statut
    const status: SyncStatus = {
      lastSync: new Date(),
      isSyncing: false,
      error: null
    };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));

    console.log('✅ Données synchronisées:', {
      projects: data.projects.length,
      entries: data.timeEntries.length,
      timestamp: new Date(syncData.timestamp).toLocaleString()
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde sync:', error);
    return false;
  }
};

// Charger depuis les fichiers JSON
const loadFromJsonFiles = async (): Promise<Partial<SyncData> | null> => {
  try {
    const loadFile = async (filename: string) => {
      try {
        // Essayer de charger depuis le serveur
        const response = await fetch(filename);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        // Fallback: charger depuis localStorage
        const key = `trackly_file_${filename.replace(/\//g, '_')}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return null;
    };

    const [projectsData, entriesData, timerData] = await Promise.all([
      loadFile(SYNC_FILE_PROJECTS),
      loadFile(SYNC_FILE_ENTRIES),
      loadFile(SYNC_FILE_TIMER)
    ]);

    if (!projectsData && !entriesData) {
      return null;
    }

    return {
      version: projectsData?.version || SYNC_VERSION,
      timestamp: Math.max(projectsData?.timestamp || 0, entriesData?.timestamp || 0),
      lastSync: projectsData?.lastSync || new Date().toISOString(),
      projects: projectsData?.projects || [],
      timeEntries: entriesData?.timeEntries || [],
      activeTimer: timerData?.activeTimer || null,
      checksum: '' // Sera recalculé
    };
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis les fichiers:', error);
    return null;
  }
};

// Charger les données depuis le store de synchronisation
export const loadSyncData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Essayer d'abord de charger depuis les fichiers JSON
    let syncData: SyncData | null = null;
    const fileData = await loadFromJsonFiles();

    if (fileData && fileData.projects && fileData.timeEntries) {
      syncData = fileData as SyncData;
      console.log('📂 Données chargées depuis les fichiers JSON');
    } else {
      // Fallback: charger depuis localStorage
      const syncDataStr = localStorage.getItem(SYNC_STORAGE_KEY);
      if (!syncDataStr) {
        return { success: false, message: 'Aucune donnée de synchronisation trouvée' };
      }
      syncData = JSON.parse(syncDataStr);
      console.log('💾 Données chargées depuis localStorage');
    }

    if (!syncData) {
      return { success: false, message: 'Aucune donnée de synchronisation trouvée' };
    }

    // Vérifier la version
    if (syncData.version !== SYNC_VERSION) {
      console.warn('⚠️ Version de synchronisation différente:', syncData.version, 'vs', SYNC_VERSION);
    }

    // Vérifier le checksum
    const expectedChecksum = generateChecksum({
      version: syncData.version,
      projects: syncData.projects,
      timeEntries: syncData.timeEntries,
      activeTimer: syncData.activeTimer
    });

    if (expectedChecksum !== syncData.checksum) {
      console.warn('⚠️ Checksum invalide, données potentiellement corrompues');
      return { success: false, message: 'Données corrompues détectées' };
    }

    // Convertir les dates
    const projects = syncData.projects.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }));

    const timeEntries = syncData.timeEntries.map(e => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: e.endTime ? new Date(e.endTime) : undefined
    }));

    // Vérifier si nous avons des données locales plus récentes
    const localProjects = await db.projects.toArray();
    const localEntries = await db.timeEntries.toArray();

    // Fusionner intelligemment les données
    if (localProjects.length > 0 || localEntries.length > 0) {
      // Fusionner les projets (garder les plus récents)
      const projectsMap = new Map(localProjects.map(p => [p.id, p]));
      projects.forEach(p => {
        const existing = projectsMap.get(p.id);
        if (!existing || new Date(p.createdAt) > new Date(existing.createdAt)) {
          projectsMap.set(p.id, p);
        }
      });

      // Fusionner les entrées de temps (garder les plus récentes)
      const entriesMap = new Map(localEntries.map(e => [e.id, e]));
      timeEntries.forEach(e => {
        const existing = entriesMap.get(e.id);
        if (!existing || new Date(e.startTime) > new Date(existing.startTime)) {
          entriesMap.set(e.id, e);
        }
      });

      // Sauvegarder les données fusionnées
      await db.projects.clear();
      await db.projects.bulkAdd(Array.from(projectsMap.values()));

      await db.timeEntries.clear();
      await db.timeEntries.bulkAdd(Array.from(entriesMap.values()));

      console.log('✅ Données fusionnées avec succès');
    } else {
      // Pas de données locales, importer directement
      await db.projects.bulkAdd(projects);
      await db.timeEntries.bulkAdd(timeEntries);
      console.log('✅ Données importées avec succès');
    }

    // Restaurer le timer actif si présent et plus récent
    if (syncData.activeTimer) {
      const localTimer = await db.activeTimer.get('active');
      const syncTimer = {
        ...syncData.activeTimer,
        startTime: new Date(syncData.activeTimer.startTime)
      };

      if (!localTimer || new Date(syncTimer.startTime) > new Date(localTimer.startTime)) {
        await db.activeTimer.put(syncTimer);
      }
    }

    return {
      success: true,
      message: `Synchronisé: ${projects.length} projets, ${timeEntries.length} entrées`
    };
  } catch (error) {
    console.error('❌ Erreur lors du chargement sync:', error);
    return { success: false, message: 'Erreur lors du chargement: ' + (error as Error).message };
  }
};

// Exporter les données vers un fichier JSON
export const exportToFile = async (): Promise<boolean> => {
  try {
    const data = await getCurrentData();
    const syncData: SyncData = {
      ...data,
      timestamp: Date.now(),
      lastSync: new Date().toISOString(),
      checksum: generateChecksum(data)
    };

    const blob = new Blob([JSON.stringify(syncData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `trackly-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Données exportées:', filename);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exportation:', error);
    return false;
  }
};

// Importer les données depuis un fichier JSON
export const importFromFile = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const text = await file.text();
    const syncData: SyncData = JSON.parse(text);

    // Vérifier la structure des données
    if (!syncData.projects || !syncData.timeEntries) {
      return { success: false, message: 'Format de fichier invalide' };
    }

    // Vérifier le checksum
    const expectedChecksum = generateChecksum({
      version: syncData.version,
      projects: syncData.projects,
      timeEntries: syncData.timeEntries,
      activeTimer: syncData.activeTimer
    });

    if (expectedChecksum !== syncData.checksum) {
      console.warn('⚠️ Checksum invalide dans le fichier importé');
    }

    // Convertir les dates
    const projects = syncData.projects.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }));

    const timeEntries = syncData.timeEntries.map(e => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: e.endTime ? new Date(e.endTime) : undefined
    }));

    // Importer avec fusion intelligente
    const existingProjects = await db.projects.toArray();
    const existingEntries = await db.timeEntries.toArray();

    if (existingProjects.length > 0 || existingEntries.length > 0) {
      // Fusion
      await db.projects.bulkPut(projects);
      await db.timeEntries.bulkPut(timeEntries);
    } else {
      // Import direct
      await db.projects.bulkAdd(projects);
      await db.timeEntries.bulkAdd(timeEntries);
    }

    // Restaurer le timer actif
    if (syncData.activeTimer) {
      const activeTimer = {
        ...syncData.activeTimer,
        startTime: new Date(syncData.activeTimer.startTime)
      };
      await db.activeTimer.put(activeTimer);
    }

    // Sauvegarder dans le store de sync
    await saveSyncData();

    console.log('✅ Données importées depuis fichier');
    return {
      success: true,
      message: `Importé: ${projects.length} projets, ${timeEntries.length} entrées`
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    return { success: false, message: 'Erreur lors de l\'importation: ' + (error as Error).message };
  }
};

// Obtenir le statut de synchronisation
export const getSyncStatus = (): SyncStatus => {
  try {
    const statusStr = localStorage.getItem(SYNC_STATUS_KEY);
    if (!statusStr) {
      return { lastSync: null, isSyncing: false, error: null };
    }

    const status = JSON.parse(statusStr);
    return {
      ...status,
      lastSync: status.lastSync ? new Date(status.lastSync) : null
    };
  } catch (error) {
    console.error('❌ Erreur lecture statut sync:', error);
    return { lastSync: null, isSyncing: false, error: 'Erreur de lecture' };
  }
};

// Auto-sync: Détecter les changements et synchroniser automatiquement
let syncInterval: NodeJS.Timeout | null = null;
let changeDetectionInterval: NodeJS.Timeout | null = null;
let lastDataHash: string | null = null;

export const startAutoSync = (intervalMinutes: number = 5) => {
  if (syncInterval) {
    console.warn('⚠️ Auto-sync déjà actif');
    return;
  }

  // Synchronisation périodique
  syncInterval = setInterval(async () => {
    try {
      await saveSyncData();
    } catch (error) {
      console.error('❌ Erreur auto-sync:', error);
    }
  }, intervalMinutes * 60 * 1000);

  // Détection de changements toutes les 30 secondes
  changeDetectionInterval = setInterval(async () => {
    try {
      const data = await getCurrentData();
      const currentHash = generateChecksum(data);

      if (lastDataHash && currentHash !== lastDataHash) {
        console.log('🔄 Changements détectés, synchronisation...');
        await saveSyncData();
      }

      lastDataHash = currentHash;
    } catch (error) {
      console.error('❌ Erreur détection changements:', error);
    }
  }, 30 * 1000);

  console.log(`✅ Auto-sync activé (${intervalMinutes} min)`);
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (changeDetectionInterval) {
    clearInterval(changeDetectionInterval);
    changeDetectionInterval = null;
  }

  console.log('⏹️ Auto-sync désactivé');
};

// Synchroniser avant de quitter
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveSyncData();
  });

  // Synchroniser au chargement
  window.addEventListener('load', async () => {
    await loadSyncData();
  });
}

// Synchroniser lors du changement de visibilité (retour sur l'onglet)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('🔄 Onglet actif, vérification de la synchronisation...');
      await loadSyncData();
    } else {
      console.log('💾 Onglet inactif, sauvegarde...');
      await saveSyncData();
    }
  });
}

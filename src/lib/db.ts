import Dexie, { Table } from 'dexie';
import { Project, TimeEntry, ActiveTimer } from './timeTracking';

export class TracklyDatabase extends Dexie {
  projects!: Table<Project, string>;
  timeEntries!: Table<TimeEntry, string>;
  activeTimer!: Table<ActiveTimer, string>;

  constructor() {
    super('TracklyDB');

    this.version(1).stores({
      projects: 'id, name, color, createdAt',
      timeEntries: 'id, projectId, startTime, endTime, duration'
    });

    // Migration pour ajouter plannedHoursPerDay
    this.version(2).stores({
      projects: 'id, name, color, createdAt, plannedHoursPerDay',
      timeEntries: 'id, projectId, startTime, endTime, duration'
    });

    // Migration pour ajouter activeTimer
    this.version(3).stores({
      projects: 'id, name, color, createdAt, plannedHoursPerDay',
      timeEntries: 'id, projectId, startTime, endTime, duration',
      activeTimer: 'id'
    });
  }
}

export const db = new TracklyDatabase();

// Migration automatique depuis localStorage vers IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Vérifier si des données existent déjà dans IndexedDB
    const projectsCount = await db.projects.count();
    const entriesCount = await db.timeEntries.count();

    // Si IndexedDB est vide, migrer depuis localStorage
    if (projectsCount === 0 && entriesCount === 0) {
      const savedProjects = localStorage.getItem('projects');
      const savedEntries = localStorage.getItem('timeEntries');

      if (savedProjects) {
        const projects = JSON.parse(savedProjects).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }));
        await db.projects.bulkAdd(projects);
        console.log('✅ Projets migrés depuis localStorage vers IndexedDB');
      } else {
        // Créer des projets exemples si aucune donnée n'existe
        const sampleProjects: Project[] = [
          { id: '1', name: 'CITL', color: '#3b82f6', createdAt: new Date() },
        ];
        await db.projects.bulkAdd(sampleProjects);
        console.log('✅ Projets exemples créés dans IndexedDB');
      }

      if (savedEntries) {
        const entries = JSON.parse(savedEntries).map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
          endTime: e.endTime ? new Date(e.endTime) : undefined
        }));
        await db.timeEntries.bulkAdd(entries);
        console.log('✅ Entrées de temps migrées depuis localStorage vers IndexedDB');
      }

      // Optionnel : nettoyer localStorage après migration
      // localStorage.removeItem('projects');
      // localStorage.removeItem('timeEntries');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
};

// Exporter toutes les données vers JSON
export const exportDataToJSON = async () => {
  try {
    const projects = await db.projects.toArray();
    const timeEntries = await db.timeEntries.toArray();

    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects,
      timeEntries
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trackly-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Données exportées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exportation:', error);
    return false;
  }
};

// Importer des données depuis JSON
export const importDataFromJSON = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.projects || !data.timeEntries) {
      return { success: false, message: 'Format de fichier invalide' };
    }

    // Convertir les dates en objets Date
    const projects = data.projects.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }));

    const timeEntries = data.timeEntries.map((e: any) => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: e.endTime ? new Date(e.endTime) : undefined
    }));

    // Demander confirmation avant d'écraser les données
    const projectsCount = await db.projects.count();
    const entriesCount = await db.timeEntries.count();

    if (projectsCount > 0 || entriesCount > 0) {
      // Les données seront fusionnées (pas d'écrasement complet)
      await db.projects.bulkPut(projects);
      await db.timeEntries.bulkPut(timeEntries);
      console.log('✅ Données importées et fusionnées avec succès');
      return {
        success: true,
        message: `${projects.length} projets et ${timeEntries.length} entrées importés et fusionnés`
      };
    } else {
      // Base vide, on peut importer directement
      await db.projects.bulkAdd(projects);
      await db.timeEntries.bulkAdd(timeEntries);
      console.log('✅ Données importées avec succès');
      return {
        success: true,
        message: `${projects.length} projets et ${timeEntries.length} entrées importés`
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    return { success: false, message: 'Erreur lors de l\'importation: ' + (error as Error).message };
  }
};

// Sauvegarde automatique toutes les 5 minutes dans un fichier JSON
let autoSaveInterval: NodeJS.Timeout | null = null;

export const startAutoSave = () => {
  if (autoSaveInterval) return; // Déjà démarré

  autoSaveInterval = setInterval(async () => {
    try {
      await saveToJsonStore();
      console.log('💾 Sauvegarde automatique effectuée');
    } catch (error) {
      console.error('❌ Erreur sauvegarde auto:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('✅ Sauvegarde automatique activée (toutes les 5 minutes)');
};

export const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    console.log('⏹️ Sauvegarde automatique désactivée');
  }
};

// Sauvegarder dans localStorage comme store JSON de synchronisation
export const saveToJsonStore = async () => {
  try {
    const projects = await db.projects.toArray();
    const timeEntries = await db.timeEntries.toArray();
    const activeTimer = await db.activeTimer.get('active');

    const store = {
      version: '1.0',
      lastSync: new Date().toISOString(),
      projects,
      timeEntries,
      activeTimer: activeTimer || null
    };

    localStorage.setItem('trackly_store', JSON.stringify(store));
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde store:', error);
    return false;
  }
};

// Charger depuis le store JSON
export const loadFromJsonStore = async () => {
  try {
    const storeData = localStorage.getItem('trackly_store');
    if (!storeData) return { success: false, message: 'Aucune sauvegarde trouvée' };

    const store = JSON.parse(storeData);

    // Convertir les dates
    const projects = store.projects.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }));

    const timeEntries = store.timeEntries.map((e: any) => ({
      ...e,
      startTime: new Date(e.startTime),
      endTime: e.endTime ? new Date(e.endTime) : undefined
    }));

    // Fusionner avec les données existantes
    await db.projects.bulkPut(projects);
    await db.timeEntries.bulkPut(timeEntries);

    // Restaurer le timer actif si présent
    if (store.activeTimer) {
      const activeTimer = {
        ...store.activeTimer,
        startTime: new Date(store.activeTimer.startTime)
      };
      await db.activeTimer.put(activeTimer);
    }

    console.log('✅ Données restaurées depuis le store JSON');
    return {
      success: true,
      message: `Restauré: ${projects.length} projets, ${timeEntries.length} entrées`
    };
  } catch (error) {
    console.error('❌ Erreur chargement store:', error);
    return { success: false, message: 'Erreur lors du chargement' };
  }
};

// Synchroniser à la fermeture du navigateur
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveToJsonStore();
  });
}

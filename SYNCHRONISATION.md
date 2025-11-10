# Système de Synchronisation Trackly

## Vue d'ensemble

Trackly dispose d'un système de synchronisation robuste et optimisé qui garantit la sécurité de vos données et permet la synchronisation entre différents navigateurs et appareils.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Trackly                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  IndexedDB   │◄───│ localStorage │───►│  Fichiers    │
│  (Primary)   │    │   (Sync)     │    │   JSON       │
└──────────────┘    └──────────────┘    └──────────────┘
     Rapide          Synchronisation      Export/Import
  Persistant         Automatique         Inter-navigateurs
```

## Niveaux de stockage

### 1. IndexedDB (Stockage principal)
- **Rôle** : Base de données principale de l'application
- **Avantages** :
  - Très rapide pour les opérations CRUD
  - Peut stocker de grandes quantités de données
  - API asynchrone moderne
  - Support des transactions
- **Tables** :
  - `projects` : Tous les projets
  - `timeEntries` : Toutes les entrées de temps
  - `activeTimer` : Timer actuellement actif

### 2. localStorage (Store de synchronisation)
- **Rôle** : Couche de synchronisation et de sauvegarde
- **Avantages** :
  - Sauvegarde rapide et synchrone
  - Persistance entre sessions
  - Détection de changements efficace
- **Clés** :
  - `trackly_sync_store` : Données complètes avec checksum
  - `trackly_sync_status` : Statut de synchronisation

### 3. Fichiers JSON (Export/Import)
- **Rôle** : Synchronisation inter-navigateurs/appareils
- **Avantages** :
  - Portabilité totale
  - Sauvegarde externe
  - Contrôle manuel de l'utilisateur

## Mécanismes de synchronisation

### Synchronisation automatique

#### 1. Sauvegarde périodique (5 minutes)
```javascript
setInterval(async () => {
  await saveSyncData();
}, 5 * 60 * 1000);
```

#### 2. Détection de changements (30 secondes)
```javascript
setInterval(async () => {
  const currentHash = generateChecksum(await getCurrentData());
  if (lastHash !== currentHash) {
    await saveSyncData();
  }
}, 30 * 1000);
```

#### 3. Événements du navigateur
- **beforeunload** : Sauvegarde avant fermeture
- **visibilitychange** :
  - Onglet inactif → Sauvegarde
  - Onglet actif → Chargement
- **load** : Chargement au démarrage

### Fusion intelligente

Lors de l'import de données, le système compare et fusionne intelligemment :

```typescript
// Pour les projets
const projectsMap = new Map();
projects.forEach(p => {
  const existing = projectsMap.get(p.id);
  if (!existing || new Date(p.createdAt) > new Date(existing.createdAt)) {
    projectsMap.set(p.id, p); // Garder le plus récent
  }
});

// Pour les entrées de temps
const entriesMap = new Map();
timeEntries.forEach(e => {
  const existing = entriesMap.get(e.id);
  if (!existing || new Date(e.startTime) > new Date(existing.startTime)) {
    entriesMap.set(e.id, e); // Garder le plus récent
  }
});
```

### Vérification d'intégrité

Chaque sauvegarde inclut un checksum pour vérifier l'intégrité des données :

```typescript
const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};
```

## Format des données

### Structure du fichier JSON exporté

```json
{
  "version": "2.0",
  "timestamp": 1699999999999,
  "lastSync": "2025-11-10T10:30:00.000Z",
  "checksum": "abc123def456",
  "projects": [
    {
      "id": "1699999999999",
      "name": "Mon Projet",
      "color": "#8ecae6",
      "createdAt": "2025-11-10T10:00:00.000Z",
      "plannedHoursPerDay": 8
    }
  ],
  "timeEntries": [
    {
      "id": "1699999999999",
      "projectId": "1699999999999",
      "startTime": "2025-11-10T10:00:00.000Z",
      "endTime": "2025-11-10T12:00:00.000Z",
      "duration": 7200
    }
  ],
  "activeTimer": {
    "id": "active",
    "projectId": "1699999999999",
    "startTime": "2025-11-10T14:00:00.000Z",
    "isRunning": true
  }
}
```

## Guide d'utilisation

### Synchronisation sur le même appareil

1. **Automatique** : Les données sont automatiquement synchronisées toutes les 5 minutes
2. **Manuel** : Paramètres → Synchronisation → Bouton "Synchroniser"

### Synchronisation entre navigateurs/appareils

#### Méthode recommandée : Export/Import

**Sur le navigateur source :**
1. Ouvrir Trackly
2. Aller dans **Paramètres**
3. Section **Import / Export**
4. Cliquer sur **Exporter en JSON**
5. Télécharger le fichier `trackly-export-YYYY-MM-DD-HH-MM-SS.json`

**Sur le navigateur cible :**
1. Ouvrir Trackly
2. Aller dans **Paramètres**
3. Section **Import / Export**
4. Cliquer sur **Importer depuis JSON**
5. Sélectionner le fichier exporté
6. Confirmer l'import

Les données seront fusionnées intelligemment avec les données existantes.

### Sauvegarde des données

**Recommandation** : Exportez vos données régulièrement (une fois par semaine) pour avoir une sauvegarde externe.

#### Automatique
- localStorage (toutes les 5 minutes + détection de changements)
- beforeunload (avant fermeture du navigateur)

#### Manuel
- Export JSON (Paramètres → Export)
- Copie de localStorage (pour utilisateurs avancés)

## API de synchronisation

### Fonctions principales

```typescript
// Sauvegarder les données
await saveSyncData(): Promise<boolean>

// Charger les données
await loadSyncData(): Promise<{ success: boolean; message: string }>

// Exporter vers fichier
await exportToFile(): Promise<boolean>

// Importer depuis fichier
await importFromFile(file: File): Promise<{ success: boolean; message: string }>

// Obtenir le statut
getSyncStatus(): SyncStatus

// Démarrer la synchronisation automatique
startAutoSync(intervalMinutes: number = 5): void

// Arrêter la synchronisation automatique
stopAutoSync(): void
```

### Utilisation dans le code

```typescript
import {
  saveSyncData,
  loadSyncData,
  startAutoSync,
  stopAutoSync
} from '@/lib/sync';

// Au démarrage de l'application
useEffect(() => {
  const init = async () => {
    await loadSyncData();
    startAutoSync(5); // Sync toutes les 5 minutes
  };
  init();

  return () => {
    stopAutoSync();
  };
}, []);

// Synchronisation manuelle
const handleSync = async () => {
  const result = await saveSyncData();
  if (result) {
    console.log('Synchronisation réussie');
  }
};
```

## Performances

### Optimisations

1. **Détection de changements** : Utilisation de checksums pour éviter les sauvegardes inutiles
2. **Fusion intelligente** : Utilisation de Map pour des recherches en O(1)
3. **Sauvegardes asynchrones** : Pas de blocage de l'UI
4. **Compression** : Les dates sont stockées en ISO string pour minimiser la taille

### Impact sur les performances

- **Sauvegarde** : ~10-50ms (selon la quantité de données)
- **Chargement** : ~20-100ms (selon la quantité de données)
- **Détection de changements** : ~5-10ms
- **Export** : ~50-200ms (téléchargement inclus)
- **Import** : ~100-500ms (fusion incluse)

## Sécurité

### Vérifications d'intégrité

1. **Checksum** : Vérifie que les données n'ont pas été corrompues
2. **Version** : Vérifie la compatibilité du format
3. **Validation de structure** : Vérifie que toutes les clés requises sont présentes

### Limitations

- **localStorage** : Limité à ~5-10MB (dépend du navigateur)
- **IndexedDB** : Limité à ~50MB-illimité (dépend du navigateur et de l'espace disque)
- **Pas de chiffrement** : Les données sont stockées en clair (considérez cela pour des données sensibles)

## Dépannage

### Problème : Données non synchronisées entre navigateurs

**Solution** : localStorage n'est pas partagé entre différents navigateurs. Utilisez l'export/import manuel.

### Problème : Checksum invalide lors de l'import

**Causes possibles** :
- Fichier corrompu
- Fichier modifié manuellement
- Version incompatible

**Solution** : Essayez avec une sauvegarde plus récente ou plus ancienne.

### Problème : Données perdues après fermeture du navigateur

**Causes possibles** :
- Mode privé/incognito (les données sont effacées)
- Nettoyage automatique du cache
- Espace disque insuffisant

**Solution** :
1. Vérifiez que vous n'êtes pas en mode privé
2. Exportez régulièrement vos données
3. Vérifiez l'espace disque disponible

### Problème : Synchronisation lente

**Causes possibles** :
- Grande quantité de données
- Navigateur lent

**Solution** :
1. Archivez les anciennes entrées de temps
2. Fermez les autres onglets
3. Redémarrez le navigateur

## Développement

### Tests

Pour tester la synchronisation en développement :

```bash
# Dans la console du navigateur
import { saveSyncData, loadSyncData } from './src/lib/sync';

// Tester la sauvegarde
await saveSyncData();

// Tester le chargement
const result = await loadSyncData();
console.log(result);

// Vérifier le statut
const status = getSyncStatus();
console.log(status);
```

### Ajout de nouvelles tables

Si vous ajoutez une nouvelle table dans IndexedDB :

1. Mettre à jour `getCurrentData()` dans `sync.ts`
2. Mettre à jour l'interface `SyncData`
3. Mettre à jour la logique de fusion dans `loadSyncData()`
4. Incrémenter la version du format

## Roadmap

Améliorations futures possibles :

- [ ] Synchronisation cloud (Firebase, Supabase, etc.)
- [ ] Chiffrement des données
- [ ] Compression des exports
- [ ] Synchronisation temps réel entre onglets
- [ ] Historique des versions
- [ ] Résolution de conflits avancée

## Contributions

Pour contribuer au système de synchronisation :

1. Lisez ce document en entier
2. Testez vos modifications avec différents scénarios
3. Assurez-vous de la compatibilité ascendante
4. Documentez les changements

## Licence

Voir LICENSE dans le dossier racine du projet.

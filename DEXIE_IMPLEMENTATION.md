# Implémentation de Dexie.js dans Trackly

## Vue d'ensemble

Dexie.js a été implémenté pour remplacer `localStorage` et fournir une solution de persistence de données plus robuste et performante utilisant IndexedDB.

## Avantages de Dexie.js

✅ **Capacité de stockage** : Plusieurs centaines de MB vs ~5-10 MB pour localStorage
✅ **Performance** : Requêtes asynchrones qui ne bloquent pas l'UI
✅ **Requêtes avancées** : Support des filtres, tris, et indexation
✅ **Transactions ACID** : Garantie d'intégrité des données
✅ **Type-safe** : Excellent support TypeScript
✅ **Reactive** : Mises à jour en temps réel avec `useLiveQuery`

## Installation

Les dépendances ont été ajoutées au `package.json` :

```json
{
  "dependencies": {
    "dexie": "^4.0.11",
    "dexie-react-hooks": "^1.1.7"
  }
}
```

Pour installer :
```bash
npm install
```

## Structure de la base de données

### Fichier : `src/lib/db.ts`

La base de données `TracklyDB` contient deux tables :

#### Table `projects`
- **id** : Identifiant unique (string)
- **name** : Nom du projet (string)
- **color** : Couleur en hexadécimal (string)
- **createdAt** : Date de création (Date)

#### Table `timeEntries`
- **id** : Identifiant unique (string)
- **projectId** : Référence au projet (string, indexé)
- **startTime** : Date/heure de début (Date, indexé)
- **endTime** : Date/heure de fin (Date, optionnel)
- **duration** : Durée en secondes (number, indexé)

### Versioning

Version actuelle : **1**

Pour ajouter une nouvelle version avec migration :
```typescript
this.version(2).stores({
  // Nouvelle structure
}).upgrade(tx => {
  // Code de migration
});
```

## Migration automatique

Au démarrage de l'application ([src/App.tsx:17-19](src/App.tsx#L17-L19)), la fonction `migrateFromLocalStorage()` est exécutée :

1. Vérifie si IndexedDB contient déjà des données
2. Si vide, cherche les données dans localStorage
3. Si localStorage contient des données, les migre vers IndexedDB
4. Sinon, crée 3 projets exemples

**Note** : Le localStorage n'est pas automatiquement nettoyé après migration pour éviter toute perte de données. Vous pouvez décommenter les lignes de nettoyage dans `db.ts` si souhaité.

## Hooks personnalisés

### `useProjects()` - [src/hooks/useProjects.ts](src/hooks/useProjects.ts)

Fournit l'accès réactif aux projets.

**Exports** :
- `projects` : Liste réactive de tous les projets (mise à jour automatique)
- `addProject(name: string)` : Ajouter un nouveau projet
- `updateProject(id: string, updates: Partial<Project>)` : Mettre à jour un projet
- `deleteProject(id: string)` : Supprimer un projet (et ses entrées de temps)
- `getProject(id: string)` : Récupérer un projet par ID

**Exemple** :
```typescript
const { projects, addProject, deleteProject } = useProjects();

// Ajouter un projet
await addProject("Nouveau projet");

// Les projets sont automatiquement mis à jour
projects.map(p => console.log(p.name));
```

### `useTimeEntries()` - [src/hooks/useTimeEntries.ts](src/hooks/useTimeEntries.ts)

Fournit l'accès réactif aux entrées de temps.

**Exports** :
- `timeEntries` : Liste réactive de toutes les entrées (triées par date décroissante)
- `addTimeEntry(entry: TimeEntry)` : Ajouter une nouvelle entrée
- `updateTimeEntry(id: string, updates: Partial<TimeEntry>)` : Mettre à jour une entrée
- `deleteTimeEntry(id: string)` : Supprimer une entrée
- `getTimeEntry(id: string)` : Récupérer une entrée par ID
- `getEntriesByProject(projectId: string)` : Récupérer les entrées d'un projet
- `getEntriesByTimePeriod(period: 'day' | 'week' | 'month')` : Filtrer par période

**Exemple** :
```typescript
const { timeEntries, addTimeEntry, getEntriesByTimePeriod } = useTimeEntries();

// Ajouter une entrée
await addTimeEntry({
  id: Date.now().toString(),
  projectId: "1",
  startTime: new Date(),
  endTime: new Date(),
  duration: 3600
});

// Récupérer les entrées du jour
const todayEntries = getEntriesByTimePeriod('day');
```

## Réactivité en temps réel

Grâce à `useLiveQuery` de `dexie-react-hooks`, toutes les modifications dans IndexedDB sont automatiquement reflétées dans l'interface :

```typescript
// Dans useProjects.ts
const projects = useLiveQuery(() => db.projects.toArray()) || [];
```

Cela signifie :
- ✅ Pas besoin de `useState` pour les données
- ✅ Pas besoin de `useEffect` pour charger les données
- ✅ Synchronisation automatique entre tous les composants
- ✅ Mises à jour en temps réel

## Utilisation dans les pages

### Page Index ([src/pages/Index.tsx](src/pages/Index.tsx))

```typescript
const { projects } = useProjects();
const { timeEntries, addTimeEntry, getEntriesByTimePeriod } = useTimeEntries();

// Les données sont automatiquement à jour
const todayEntries = getEntriesByTimePeriod('day');
```

### Page Projects ([src/pages/Projects.tsx](src/pages/Projects.tsx))

```typescript
const { projects, addProject, deleteProject } = useProjects();

// Créer un projet
await addProject("Nouveau projet");

// Supprimer un projet
await deleteProject(projectId);
```

### Page Reports ([src/pages/Reports.tsx](src/pages/Reports.tsx))

```typescript
const { projects } = useProjects();
const { getEntriesByTimePeriod } = useTimeEntries();

// Filtrer par période
const filteredEntries = getEntriesByTimePeriod(period);
```

## Différences avec localStorage

| Aspect | localStorage | Dexie.js (IndexedDB) |
|--------|--------------|---------------------|
| **Capacité** | ~5-10 MB | Plusieurs centaines de MB |
| **API** | Synchrone | Asynchrone |
| **Performance** | Bloque l'UI | Non-bloquant |
| **Requêtes** | Aucune | Filtres, tris, index |
| **Type** | String seulement | Types natifs (Date, Number, etc.) |
| **Réactivité** | Manuelle | Automatique avec useLiveQuery |
| **Transactions** | Non | Oui (ACID) |

## Gestion des erreurs

Toutes les opérations incluent une gestion d'erreurs avec toasts :

```typescript
try {
  await addProject(name);
  toast.success('Projet créé avec succès');
} catch (error) {
  console.error('Erreur:', error);
  toast.error('Erreur lors de la création du projet');
}
```

## Débogage

### Console du navigateur

Ouvrir les DevTools > Application > IndexedDB > TracklyDB

Vous pouvez :
- ✅ Voir toutes les tables
- ✅ Inspecter les données
- ✅ Modifier manuellement les entrées
- ✅ Supprimer la base (clic droit > Delete database)

### Logs

Des messages de migration s'affichent dans la console :
- ✅ `Projets migrés depuis localStorage vers IndexedDB`
- ✅ `Entrées de temps migrées depuis localStorage vers IndexedDB`
- ✅ `Projets exemples créés dans IndexedDB`
- ❌ `Erreur lors de la migration: ...`

## Commandes utiles

### Réinitialiser la base de données

Ouvrir la console du navigateur et exécuter :
```javascript
indexedDB.deleteDatabase('TracklyDB')
location.reload()
```

### Vérifier le contenu

```javascript
// Dans la console
const db = await new Dexie('TracklyDB').open();
const projects = await db.table('projects').toArray();
console.table(projects);
```

## Évolutions futures possibles

### Court terme
- ✅ Export de données (JSON, CSV)
- ✅ Import de données
- ✅ Recherche full-text dans les projets

### Moyen terme
- ✅ Synchronisation avec un backend
- ✅ Backup automatique
- ✅ Compression des données

### Long terme
- ✅ Encryption des données sensibles
- ✅ Multi-workspace
- ✅ Collaboration en temps réel

## Ressources

- [Documentation Dexie.js](https://dexie.org/)
- [API Reference](https://dexie.org/docs/API-Reference)
- [useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())
- [Versioning & Schema](https://dexie.org/docs/Tutorial/Design#database-versioning)

## Support

Pour toute question sur l'implémentation, consulter :
- Les hooks personnalisés dans `src/hooks/`
- La configuration de la DB dans `src/lib/db.ts`
- Les exemples d'utilisation dans les pages

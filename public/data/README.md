# Dossier de Synchronisation Trackly

Ce dossier contient les fichiers JSON de synchronisation pour l'application Trackly. Les données sont automatiquement sauvegardées dans ces fichiers pour permettre la persistance entre les sessions et navigateurs.

## Fichiers de Synchronisation

- **projects.json** : Liste de tous les projets
- **timeEntries.json** : Liste de toutes les entrées de temps
- **activeTimer.json** : Timer actif (si présent)

## Système de Synchronisation

Trackly utilise un système de synchronisation optimisé à plusieurs niveaux :

### 1. IndexedDB (Base de données locale)
- Stockage principal de toutes les données
- Rapide et efficace pour les opérations quotidiennes
- Persistant entre les sessions

### 2. Fichiers JSON (public/data)
- **Sauvegarde automatique toutes les 5 minutes**
- Détection de changements toutes les 30 secondes
- Synchronisation lors du changement d'onglet
- Chargement automatique au démarrage de l'application
- Les fichiers sont accessibles via `/data/projects.json`, `/data/timeEntries.json`, `/data/activeTimer.json`

### 3. localStorage (Fallback)
- Utilisé comme fallback si les fichiers JSON ne sont pas accessibles
- Sauvegarde de secours pour garantir la persistance des données
- Permet la synchronisation rapide entre onglets du même navigateur

### 4. Export/Import manuel
- Pour synchroniser entre différents navigateurs/appareils
- Pour faire des sauvegardes externes
- Pour transférer des données manuellement

## Comment synchroniser entre navigateurs ?

### Méthode 1 : Même appareil, différents navigateurs
1. Ouvrez Trackly dans le premier navigateur
2. Allez dans **Paramètres** → **Synchronisation**
3. Cliquez sur **Synchroniser** pour sauvegarder les dernières données
4. Le localStorage contient maintenant vos données
5. Ouvrez Trackly dans le second navigateur
6. Les données seront automatiquement chargées depuis localStorage si disponible

**Note** : localStorage est partagé uniquement si les deux navigateurs utilisent le même profil utilisateur du système d'exploitation et le même chemin d'accès (http://localhost:...)

### Méthode 2 : Export/Import manuel (recommandé pour différents navigateurs/appareils)
1. Dans le premier navigateur :
   - Allez dans **Paramètres** → **Import / Export**
   - Cliquez sur **Exporter en JSON**
   - Téléchargez le fichier `trackly-export-YYYY-MM-DD-HH-MM-SS.json`

2. Dans le second navigateur/appareil :
   - Ouvrez Trackly
   - Allez dans **Paramètres** → **Import / Export**
   - Cliquez sur **Importer depuis JSON**
   - Sélectionnez le fichier exporté
   - Les données seront fusionnées intelligemment

## Structure du fichier JSON

```json
{
  "version": "2.0",
  "timestamp": 1699999999999,
  "lastSync": "2025-11-10T10:30:00.000Z",
  "checksum": "abc123def456",
  "projects": [...],
  "timeEntries": [...],
  "activeTimer": {...}
}
```

### Champs :
- **version** : Version du format de synchronisation
- **timestamp** : Horodatage Unix de l'export
- **lastSync** : Date ISO de la dernière synchronisation
- **checksum** : Hash pour vérifier l'intégrité des données
- **projects** : Liste de tous les projets
- **timeEntries** : Liste de toutes les entrées de temps
- **activeTimer** : Timer actif (si présent)

## Fusion intelligente

Lors de l'import, le système fusionne intelligemment les données :
- **Projets** : Les projets avec la même ID sont comparés, le plus récent (createdAt) est conservé
- **Entrées de temps** : Les entrées avec la même ID sont comparées, la plus récente (startTime) est conservée
- **Timer actif** : Le timer le plus récent est conservé

Cette approche évite les doublons et garantit que les données les plus à jour sont toujours préservées.

## Sauvegarde automatique

Le système sauvegarde automatiquement vos données dans les fichiers JSON :
- ✅ **Toutes les 5 minutes** (synchronisation programmée vers fichiers)
- ✅ **Toutes les 30 secondes** (si changements détectés)
- ✅ **Lors du changement d'onglet** (actif → inactif)
- ✅ **Avant la fermeture du navigateur** (beforeunload)
- ✅ **Au retour sur l'onglet** (inactif → actif)
- ✅ **Au démarrage de l'application** (chargement depuis les fichiers)

### Écran de chargement

Lors du démarrage de l'application, un écran de chargement s'affiche avec les étapes suivantes :
1. **Migration des données** - Transfert depuis l'ancien système si nécessaire
2. **Synchronisation en cours** - Chargement depuis les fichiers JSON
3. **Configuration de la synchronisation automatique** - Activation du système de sauvegarde
4. **Application prête** - Lancement de l'application

## Bonnes pratiques

1. **Exportez régulièrement vos données** pour avoir une sauvegarde externe
2. **Utilisez l'export/import** pour synchroniser entre différents appareils
3. **Vérifiez la date de dernière synchronisation** dans Paramètres
4. **En cas de doute**, faites une synchronisation manuelle avant de fermer l'application

## Dépannage

### Mes données ne sont pas synchronisées entre navigateurs
- Utilisez l'export/import manuel plutôt que de compter sur localStorage
- localStorage n'est PAS partagé entre différents navigateurs
- Exportez depuis le navigateur source, importez dans le navigateur cible

### J'ai perdu mes données
- Vérifiez si vous avez un fichier JSON exporté
- Importez le fichier le plus récent
- Le système fusionnera avec les données existantes

### Le checksum est invalide
- Cela signifie que le fichier a pu être modifié ou corrompu
- Vous pouvez quand même essayer d'importer
- En cas d'échec, utilisez une sauvegarde plus ancienne

## Support

Pour toute question ou problème, créez une issue sur le dépôt GitHub du projet.

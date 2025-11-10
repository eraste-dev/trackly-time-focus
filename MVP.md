# Trackly - Documentation MVP

## Vue d'ensemble

Trackly est une application web de suivi du temps de travail, permettant aux utilisateurs de chronométrer et d'analyser le temps passé sur différents projets. Cette application MVP offre les fonctionnalités essentielles pour une gestion efficace du temps.

## Fonctionnalités du MVP

### 1. Tableau de Bord Principal (Page d'accueil)

#### Statistiques en temps réel
- **Aujourd'hui** : Temps total travaillé dans la journée en cours
- **Cette semaine** : Temps cumulé sur les 7 derniers jours
- **Projets actifs** : Nombre total de projets créés

#### Timer de suivi
- Sélection du projet en cours via un menu déroulant
- Démarrage/arrêt du chronomètre d'un simple clic
- Affichage en temps réel du temps écoulé
- Validation automatique : impossible de démarrer sans sélectionner un projet
- Notifications toast pour confirmer les actions (démarrage, arrêt)

#### Visualisation des projets
- Carte compacte pour chaque projet avec :
  - Nom du projet
  - Pastille de couleur pour identification rapide
  - Temps total travaillé aujourd'hui
- Sélection rapide d'un projet par clic sur sa carte
- Affichage des 4 projets les plus récents

#### Historique du jour
- Liste des 5 dernières entrées de temps
- Pour chaque entrée :
  - Nom du projet avec couleur associée
  - Heure de début et de fin
  - Durée calculée automatiquement
- Lien vers le rapport complet si plus de 5 entrées

### 2. Gestion des Projets

#### Création de projets
- Formulaire simple avec nom du projet
- Attribution automatique d'une couleur parmi 8 couleurs prédéfinies
- Date de création enregistrée automatiquement

#### Projets par défaut
Au premier lancement, 3 projets exemples sont créés :
- Site Web Client A (bleu)
- Application Mobile (vert)
- Marketing Digital (ambre)

#### Liste des projets
- Affichage de tous les projets créés
- Visualisation de la couleur et du nom
- Temps total cumulé par projet

### 3. Rapports et Analyses

#### Filtrage par période
- **Aujourd'hui** : Entrées de la journée en cours (depuis minuit)
- **Cette semaine** : Entrées depuis le lundi de la semaine en cours
- **Ce mois** : Entrées depuis le 1er du mois

#### Filtrage par projet
- Sélection d'un projet spécifique via menu déroulant
- Option "Tous les projets" pour vue globale

#### Visualisation des données
- Liste complète des entrées de temps filtrées
- Pour chaque entrée :
  - Projet avec couleur
  - Date et heure de début
  - Date et heure de fin
  - Durée totale
- Calcul automatique du temps total de la sélection

## Architecture Technique

### Modèle de données

#### Projet (Project)
```typescript
{
  id: string;           // Identifiant unique
  name: string;         // Nom du projet
  color: string;        // Couleur en format hexadécimal
  createdAt: Date;      // Date de création
}
```

#### Entrée de temps (TimeEntry)
```typescript
{
  id: string;           // Identifiant unique
  projectId: string;    // Référence au projet
  startTime: Date;      // Date/heure de début
  endTime?: Date;       // Date/heure de fin (optionnel si en cours)
  duration: number;     // Durée en secondes
  description?: string; // Description (optionnel, non utilisé dans MVP)
}
```

### Persistence des données

- **Stockage local** : Utilisation de `localStorage` du navigateur
- **Clés de stockage** :
  - `'projects'` : Tableau des projets
  - `'timeEntries'` : Tableau des entrées de temps
- **Sérialisation** : Les objets Date sont convertis en chaînes JSON lors du stockage et reconvertis au chargement

### Stack Technique

- **Frontend** : React 18 avec TypeScript
- **Build** : Vite avec plugin React SWC
- **Routage** : React Router DOM v6
- **UI** : shadcn/ui (composants basés sur Radix UI)
- **Styling** : Tailwind CSS
- **Notifications** : Sonner (toasts)
- **State Management** : React Hooks + TanStack Query

## Parcours utilisateur

### Scénario 1 : Premier lancement
1. L'utilisateur arrive sur le tableau de bord
2. 3 projets exemples sont automatiquement créés
3. Les statistiques affichent 0h 0m (aucune entrée)
4. L'utilisateur peut immédiatement démarrer un timer

### Scénario 2 : Suivi d'une tâche
1. L'utilisateur sélectionne un projet dans le menu déroulant
2. Il clique sur le bouton de démarrage du timer
3. Le chronomètre démarre et s'affiche en temps réel
4. Une notification confirme le démarrage
5. Quand la tâche est terminée, l'utilisateur clique sur stop
6. L'entrée est enregistrée et apparaît dans l'historique du jour
7. Les statistiques sont mises à jour automatiquement

### Scénario 3 : Création d'un nouveau projet
1. Depuis le tableau de bord, clic sur "Nouveau"
2. Redirection vers la page Projets
3. Saisie du nom du projet
4. Validation et création automatique avec une couleur
5. Le projet apparaît dans la liste

### Scénario 4 : Consultation des rapports
1. Navigation vers la page Rapports
2. Sélection d'une période (jour/semaine/mois)
3. Sélection optionnelle d'un projet spécifique
4. Visualisation de toutes les entrées correspondantes
5. Consultation du temps total cumulé

## Formats d'affichage

### Durée courte
- Moins d'une heure : `Xm` (ex: 45m)
- Une heure ou plus : `Xh Ym` (ex: 2h 30m)

### Durée détaillée
- Moins d'une heure : `MM:SS` (ex: 45:30)
- Une heure ou plus : `HH:MM:SS` (ex: 2:30:15)

### Périodes de temps
- **Jour** : De 00:00 à 23:59 du jour en cours
- **Semaine** : Du lundi 00:00 au dimanche 23:59
- **Mois** : Du 1er 00:00 au dernier jour du mois 23:59

## Palette de couleurs des projets

8 couleurs prédéfinies pour l'identification visuelle :
1. Bleu (`#3b82f6`)
2. Violet (`#8b5cf6`)
3. Rose (`#ec4899`)
4. Ambre (`#f59e0b`)
5. Vert (`#10b981`)
6. Cyan (`#06b6d4`)
7. Rouge (`#ef4444`)
8. Orange (`#f97316`)

## Limitations connues du MVP

1. **Pas de backend** : Les données sont stockées localement dans le navigateur
2. **Pas de synchronisation** : Les données ne sont pas partagées entre appareils
3. **Pas d'authentification** : Pas de système de comptes utilisateurs
4. **Pas d'export** : Impossible d'exporter les données (CSV, PDF, etc.)
5. **Pas d'édition** : Les entrées de temps ne peuvent pas être modifiées après création
6. **Pas de suppression** : Impossible de supprimer des entrées ou projets
7. **Pas de descriptions** : Le champ description n'est pas utilisé dans l'interface
8. **Timer unique** : Un seul timer peut être actif à la fois
9. **Pas de graphiques** : Absence de visualisations graphiques (charts, diagrammes)
10. **Pas de pause** : Le timer ne peut être que démarré ou arrêté

## Évolutions futures potentielles

### Court terme
- Édition et suppression d'entrées de temps
- Ajout de descriptions aux entrées
- Fonction pause/reprise du timer
- Validation avant suppression de projets

### Moyen terme
- Export des données (CSV, Excel, PDF)
- Graphiques et visualisations (par projet, par période)
- Objectifs de temps par projet
- Notifications de rappel
- Mode sombre/clair

### Long terme
- Backend avec API REST
- Authentification et comptes utilisateurs
- Synchronisation multi-appareils
- Application mobile native
- Intégrations (calendrier, outils de gestion de projet)
- Partage et collaboration en équipe
- Rapports avancés et analytics

## Support et déploiement

### Développement local
```bash
npm run dev
```
Accessible sur http://[::]:8080

### Build de production
```bash
npm run build
```
Les fichiers optimisés sont générés dans le dossier `dist/`

### Déploiement
Compatible avec tous les hébergeurs de sites statiques :
- Lovable (recommandé, intégration native)
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

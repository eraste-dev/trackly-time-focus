# Docker - Trackly Time Tracker

Ce guide explique comment utiliser Docker pour exécuter Trackly.

## Prérequis

- Docker installé (version 20.10 ou supérieure)
- Docker Compose installé (version 2.0 ou supérieure)

## Architecture Docker

L'application utilise une architecture multi-stage Docker :

1. **Stage 1 (Builder)** : Utilise Node.js 20 Alpine pour construire l'application
2. **Stage 2 (Production)** : Utilise Nginx Alpine pour servir l'application statique

## Démarrage rapide

### Mode Production

Pour lancer l'application en mode production :

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# Ou utiliser Docker directement
docker build -t trackly .
docker run -d -p 8080:80 --name trackly-app trackly
```

L'application sera accessible sur : **http://localhost:8080**

### Mode Développement

Pour lancer l'application en mode développement avec hot-reload :

```bash
# Démarrer en mode développement
docker-compose --profile dev up trackly-dev

# Ou avec détachement
docker-compose --profile dev up -d trackly-dev
```

L'application sera accessible sur : **http://localhost:8080**

## Commandes utiles

### Gestion des conteneurs

```bash
# Voir les conteneurs en cours d'exécution
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Redémarrer l'application
docker-compose restart
```

### Build et maintenance

```bash
# Reconstruire l'image
docker-compose build --no-cache

# Nettoyer les images inutilisées
docker system prune -a

# Voir l'utilisation des ressources
docker stats
```

## Configuration

### Changer le port

Pour changer le port sur lequel l'application est exposée, modifiez le fichier `docker-compose.yml` :

```yaml
ports:
  - "VOTRE_PORT:80"  # Remplacez VOTRE_PORT par le port désiré
```

### Variables d'environnement

Vous pouvez définir des variables d'environnement dans le fichier `docker-compose.yml` :

```yaml
environment:
  - NODE_ENV=production
  - VITE_API_URL=https://api.example.com  # Si vous avez une API externe
```

## Production

### Optimisations pour la production

L'image Docker de production inclut :

- ✅ Build multi-stage pour une taille d'image réduite
- ✅ Nginx optimisé pour servir les fichiers statiques
- ✅ Cache HTTP pour les assets (JS, CSS, images)
- ✅ Support du routing React (try_files)
- ✅ Compression gzip automatique
- ✅ Image Alpine Linux (légère)

### Taille de l'image

```bash
# Voir la taille de l'image
docker images trackly

# L'image finale fait environ 40-50 MB
```

### Déploiement

Pour déployer sur un serveur :

```bash
# 1. Cloner le repository
git clone <votre-repo>
cd trackly-time-focus

# 2. Construire l'image
docker-compose build

# 3. Démarrer l'application
docker-compose up -d

# 4. Vérifier le status
docker-compose ps
```

## Persistance des données

Trackly utilise IndexedDB pour stocker les données localement dans le navigateur. Les données sont donc persistées côté client, pas côté serveur.

Pour sauvegarder vos données :
1. Utilisez la fonctionnalité **Export** dans les paramètres
2. Conservez le fichier JSON généré
3. Utilisez la fonctionnalité **Import** pour restaurer vos données

## Résolution de problèmes

### Le conteneur ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs

# Vérifier que le port n'est pas déjà utilisé
netstat -tulpn | grep 8080

# Reconstruire l'image
docker-compose build --no-cache
docker-compose up -d
```

### L'application ne se charge pas

```bash
# Vérifier que Nginx fonctionne
docker exec trackly-app nginx -t

# Redémarrer Nginx
docker-compose restart
```

### Problème de permissions

```bash
# Donner les bonnes permissions
sudo chown -R $USER:$USER .

# Ou exécuter avec sudo
sudo docker-compose up -d
```

## Développement

### Hot Reload

En mode développement, les modifications de code sont automatiquement rechargées :

```bash
docker-compose --profile dev up trackly-dev
```

### Accéder au shell du conteneur

```bash
# Production (Nginx)
docker exec -it trackly-app sh

# Développement (Node)
docker exec -it trackly-dev sh
```

### Déboguer

```bash
# Voir les logs en temps réel
docker-compose logs -f trackly

# Mode développement avec logs
docker-compose --profile dev up trackly-dev
```

## Sécurité

### Bonnes pratiques

- ✅ L'image utilise des utilisateurs non-root
- ✅ Seul le port nécessaire est exposé
- ✅ Les fichiers sensibles sont exclus via .dockerignore
- ✅ Image basée sur Alpine Linux (moins de vulnérabilités)

### HTTPS

Pour activer HTTPS en production, utilisez un reverse proxy comme :
- Nginx Proxy Manager
- Traefik
- Caddy

Exemple avec Nginx Proxy Manager :
1. Lancez Trackly sur le port 8080
2. Configurez NPM pour rediriger HTTPS vers localhost:8080
3. NPM gère automatiquement les certificats Let's Encrypt

## Support

Pour toute question ou problème :
- GitHub Issues : [Créer une issue](https://github.com/votre-repo/issues)
- Documentation : Consultez le [README.md](./README.md)

#!/bin/sh
set -e

echo "========================================"
echo "   Trackly Backend - Docker Entrypoint"
echo "========================================"
echo ""
echo "Working directory: $(pwd)"
echo "Database path: $DATABASE_URL"
echo ""

# Créer le dossier data s'il n'existe pas
mkdir -p /app/data

# Lister le contenu pour debug
echo "Contenu de /app:"
ls -la /app/
echo ""
echo "Contenu de /app/drizzle:"
ls -la /app/drizzle/ 2>/dev/null || echo "Dossier drizzle non trouvé!"
echo ""

# Toujours exécuter les migrations
echo "========================================"
echo "Exécution des migrations..."
echo "========================================"
node dist/db/migrate.js
echo ""

# Vérifier si la base de données contient des utilisateurs
echo "Vérification des données..."
if node dist/db/check-and-seed.js; then
    echo "Base de données contient déjà des données."
else
    echo ""
    echo "========================================"
    echo "Exécution des seeders..."
    echo "========================================"
    node dist/db/seed.js

    echo ""
    echo "========================================"
    echo "Base de données initialisée!"
    echo "========================================"
    echo ""
    echo "Identifiants admin par défaut:"
    echo "  Utilisateur: admin"
    echo "  Mot de passe: bkxBF%.uYbeXQ83g"
    echo ""
fi

echo ""
echo "========================================"
echo "Démarrage du serveur sur le port $PORT..."
echo "========================================"
echo ""

# Démarrer le serveur
exec node dist/index.js

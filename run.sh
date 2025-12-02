#!/bin/bash

# Trackly - Script de gestion
# Usage: ./run.sh [commande]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Répertoire racine du projet
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

# Détection de docker compose (v2) ou docker-compose (v1)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE=""
fi

# Fonction d'affichage du header
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║           TRACKLY - Helper             ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Fonction d'affichage de l'aide
show_help() {
    print_header
    echo -e "${YELLOW}Usage:${NC} ./run.sh [commande]"
    echo ""
    echo -e "${GREEN}Commandes disponibles:${NC}"
    echo ""
    echo -e "  ${BLUE}=== Développement ===${NC}"
    echo "  dev             Démarre le frontend et backend en mode développement"
    echo "  dev:front       Démarre uniquement le frontend (port 8080)"
    echo "  dev:back        Démarre uniquement le backend (port 3001)"
    echo ""
    echo -e "  ${BLUE}=== Base de données ===${NC}"
    echo "  db:migrate      Exécute les migrations"
    echo "  db:seed         Exécute les seeders"
    echo "  db:reset        Supprime la DB et réexécute migrations + seeders"
    echo "  db:generate     Génère une nouvelle migration depuis le schéma"
    echo "  db:studio       Ouvre Drizzle Studio (interface graphique DB)"
    echo ""
    echo -e "  ${BLUE}=== Docker ===${NC}"
    echo "  docker:build    Construit les images Docker"
    echo "  docker:up       Démarre les containers Docker (production)"
    echo "  docker:down     Arrête les containers Docker"
    echo "  docker:restart  Rebuild et redémarre les containers"
    echo "  docker:reset    Reset complet (supprime volumes + rebuild)"
    echo "  docker:logs     Affiche les logs des containers"
    echo "  docker:dev      Démarre le backend en Docker (développement)"
    echo ""
    echo -e "  ${BLUE}=== Build ===${NC}"
    echo "  build           Build frontend et backend pour production"
    echo "  build:front     Build uniquement le frontend"
    echo "  build:back      Build uniquement le backend"
    echo ""
    echo -e "  ${BLUE}=== Installation ===${NC}"
    echo "  install         Installe toutes les dépendances"
    echo "  install:front   Installe les dépendances frontend"
    echo "  install:back    Installe les dépendances backend"
    echo ""
    echo -e "  ${BLUE}=== Utilitaires ===${NC}"
    echo "  lint            Lance le linter sur le frontend"
    echo "  clean           Nettoie les fichiers générés"
    echo "  help            Affiche cette aide"
    echo ""
    echo -e "${YELLOW}Exemples:${NC}"
    echo "  ./run.sh dev           # Démarre tout en mode développement"
    echo "  ./run.sh db:reset      # Réinitialise la base de données"
    echo "  ./run.sh docker:up     # Lance l'application via Docker"
    echo ""
}

# === Fonctions de développement ===

dev() {
    echo -e "${GREEN}Démarrage en mode développement...${NC}"
    echo -e "${YELLOW}Backend: http://localhost:3001${NC}"
    echo -e "${YELLOW}Frontend: http://localhost:8080${NC}"
    echo ""

    # Vérifier si les dépendances sont installées
    if [ ! -d "$SERVER_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installation des dépendances backend...${NC}"
        cd "$SERVER_DIR" && npm install
    fi

    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installation des dépendances frontend...${NC}"
        cd "$ROOT_DIR" && npm install
    fi

    # Vérifier si la DB existe
    if [ ! -f "$SERVER_DIR/data/trackly.db" ]; then
        echo -e "${YELLOW}Base de données non trouvée, initialisation...${NC}"
        db_reset
    fi

    # Démarrer backend en arrière-plan
    echo -e "${GREEN}Démarrage du backend...${NC}"
    cd "$SERVER_DIR" && npm run dev &
    BACKEND_PID=$!

    # Attendre que le backend soit prêt
    sleep 2

    # Démarrer frontend
    echo -e "${GREEN}Démarrage du frontend...${NC}"
    cd "$ROOT_DIR" && npm run dev

    # Arrêter le backend quand le frontend s'arrête
    kill $BACKEND_PID 2>/dev/null
}

dev_front() {
    echo -e "${GREEN}Démarrage du frontend...${NC}"
    cd "$ROOT_DIR" && npm run dev
}

dev_back() {
    echo -e "${GREEN}Démarrage du backend...${NC}"

    if [ ! -f "$SERVER_DIR/data/trackly.db" ]; then
        echo -e "${YELLOW}Base de données non trouvée, initialisation...${NC}"
        db_reset
    fi

    cd "$SERVER_DIR" && npm run dev
}

# === Fonctions de base de données ===

db_migrate() {
    echo -e "${GREEN}Exécution des migrations...${NC}"
    cd "$SERVER_DIR" && npm run db:migrate
    echo -e "${GREEN}Migrations terminées!${NC}"
}

db_seed() {
    echo -e "${GREEN}Exécution des seeders...${NC}"
    cd "$SERVER_DIR" && npm run db:seed
    echo -e "${GREEN}Seeders terminés!${NC}"
}

db_reset() {
    echo -e "${YELLOW}Réinitialisation de la base de données...${NC}"

    # Supprimer la DB existante
    rm -f "$SERVER_DIR/data/trackly.db"
    rm -f "$SERVER_DIR/data/trackly.db-journal"
    rm -f "$SERVER_DIR/data/trackly.db-wal"

    echo -e "${GREEN}Base de données supprimée${NC}"

    # Créer le dossier data si nécessaire
    mkdir -p "$SERVER_DIR/data"

    # Exécuter migrations et seeders
    db_migrate
    db_seed

    echo ""
    echo -e "${GREEN}Base de données réinitialisée avec succès!${NC}"
    echo -e "${YELLOW}Admin par défaut: admin / bkxBF%.uYbeXQ83g${NC}"
}

db_generate() {
    echo -e "${GREEN}Génération d'une nouvelle migration...${NC}"
    cd "$SERVER_DIR" && npm run db:generate
    echo -e "${GREEN}Migration générée!${NC}"
}

db_studio() {
    echo -e "${GREEN}Ouverture de Drizzle Studio...${NC}"
    cd "$SERVER_DIR" && npm run db:studio
}

# === Fonctions Docker ===

check_docker() {
    if [ -z "$DOCKER_COMPOSE" ]; then
        echo -e "${RED}Erreur: Docker Compose n'est pas installé.${NC}"
        echo -e "${YELLOW}Installez Docker Desktop ou docker-compose pour continuer.${NC}"
        exit 1
    fi
}

docker_build() {
    check_docker
    echo -e "${GREEN}Construction des images Docker...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE build
    echo -e "${GREEN}Images construites!${NC}"
}

docker_up() {
    check_docker
    echo -e "${GREEN}Démarrage des containers Docker...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE up -d
    echo ""
    echo -e "${GREEN}Containers démarrés!${NC}"
    echo -e "${YELLOW}Application disponible sur: http://localhost:8080${NC}"
}

docker_down() {
    check_docker
    echo -e "${GREEN}Arrêt des containers Docker...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE down
    echo -e "${GREEN}Containers arrêtés!${NC}"
}

docker_logs() {
    check_docker
    echo -e "${GREEN}Affichage des logs...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE logs -f
}

docker_dev() {
    check_docker
    echo -e "${GREEN}Démarrage du backend en Docker (développement)...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE -f docker-compose.dev.yml up -d
    echo ""
    echo -e "${GREEN}Backend démarré!${NC}"
    echo -e "${YELLOW}API disponible sur: http://localhost:3001${NC}"
    echo -e "${YELLOW}Lancez le frontend avec: ./run.sh dev:front${NC}"
}

docker_restart() {
    check_docker
    echo -e "${GREEN}Redémarrage complet des containers Docker...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE down
    cd "$ROOT_DIR" && $DOCKER_COMPOSE up --build -d
    echo ""
    echo -e "${GREEN}Containers redémarrés!${NC}"
    echo -e "${YELLOW}Application disponible sur: http://localhost:8080${NC}"
    echo ""
    echo -e "${CYAN}Voir les logs: ./run.sh docker:logs${NC}"
}

docker_reset() {
    check_docker
    echo -e "${YELLOW}Réinitialisation complète Docker (suppression des volumes)...${NC}"
    cd "$ROOT_DIR" && $DOCKER_COMPOSE down -v
    cd "$ROOT_DIR" && $DOCKER_COMPOSE up --build -d
    echo ""
    echo -e "${GREEN}Containers recréés avec nouvelle base de données!${NC}"
    echo -e "${YELLOW}Application disponible sur: http://localhost:8080${NC}"
    echo -e "${YELLOW}Admin: admin / bkxBF%.uYbeXQ83g${NC}"
}

# === Fonctions de build ===

build() {
    echo -e "${GREEN}Build complet (frontend + backend)...${NC}"
    build_front
    build_back
    echo -e "${GREEN}Build terminé!${NC}"
}

build_front() {
    echo -e "${GREEN}Build du frontend...${NC}"
    cd "$ROOT_DIR" && npm run build
    echo -e "${GREEN}Frontend buildé dans dist/${NC}"
}

build_back() {
    echo -e "${GREEN}Build du backend...${NC}"
    cd "$SERVER_DIR" && npm run build
    echo -e "${GREEN}Backend buildé dans server/dist/${NC}"
}

# === Fonctions d'installation ===

install_all() {
    echo -e "${GREEN}Installation de toutes les dépendances...${NC}"
    install_front
    install_back
    echo -e "${GREEN}Installation terminée!${NC}"
}

install_front() {
    echo -e "${GREEN}Installation des dépendances frontend...${NC}"
    cd "$ROOT_DIR" && npm install
}

install_back() {
    echo -e "${GREEN}Installation des dépendances backend...${NC}"
    cd "$SERVER_DIR" && npm install
}

# === Fonctions utilitaires ===

lint() {
    echo -e "${GREEN}Lancement du linter...${NC}"
    cd "$ROOT_DIR" && npm run lint
}

clean() {
    echo -e "${YELLOW}Nettoyage des fichiers générés...${NC}"

    # Frontend
    rm -rf "$ROOT_DIR/dist"
    rm -rf "$ROOT_DIR/node_modules"

    # Backend
    rm -rf "$SERVER_DIR/dist"
    rm -rf "$SERVER_DIR/node_modules"
    rm -f "$SERVER_DIR/data/trackly.db"
    rm -f "$SERVER_DIR/data/trackly.db-journal"
    rm -f "$SERVER_DIR/data/trackly.db-wal"

    echo -e "${GREEN}Nettoyage terminé!${NC}"
}

# === Menu interactif ===

interactive_menu() {
    print_header
    echo -e "${GREEN}Que souhaitez-vous faire?${NC}"
    echo ""
    echo "  1) Démarrer en mode développement"
    echo "  2) Réinitialiser la base de données"
    echo "  3) Démarrer avec Docker"
    echo "  4) Construire pour la production"
    echo "  5) Installer les dépendances"
    echo "  6) Afficher l'aide"
    echo "  0) Quitter"
    echo ""
    read -p "Votre choix: " choice

    case $choice in
        1) dev ;;
        2) db_reset ;;
        3) docker_up ;;
        4) build ;;
        5) install_all ;;
        6) show_help ;;
        0) exit 0 ;;
        *) echo -e "${RED}Choix invalide${NC}" ;;
    esac
}

# === Point d'entrée ===

case "${1:-}" in
    # Développement
    dev)          dev ;;
    dev:front)    dev_front ;;
    dev:back)     dev_back ;;

    # Base de données
    db:migrate)   db_migrate ;;
    db:seed)      db_seed ;;
    db:reset)     db_reset ;;
    db:generate)  db_generate ;;
    db:studio)    db_studio ;;

    # Docker
    docker:build)   docker_build ;;
    docker:up)      docker_up ;;
    docker:down)    docker_down ;;
    docker:restart) docker_restart ;;
    docker:reset)   docker_reset ;;
    docker:logs)    docker_logs ;;
    docker:dev)     docker_dev ;;

    # Build
    build)        build ;;
    build:front)  build_front ;;
    build:back)   build_back ;;

    # Installation
    install)      install_all ;;
    install:front) install_front ;;
    install:back) install_back ;;

    # Utilitaires
    lint)         lint ;;
    clean)        clean ;;
    help)         show_help ;;

    # Menu interactif si pas d'argument
    "")           interactive_menu ;;

    # Commande inconnue
    *)
        echo -e "${RED}Commande inconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

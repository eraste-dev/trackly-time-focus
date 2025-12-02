# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trackly is a time tracking application built with React, TypeScript, Vite, and shadcn/ui. The application allows users to track time spent on various projects, view statistics, and generate reports.

**Architecture**: Full-stack application with:
- **Frontend**: React/Vite SPA
- **Backend**: Express.js + Drizzle ORM + SQLite
- **Deployment**: Docker Compose

## Development Commands

### Frontend (root directory)

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Backend (server/ directory)

```bash
cd server

# Install dependencies
npm install

# Start development server (runs on http://localhost:3001)
npm run dev

# Database commands
npm run db:generate   # Generate migrations from schema changes
npm run db:migrate    # Apply migrations
npm run db:seed       # Seed initial data (admin user, sample project)
npm run db:studio     # Open Drizzle Studio (GUI for database)

# Build for production
npm run build
npm start
```

### Docker

```bash
# Production: Build and run both services
docker-compose up --build

# Development: Run only backend in Docker
docker-compose -f docker-compose.dev.yml up --build
# Then run frontend locally: npm run dev
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, TanStack Query
- **Backend**: Express.js, Drizzle ORM, better-sqlite3
- **Database**: SQLite (file-based, persisted in Docker volume)
- **Styling**: Tailwind CSS with CSS variables for theming

### Directory Structure

```
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── components/ui/      # shadcn/ui components (DO NOT edit)
│   ├── hooks/              # Custom React hooks (useProjects, useTimeEntries, etc.)
│   ├── lib/
│   │   ├── api.ts          # API client for backend communication
│   │   └── timeTracking.ts # Time utility functions
│   ├── pages/              # Route pages
│   └── contexts/           # React contexts
│
├── server/                 # Backend source
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts   # Drizzle schema definitions
│   │   │   ├── index.ts    # Database connection
│   │   │   ├── migrate.ts  # Migration runner
│   │   │   └── seed.ts     # Database seeder
│   │   ├── routes/         # Express route handlers
│   │   │   ├── projects.ts
│   │   │   ├── timeEntries.ts
│   │   │   ├── activeTimer.ts
│   │   │   └── users.ts
│   │   └── index.ts        # Express server entry
│   ├── drizzle/            # Generated migrations
│   └── data/               # SQLite database file (gitignored)
│
├── docker-compose.yml      # Production deployment
└── docker-compose.dev.yml  # Development (backend only)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET/POST/PUT/DELETE | `/api/projects` | Project CRUD |
| GET/POST/PUT/DELETE | `/api/time-entries` | Time entry CRUD |
| GET/POST | `/api/timer` | Active timer management |
| GET/POST/DELETE | `/api/users` | User management |
| POST | `/api/users/login` | Authentication |

### Database Schema

Tables defined in `server/src/db/schema.ts`:

- **projects**: `id, name, color, createdAt, plannedHoursPerDay`
- **time_entries**: `id, projectId, startTime, endTime, duration, description`
- **active_timer**: `id, projectId, startTime, isRunning, isPaused, pausedAt, totalPausedDuration`
- **users**: `id, username, password (hashed), role, createdAt, createdBy`

### Frontend Hooks

All data fetching uses TanStack Query for caching and reactivity:

- `useProjects()` - Project CRUD with automatic cache invalidation
- `useTimeEntries()` - Time entry CRUD with automatic cache invalidation
- `useActiveTimer()` - Timer state with polling for real-time updates

### Authentication

- Default admin: `admin` / `bkxBF%.uYbeXQ83g`
- Passwords are SHA-256 hashed
- Session stored in sessionStorage

## Database Migrations

When changing the schema:

1. Edit `server/src/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply
4. Commit the migration file in `server/drizzle/`

## Docker Deployment

The application runs as two containers:
- `trackly-backend`: Express API on port 3001 (internal)
- `trackly-frontend`: Nginx serving SPA on port 8080, proxies /api to backend

Data persists in `trackly-data` Docker volume.

## Important Notes

- Always use the `@/` path alias for imports
- Use hooks (`useProjects`, `useTimeEntries`) instead of direct API calls
- All API operations are async - use `await`
- UI text is in French (e.g., "Aujourd'hui", "Cette semaine")
- To reset database: Delete `server/data/trackly.db` and re-run migrations/seed

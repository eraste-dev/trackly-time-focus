# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trackly is a time tracking application built with React, TypeScript, Vite, and shadcn/ui. The application allows users to track time spent on various projects, view statistics, and generate reports. Data is persisted using Dexie.js (IndexedDB wrapper) for robust, scalable local storage.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Build Tool**: Vite with React SWC plugin
- **UI Framework**: React 18 with TypeScript
- **Routing**: React Router DOM v6
- **Component Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks + TanStack Query
- **Database**: Dexie.js v4 (IndexedDB wrapper) with React hooks
- **Notifications**: Sonner toast library

### Directory Structure

```
src/
├── components/           # Feature components (Timer, ProjectCard, etc.)
├── components/ui/        # shadcn/ui components (DO NOT edit manually)
├── hooks/               # Custom React hooks
│   ├── useProjects.ts   # Hook for project CRUD operations
│   ├── useTimeEntries.ts # Hook for time entry CRUD operations
│   └── use-toast.ts     # Toast notifications hook
├── lib/                 # Core utilities and business logic
│   ├── db.ts            # Dexie database configuration and migration
│   ├── timeTracking.ts  # Data models and time tracking utilities
│   └── utils.ts         # Tailwind cn() utility
├── pages/               # Route pages (Index, Projects, Reports, NotFound)
├── App.tsx              # Main app with routing and providers setup
├── main.tsx             # React entry point
└── index.css            # Global styles and Tailwind directives
```

### Core Data Models

Located in [src/lib/timeTracking.ts](src/lib/timeTracking.ts):

- **Project**: `{ id, name, color, createdAt }`
- **TimeEntry**: `{ id, projectId, startTime, endTime?, duration, description? }`

### Data Persistence (Dexie.js + IndexedDB)

**Database**: `TracklyDB` configured in [src/lib/db.ts](src/lib/db.ts)

**Tables**:
- `projects` - Indexed by: id, name, color, createdAt
- `timeEntries` - Indexed by: id, projectId, startTime, endTime, duration

**Key Features**:
- ✅ Reactive updates with `useLiveQuery` - components auto-update when data changes
- ✅ Automatic migration from localStorage on first launch
- ✅ ACID transactions for data integrity
- ✅ Hundreds of MB storage capacity (vs ~5-10 MB for localStorage)
- ✅ Asynchronous operations that don't block UI

**Custom Hooks**:
- `useProjects()` - CRUD operations for projects with real-time updates
- `useTimeEntries()` - CRUD operations for time entries with real-time updates

See [DEXIE_IMPLEMENTATION.md](DEXIE_IMPLEMENTATION.md) for detailed documentation.

### Routing

Routes defined in [src/App.tsx](src/App.tsx):
- `/` - Dashboard (Index page) with timer and today's stats
- `/projects` - Project management page
- `/reports` - Time tracking reports and analytics
- `*` - 404 Not Found page

All custom routes must be added ABOVE the catch-all `*` route.

### UI Components (shadcn/ui)

- Located in `src/components/ui/`
- Generated via shadcn CLI, DO NOT manually edit
- To add new components: use shadcn CLI (`npx shadcn@latest add <component>`)
- Styled using Tailwind with CSS variables from `src/index.css`
- Theme uses HSL color system with CSS custom properties

### Path Aliases

TypeScript path alias `@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)

Example: `import { Timer } from '@/components/Timer'`

### TypeScript Configuration

- `noImplicitAny: false` - Allows implicit any types
- `noUnusedParameters: false` - Doesn't enforce unused parameter checks
- `noUnusedLocals: false` - Doesn't enforce unused locals checks
- `strictNullChecks: false` - Relaxed null checking
- ESLint has `@typescript-eslint/no-unused-vars` disabled

### Styling

- Tailwind CSS with custom theme extensions in [tailwind.config.ts](tailwind.config.ts)
- Dark mode support via class strategy
- CSS variables for colors defined in `src/index.css`
- Use the `cn()` utility from `@/lib/utils` for conditional class merging

### Time Tracking Utilities

Key functions in [src/lib/timeTracking.ts](src/lib/timeTracking.ts):
- `formatDuration(seconds)` - Format as `HH:MM:SS` or `MM:SS`
- `formatDurationShort(seconds)` - Format as `Xh Ym` or `Xm`
- `calculateTotalDuration(entries)` - Sum durations from entries
- `getEntriesByPeriod(entries, 'day'|'week'|'month')` - Filter entries by time period

### Project Integration with Lovable

This project was created using Lovable (lovable.dev) and includes:
- `lovable-tagger` plugin in development mode for component tracking
- Automatic commits from Lovable will be synced to this repo
- Project URL: https://lovable.dev/projects/c65327da-598b-49e6-bb15-880fe91236df

## Important Notes

- Always use the `@/` path alias for imports from src directory
- When adding new pages, update both the routing in App.tsx AND add imports at the top
- **Data Access**: Always use `useProjects()` and `useTimeEntries()` hooks instead of accessing the database directly
- **Reactivity**: Data from hooks updates automatically via `useLiveQuery` - no need for manual state management
- All database operations are async - use `await` when calling CRUD functions
- The app uses French language for UI text (e.g., "Aujourd'hui", "Cette semaine")
- To reset the database: Open DevTools > Application > IndexedDB > Right-click TracklyDB > Delete

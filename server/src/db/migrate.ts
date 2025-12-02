import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || './data/trackly.db';

// Migrations folder relative to this file (goes up from dist/db to project root)
const migrationsFolder = process.env.MIGRATIONS_PATH || join(__dirname, '../../drizzle');

// Ensure data directory exists
const dataDir = dirname(DATABASE_URL);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log('Running migrations...');
console.log('Database:', DATABASE_URL);
console.log('Migrations folder:', migrationsFolder);

const sqlite = new Database(DATABASE_URL);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

migrate(db, { migrationsFolder });

console.log('Migrations completed successfully!');

sqlite.close();

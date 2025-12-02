import Database from 'better-sqlite3';
import { existsSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || './data/trackly.db';

async function checkAndSeed() {
  console.log('Vérification de la base de données...');
  console.log('Database:', DATABASE_URL);

  if (!existsSync(DATABASE_URL)) {
    console.log('Base de données non trouvée.');
    return false;
  }

  const sqlite = new Database(DATABASE_URL);

  try {
    // Check if users table exists and has data
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get();

    if (!tableExists) {
      console.log('Table users non trouvée.');
      sqlite.close();
      return false;
    }

    const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    console.log(`Nombre d'utilisateurs: ${userCount.count}`);

    if (userCount.count === 0) {
      console.log('Aucun utilisateur trouvé, seeding nécessaire.');
      sqlite.close();
      return false;
    }

    console.log('Base de données OK.');
    sqlite.close();
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    sqlite.close();
    return false;
  }
}

checkAndSeed().then((hasData) => {
  process.exit(hasData ? 0 : 1);
});

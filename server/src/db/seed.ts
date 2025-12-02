import { seedAdmin, seedProjects } from './seeders/index.js';

async function seed() {
  console.log('');
  console.log('========================================');
  console.log('       Trackly Database Seeder');
  console.log('========================================');
  console.log('');

  try {
    // Seed admin user
    await seedAdmin();

    // Seed sample projects
    await seedProjects();

    console.log('');
    console.log('========================================');
    console.log('       Seeding completed!');
    console.log('========================================');
    console.log('');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

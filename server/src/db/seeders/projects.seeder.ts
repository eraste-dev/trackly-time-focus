import { db } from '../index.js';
import { projects, timeEntries } from '../schema.js';

// Default sample projects
export const DEFAULT_PROJECTS = [
  {
    name: 'CITL',
    color: '#4f46e5',
    plannedHoursPerDay: 8,
  },
];

export async function seedProjects() {
  console.log('Seeding projects...');

  // Check if projects already exist
  const existingProjects = await db.query.projects.findMany();

  if (existingProjects.length > 0) {
    console.log(`  → ${existingProjects.length} project(s) already exist, skipping...`);
    return existingProjects;
  }

  const createdProjects = [];

  for (const projectData of DEFAULT_PROJECTS) {
    const projectId = crypto.randomUUID();

    await db.insert(projects).values({
      id: projectId,
      name: projectData.name,
      color: projectData.color,
      createdAt: new Date(),
      plannedHoursPerDay: projectData.plannedHoursPerDay,
    });

    console.log(`  → Created project: ${projectData.name}`);

    // Create sample time entry for this project
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    await db.insert(timeEntries).values({
      id: crypto.randomUUID(),
      projectId: projectId,
      startTime: startTime,
      endTime: now,
      duration: 2 * 60 * 60, // 2 hours in seconds
      description: 'Session de travail exemple',
    });

    console.log(`  → Created sample time entry for ${projectData.name}`);

    createdProjects.push({ id: projectId, ...projectData });
  }

  return createdProjects;
}

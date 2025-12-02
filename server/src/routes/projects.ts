import { Router } from 'express';
import { db } from '../db/index.js';
import { projects, timeEntries } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  plannedHoursPerDay: z.number().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  plannedHoursPerDay: z.number().nullable().optional(),
});

// Generate random color
function generateColor(): string {
  const colors = [
    '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
    '#2563eb', '#9333ea', '#c026d3', '#e11d48',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// GET /api/projects - List all projects
router.get('/', async (_req, res) => {
  try {
    const result = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const newProject = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color || generateColor(),
      createdAt: new Date(),
      plannedHoursPerDay: data.plannedHoursPerDay || null,
    };

    await db.insert(projects).values(newProject);
    res.status(201).json(newProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const data = updateProjectSchema.parse(req.body);

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.update(projects).set(data).where(eq(projects.id, req.params.id));

    const updated = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project (cascades to time entries)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete associated time entries first (for SQLite without cascade)
    await db.delete(timeEntries).where(eq(timeEntries.projectId, req.params.id));
    await db.delete(projects).where(eq(projects.id, req.params.id));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;

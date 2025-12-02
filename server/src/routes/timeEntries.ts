import { Router } from 'express';
import { db } from '../db/index.js';
import { timeEntries } from '../db/schema.js';
import { eq, desc, gte, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional(),
  duration: z.number().min(0),
  description: z.string().optional(),
});

const updateTimeEntrySchema = z.object({
  projectId: z.string().uuid().optional(),
  startTime: z.string().datetime().or(z.date()).optional(),
  endTime: z.string().datetime().or(z.date()).nullable().optional(),
  duration: z.number().min(0).optional(),
  description: z.string().nullable().optional(),
});

// Helper to get period start date
function getPeriodStart(period: 'day' | 'week' | 'month'): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return start;
}

// GET /api/time-entries - List all time entries
router.get('/', async (req, res) => {
  try {
    const { projectId, period } = req.query;

    let query = db.query.timeEntries.findMany({
      orderBy: [desc(timeEntries.startTime)],
      with: {
        project: true,
      },
    });

    // If filtering by project
    if (projectId && typeof projectId === 'string') {
      const result = await db.query.timeEntries.findMany({
        where: eq(timeEntries.projectId, projectId),
        orderBy: [desc(timeEntries.startTime)],
        with: {
          project: true,
        },
      });
      return res.json(result);
    }

    // If filtering by period
    if (period && ['day', 'week', 'month'].includes(period as string)) {
      const periodStart = getPeriodStart(period as 'day' | 'week' | 'month');
      const result = await db.query.timeEntries.findMany({
        where: gte(timeEntries.startTime, periodStart),
        orderBy: [desc(timeEntries.startTime)],
        with: {
          project: true,
        },
      });
      return res.json(result);
    }

    const result = await query;
    res.json(result);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// GET /api/time-entries/:id - Get single time entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, req.params.id),
      with: {
        project: true,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

// POST /api/time-entries - Create time entry
router.post('/', async (req, res) => {
  try {
    const data = createTimeEntrySchema.parse(req.body);

    const newEntry = {
      id: crypto.randomUUID(),
      projectId: data.projectId,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      duration: data.duration,
      description: data.description || null,
    };

    await db.insert(timeEntries).values(newEntry);

    const created = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, newEntry.id),
      with: {
        project: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', async (req, res) => {
  try {
    const data = updateTimeEntrySchema.parse(req.body);

    const existing = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const updates: Record<string, any> = {};
    if (data.projectId !== undefined) updates.projectId = data.projectId;
    if (data.startTime !== undefined) updates.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updates.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.description !== undefined) updates.description = data.description;

    await db.update(timeEntries).set(updates).where(eq(timeEntries.id, req.params.id));

    const updated = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, req.params.id),
      with: {
        project: true,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

export default router;

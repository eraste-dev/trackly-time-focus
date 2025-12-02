import { Router } from 'express';
import { db } from '../db/index.js';
import { activeTimer, timeEntries } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const TIMER_ID = 'active';

// Validation schema
const startTimerSchema = z.object({
  projectId: z.string().uuid(),
});

const updateTimerSchema = z.object({
  projectId: z.string().uuid().optional(),
  isPaused: z.boolean().optional(),
  pausedAt: z.string().datetime().nullable().optional(),
  totalPausedDuration: z.number().optional(),
});

// GET /api/timer - Get active timer
router.get('/', async (_req, res) => {
  try {
    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
      with: {
        project: true,
      },
    });

    res.json(timer || null);
  } catch (error) {
    console.error('Error fetching timer:', error);
    res.status(500).json({ error: 'Failed to fetch timer' });
  }
});

// POST /api/timer/start - Start timer
router.post('/start', async (req, res) => {
  try {
    const data = startTimerSchema.parse(req.body);

    // Check if timer already exists
    const existing = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
    });

    if (existing) {
      // Stop existing timer first, create time entry
      const endTime = new Date();
      const pausedDuration = existing.totalPausedDuration || 0;
      const duration = Math.floor((endTime.getTime() - existing.startTime.getTime()) / 1000) - pausedDuration;

      await db.insert(timeEntries).values({
        id: crypto.randomUUID(),
        projectId: existing.projectId,
        startTime: existing.startTime,
        endTime: endTime,
        duration: Math.max(0, duration),
        description: null,
      });

      await db.delete(activeTimer).where(eq(activeTimer.id, TIMER_ID));
    }

    // Start new timer
    const newTimer = {
      id: TIMER_ID,
      projectId: data.projectId,
      startTime: new Date(),
      isRunning: true,
      isPaused: false,
      pausedAt: null,
      totalPausedDuration: 0,
    };

    await db.insert(activeTimer).values(newTimer);

    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
      with: {
        project: true,
      },
    });

    res.status(201).json(timer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// POST /api/timer/stop - Stop timer and create time entry
router.post('/stop', async (_req, res) => {
  try {
    const existing = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
    });

    if (!existing) {
      return res.status(404).json({ error: 'No active timer' });
    }

    const endTime = new Date();
    const pausedDuration = existing.totalPausedDuration || 0;
    const duration = Math.floor((endTime.getTime() - existing.startTime.getTime()) / 1000) - pausedDuration;

    // Create time entry
    const newEntry = {
      id: crypto.randomUUID(),
      projectId: existing.projectId,
      startTime: existing.startTime,
      endTime: endTime,
      duration: Math.max(0, duration),
      description: null,
    };

    await db.insert(timeEntries).values(newEntry);
    await db.delete(activeTimer).where(eq(activeTimer.id, TIMER_ID));

    const entry = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, newEntry.id),
      with: {
        project: true,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// POST /api/timer/pause - Pause timer
router.post('/pause', async (_req, res) => {
  try {
    const existing = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
    });

    if (!existing) {
      return res.status(404).json({ error: 'No active timer' });
    }

    if (existing.isPaused) {
      return res.status(400).json({ error: 'Timer is already paused' });
    }

    await db.update(activeTimer).set({
      isPaused: true,
      pausedAt: new Date(),
    }).where(eq(activeTimer.id, TIMER_ID));

    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
      with: {
        project: true,
      },
    });

    res.json(timer);
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// POST /api/timer/resume - Resume timer
router.post('/resume', async (_req, res) => {
  try {
    const existing = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
    });

    if (!existing) {
      return res.status(404).json({ error: 'No active timer' });
    }

    if (!existing.isPaused) {
      return res.status(400).json({ error: 'Timer is not paused' });
    }

    const pausedAt = existing.pausedAt || new Date();
    const additionalPausedTime = Math.floor((Date.now() - pausedAt.getTime()) / 1000);
    const totalPausedDuration = (existing.totalPausedDuration || 0) + additionalPausedTime;

    await db.update(activeTimer).set({
      isPaused: false,
      pausedAt: null,
      totalPausedDuration: totalPausedDuration,
    }).where(eq(activeTimer.id, TIMER_ID));

    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
      with: {
        project: true,
      },
    });

    res.json(timer);
  } catch (error) {
    console.error('Error resuming timer:', error);
    res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// PUT /api/timer/project - Update timer project
router.put('/project', async (req, res) => {
  try {
    const { projectId } = startTimerSchema.parse(req.body);

    const existing = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
    });

    if (!existing) {
      return res.status(404).json({ error: 'No active timer' });
    }

    await db.update(activeTimer).set({
      projectId: projectId,
    }).where(eq(activeTimer.id, TIMER_ID));

    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.id, TIMER_ID),
      with: {
        project: true,
      },
    });

    res.json(timer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating timer project:', error);
    res.status(500).json({ error: 'Failed to update timer project' });
  }
});

export default router;

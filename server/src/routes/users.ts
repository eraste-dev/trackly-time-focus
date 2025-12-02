import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../db/seeders/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['admin', 'standard']).default('standard'),
  createdBy: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// GET /api/users - List all users (admin only - check on frontend)
router.get('/', async (_req, res) => {
  try {
    const result = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Remove passwords from response
    const sanitized = result.map(({ password, ...user }) => user);
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...sanitized } = user;
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create user
router.post('/', async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if username already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = hashPassword(data.password);

    const newUser = {
      id: crypto.randomUUID(),
      username: data.username,
      password: hashedPassword,
      role: data.role,
      createdAt: new Date(),
      createdBy: data.createdBy || null,
    };

    await db.insert(users).values(newUser);

    const { password, ...sanitized } = newUser;
    res.status(201).json(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/users/login - Login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hashedPassword = hashPassword(data.password);

    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password, ...sanitized } = user;
    res.json(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (existing.role === 'admin') {
      const adminCount = await db.query.users.findMany({
        where: eq(users.role, 'admin'),
      });

      if (adminCount.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await db.delete(users).where(eq(users.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;

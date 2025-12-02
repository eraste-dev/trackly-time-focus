import { db } from '../index.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Default admin credentials
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'bkxBF%.uYbeXQ83g',
  role: 'admin' as const,
};

// Hash password using SHA-256 (compatible with frontend)
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function seedAdmin() {
  console.log('Seeding admin user...');

  // Check if admin already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, DEFAULT_ADMIN.username),
  });

  if (existingAdmin) {
    console.log('  → Admin user already exists, skipping...');
    return existingAdmin;
  }

  // Create default admin user
  const adminPassword = hashPassword(DEFAULT_ADMIN.password);
  const adminId = crypto.randomUUID();

  await db.insert(users).values({
    id: adminId,
    username: DEFAULT_ADMIN.username,
    password: adminPassword,
    role: DEFAULT_ADMIN.role,
    createdAt: new Date(),
  });

  console.log(`  → Created admin user: ${DEFAULT_ADMIN.username}`);
  console.log(`  → Default password: ${DEFAULT_ADMIN.password}`);

  return { id: adminId, username: DEFAULT_ADMIN.username };
}

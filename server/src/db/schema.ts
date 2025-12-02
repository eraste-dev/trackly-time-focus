import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  plannedHoursPerDay: real('planned_hours_per_day'),
});

// Time entries table
export const timeEntries = sqliteTable('time_entries', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration').notNull().default(0),
  description: text('description'),
});

// Active timer table (singleton)
export const activeTimer = sqliteTable('active_timer', {
  id: text('id').primaryKey().default('active'),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  isRunning: integer('is_running', { mode: 'boolean' }).notNull().default(true),
  isPaused: integer('is_paused', { mode: 'boolean' }).default(false),
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  totalPausedDuration: integer('total_paused_duration').default(0),
});

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'standard'] }).notNull().default('standard'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by'),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
}));

export const activeTimerRelations = relations(activeTimer, ({ one }) => ({
  project: one(projects, {
    fields: [activeTimer.projectId],
    references: [projects.id],
  }),
}));

// Types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

export type ActiveTimer = typeof activeTimer.$inferSelect;
export type NewActiveTimer = typeof activeTimer.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

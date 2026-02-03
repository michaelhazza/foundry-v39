import { pgTable, serial, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { projects } from './projects.js';
import { processingJobs } from './processingJobs.js';

export const datasets = pgTable('datasets', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  processingJobId: integer('processing_job_id')
    .notNull()
    .references(() => processingJobs.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  format: text('format').notNull(),
  filePath: text('file_path').notNull(),
  recordCount: integer('record_count').notNull(),
  metadata: jsonb('metadata'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('datasets_project_idx').on(table.projectId),
  processingJobIdx: index('datasets_processing_job_idx').on(table.processingJobId),
}));

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;

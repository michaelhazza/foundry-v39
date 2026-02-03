import { pgTable, serial, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { dataSources } from './dataSources.js';

export const processingJobs = pgTable('processing_jobs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  dataSourceId: integer('data_source_id')
    .notNull()
    .references(() => dataSources.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  config: jsonb('config'),
  processedRecords: integer('processed_records').notNull().default(0),
  failedRecords: integer('failed_records').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dataSourceIdx: index('processing_jobs_data_source_idx').on(table.dataSourceId),
  statusIdx: index('processing_jobs_status_idx').on(table.status),
  organizationIdx: index('processing_jobs_organization_idx').on(table.organizationId),
}));

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;

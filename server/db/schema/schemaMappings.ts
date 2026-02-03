import { pgTable, serial, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { projects } from './projects.js';

export const schemaMappings = pgTable('schema_mappings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sourceSchema: text('source_schema').notNull(),
  targetSchema: text('target_schema').notNull(),
  fieldMappings: jsonb('field_mappings').notNull(),
  transformationRules: jsonb('transformation_rules'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('schema_mappings_project_idx').on(table.projectId),
}));

export type SchemaMapping = typeof schemaMappings.$inferSelect;
export type NewSchemaMapping = typeof schemaMappings.$inferInsert;

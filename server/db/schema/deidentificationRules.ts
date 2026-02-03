import { pgTable, serial, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { projects } from './projects.js';

export const deidentificationRules = pgTable('deidentification_rules', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  ruleName: text('rule_name').notNull(),
  piiType: text('pii_type').notNull(),
  detectionMethod: text('detection_method').notNull(),
  maskingStrategy: text('masking_strategy').notNull(),
  ruleConfig: jsonb('rule_config'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdx: index('deidentification_rules_project_idx').on(table.projectId),
}));

export type DeidentificationRule = typeof deidentificationRules.$inferSelect;
export type NewDeidentificationRule = typeof deidentificationRules.$inferInsert;

import { db } from '../db/index.js';
import { deidentificationRules } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export async function listRules(projectId: number, organizationId: number) {
  const data = await db
    .select()
    .from(deidentificationRules)
    .where(
      and(
        eq(deidentificationRules.projectId, projectId),
        eq(deidentificationRules.organizationId, organizationId)
      )
    )
    .orderBy(desc(deidentificationRules.createdAt));

  return data;
}

export async function createRule(
  projectId: number,
  organizationId: number,
  data: {
    ruleName: string;
    piiType: string;
    detectionMethod: string;
    maskingStrategy: string;
    ruleConfig?: Record<string, unknown>;
  }
) {
  const [inserted] = await db
    .insert(deidentificationRules)
    .values({
      projectId,
      organizationId,
      ruleName: data.ruleName,
      piiType: data.piiType,
      detectionMethod: data.detectionMethod,
      maskingStrategy: data.maskingStrategy,
      ruleConfig: data.ruleConfig,
    })
    .returning();

  return inserted;
}

export async function updateRule(
  id: number,
  projectId: number,
  organizationId: number,
  data: Partial<{
    ruleName: string;
    piiType: string;
    detectionMethod: string;
    maskingStrategy: string;
    ruleConfig: Record<string, unknown>;
  }>
) {
  const existing = await db
    .select()
    .from(deidentificationRules)
    .where(
      and(
        eq(deidentificationRules.id, id),
        eq(deidentificationRules.projectId, projectId),
        eq(deidentificationRules.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('Deidentification rule not found');
  }

  const [updated] = await db
    .update(deidentificationRules)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(deidentificationRules.id, id),
        eq(deidentificationRules.projectId, projectId),
        eq(deidentificationRules.organizationId, organizationId)
      )
    )
    .returning();

  return updated;
}

export async function deleteRule(
  id: number,
  projectId: number,
  organizationId: number
) {
  const existing = await db
    .select()
    .from(deidentificationRules)
    .where(
      and(
        eq(deidentificationRules.id, id),
        eq(deidentificationRules.projectId, projectId),
        eq(deidentificationRules.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('Deidentification rule not found');
  }

  const [deleted] = await db
    .delete(deidentificationRules)
    .where(
      and(
        eq(deidentificationRules.id, id),
        eq(deidentificationRules.projectId, projectId),
        eq(deidentificationRules.organizationId, organizationId)
      )
    )
    .returning();

  return deleted;
}

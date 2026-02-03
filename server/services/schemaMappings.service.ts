import { db } from '../db/index.js';
import { schemaMappings } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export async function getSchemaMapping(projectId: number, organizationId: number) {
  const results = await db
    .select()
    .from(schemaMappings)
    .where(
      and(
        eq(schemaMappings.projectId, projectId),
        eq(schemaMappings.organizationId, organizationId)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Schema mapping not found');
  }

  return results[0];
}

export async function createOrUpdateSchemaMapping(
  projectId: number,
  organizationId: number,
  data: {
    sourceSchema: string;
    targetSchema: string;
    fieldMappings: Record<string, unknown>;
    transformationRules?: Record<string, unknown>;
  }
) {
  const existing = await db
    .select()
    .from(schemaMappings)
    .where(
      and(
        eq(schemaMappings.projectId, projectId),
        eq(schemaMappings.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(schemaMappings)
      .set({
        sourceSchema: data.sourceSchema,
        targetSchema: data.targetSchema,
        fieldMappings: data.fieldMappings,
        transformationRules: data.transformationRules,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schemaMappings.projectId, projectId),
          eq(schemaMappings.organizationId, organizationId)
        )
      )
      .returning();

    return updated;
  }

  const [inserted] = await db
    .insert(schemaMappings)
    .values({
      projectId,
      organizationId,
      sourceSchema: data.sourceSchema,
      targetSchema: data.targetSchema,
      fieldMappings: data.fieldMappings,
      transformationRules: data.transformationRules,
    })
    .returning();

  return inserted;
}

export async function deleteSchemaMapping(
  id: number,
  projectId: number,
  organizationId: number
) {
  const results = await db
    .select()
    .from(schemaMappings)
    .where(
      and(
        eq(schemaMappings.id, id),
        eq(schemaMappings.projectId, projectId),
        eq(schemaMappings.organizationId, organizationId)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Schema mapping not found');
  }

  const [deleted] = await db
    .delete(schemaMappings)
    .where(
      and(
        eq(schemaMappings.id, id),
        eq(schemaMappings.projectId, projectId),
        eq(schemaMappings.organizationId, organizationId)
      )
    )
    .returning();

  return deleted;
}

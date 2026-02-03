import { db } from '../db/index.js';
import { dataSources } from '../db/schema/index.js';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export async function listDataSources(
  projectId: number,
  organizationId: number,
  opts: { page: number; pageSize: number; type?: string }
) {
  const offset = (opts.page - 1) * opts.pageSize;

  const conditions = [
    eq(dataSources.projectId, projectId),
    eq(dataSources.organizationId, organizationId),
    isNull(dataSources.deletedAt),
  ];

  if (opts.type) {
    conditions.push(eq(dataSources.type, opts.type));
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(dataSources)
      .where(whereClause)
      .limit(opts.pageSize)
      .offset(offset)
      .orderBy(desc(dataSources.createdAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(dataSources)
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
  };
}

export async function getDataSource(
  id: number,
  projectId: number,
  organizationId: number
) {
  const results = await db
    .select()
    .from(dataSources)
    .where(
      and(
        eq(dataSources.id, id),
        eq(dataSources.projectId, projectId),
        eq(dataSources.organizationId, organizationId),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Data source not found');
  }

  return results[0];
}

export async function uploadFile(
  projectId: number,
  organizationId: number,
  data: { name: string; filePath: string; recordCount?: number }
) {
  const [inserted] = await db
    .insert(dataSources)
    .values({
      projectId,
      organizationId,
      name: data.name,
      type: 'file_upload',
      filePath: data.filePath,
      recordCount: data.recordCount,
    })
    .returning();

  return inserted;
}

export async function createApiSource(
  projectId: number,
  organizationId: number,
  data: { name: string; apiProvider: string; connectionConfig: Record<string, unknown> }
) {
  const [inserted] = await db
    .insert(dataSources)
    .values({
      projectId,
      organizationId,
      name: data.name,
      type: data.apiProvider,
      connectionConfig: data.connectionConfig,
    })
    .returning();

  return inserted;
}

export async function updateDataSource(
  id: number,
  projectId: number,
  organizationId: number,
  data: Partial<{ name: string; connectionConfig: Record<string, unknown>; status: string; recordCount: number }>
) {
  await getDataSource(id, projectId, organizationId);

  const [updated] = await db
    .update(dataSources)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(dataSources.id, id),
        eq(dataSources.projectId, projectId),
        eq(dataSources.organizationId, organizationId)
      )
    )
    .returning();

  return updated;
}

export async function deleteDataSource(
  id: number,
  projectId: number,
  organizationId: number
) {
  await getDataSource(id, projectId, organizationId);

  const [deleted] = await db
    .update(dataSources)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(dataSources.id, id),
        eq(dataSources.projectId, projectId),
        eq(dataSources.organizationId, organizationId)
      )
    )
    .returning();

  return deleted;
}

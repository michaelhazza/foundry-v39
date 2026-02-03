import { db } from '../db/index.js';
import { datasets } from '../db/schema/index.js';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export async function listDatasets(
  projectId: number,
  organizationId: number,
  opts: { page: number; pageSize: number }
) {
  const offset = (opts.page - 1) * opts.pageSize;

  const whereClause = and(
    eq(datasets.projectId, projectId),
    eq(datasets.organizationId, organizationId),
    isNull(datasets.deletedAt)
  );

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(datasets)
      .where(whereClause)
      .limit(opts.pageSize)
      .offset(offset)
      .orderBy(desc(datasets.createdAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(datasets)
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
  };
}

export async function getDataset(
  id: number,
  projectId: number,
  organizationId: number
) {
  const results = await db
    .select()
    .from(datasets)
    .where(
      and(
        eq(datasets.id, id),
        eq(datasets.projectId, projectId),
        eq(datasets.organizationId, organizationId),
        isNull(datasets.deletedAt)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Dataset not found');
  }

  return results[0];
}

export async function deleteDataset(
  id: number,
  projectId: number,
  organizationId: number
) {
  await getDataset(id, projectId, organizationId);

  const [deleted] = await db
    .update(datasets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(datasets.id, id),
        eq(datasets.projectId, projectId),
        eq(datasets.organizationId, organizationId)
      )
    )
    .returning();

  return deleted;
}

export async function getDownloadPath(
  id: number,
  projectId: number,
  organizationId: number
) {
  const dataset = await getDataset(id, projectId, organizationId);
  return dataset.filePath;
}

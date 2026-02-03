import { db } from '../db/index.js';
import { processingJobs } from '../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export async function listJobs(
  projectId: number,
  organizationId: number,
  opts: { page: number; pageSize: number }
) {
  const offset = (opts.page - 1) * opts.pageSize;

  const whereClause = eq(processingJobs.organizationId, organizationId);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(processingJobs)
      .where(whereClause)
      .limit(opts.pageSize)
      .offset(offset)
      .orderBy(desc(processingJobs.createdAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(processingJobs)
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
  };
}

export async function getJob(id: number, organizationId: number) {
  const results = await db
    .select()
    .from(processingJobs)
    .where(
      and(
        eq(processingJobs.id, id),
        eq(processingJobs.organizationId, organizationId)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Processing job not found');
  }

  return results[0];
}

export async function createJob(
  organizationId: number,
  data: { dataSourceId: number; type: string; config?: Record<string, unknown> }
) {
  const [inserted] = await db
    .insert(processingJobs)
    .values({
      organizationId,
      dataSourceId: data.dataSourceId,
      type: data.type,
      config: data.config,
    })
    .returning();

  return inserted;
}

export async function cancelJob(id: number, organizationId: number) {
  await getJob(id, organizationId);

  const [updated] = await db
    .update(processingJobs)
    .set({
      status: 'failed',
      errorMessage: 'Cancelled by user',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processingJobs.id, id),
        eq(processingJobs.organizationId, organizationId)
      )
    )
    .returning();

  return updated;
}

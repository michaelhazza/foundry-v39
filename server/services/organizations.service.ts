import { db } from '../db/index.js';
import {
  organizations,
  users,
  userSessions,
  projects,
  dataSources,
  processingJobs,
  datasets,
} from '../db/schema/index.js';
import { NotFoundError } from '../errors/index.js';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function getCurrentOrganization(organizationId: number) {
  const results = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        isNull(organizations.deletedAt)
      )
    )
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('Organization not found');
  }

  return results[0];
}

export async function updateOrganization(
  organizationId: number,
  data: { name?: string; subscriptionTier?: string }
) {
  await getCurrentOrganization(organizationId);

  const updated = await db
    .update(organizations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  return updated[0];
}

export async function deleteOrganization(organizationId: number) {
  await getCurrentOrganization(organizationId);

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(datasets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(datasets.organizationId, organizationId));

    await tx
      .update(dataSources)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(dataSources.organizationId, organizationId));

    await tx
      .update(projects)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(projects.organizationId, organizationId));

    await tx
      .delete(userSessions)
      .where(
        sql`${userSessions.userId} IN (SELECT id FROM users WHERE organization_id = ${organizationId})`
      );

    await tx
      .delete(users)
      .where(eq(users.organizationId, organizationId));

    await tx
      .update(organizations)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(organizations.id, organizationId));
  });
}

export async function getOrganizationStats(organizationId: number) {
  await getCurrentOrganization(organizationId);

  const [projectCount, dataSourceCount, processingJobCount, datasetCount, userCount] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, organizationId),
            isNull(projects.deletedAt)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(dataSources)
        .where(
          and(
            eq(dataSources.organizationId, organizationId),
            isNull(dataSources.deletedAt)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(processingJobs)
        .where(eq(processingJobs.organizationId, organizationId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(datasets)
        .where(
          and(
            eq(datasets.organizationId, organizationId),
            isNull(datasets.deletedAt)
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.organizationId, organizationId)),
    ]);

  return {
    projects: Number(projectCount[0].count),
    dataSources: Number(dataSourceCount[0].count),
    processingJobs: Number(processingJobCount[0].count),
    datasets: Number(datasetCount[0].count),
    users: Number(userCount[0].count),
  };
}

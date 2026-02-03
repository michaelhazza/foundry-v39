import { db } from '../db/index.js';
import { projects, dataSources, datasets } from '../db/schema/index.js';
import type { Project } from '../db/schema/index.js';
import { NotFoundError } from '../errors/index.js';
import { eq, and } from 'drizzle-orm';
import { BaseService } from '../services/base.service.js';

export class ProjectsService extends BaseService<Project> {
  constructor() {
    super(projects, 'Project');
  }

  async listProjects(
    organizationId: number,
    opts: { page: number; pageSize: number }
  ) {
    return this.findAll({
      page: opts.page,
      pageSize: opts.pageSize,
      organizationId,
    });
  }

  async getProject(id: number, organizationId: number) {
    return this.findById(id, organizationId);
  }

  async createProject(
    organizationId: number,
    ownerId: number,
    data: { name: string; description?: string; targetSchema: string }
  ) {
    const inserted = await db
      .insert(projects)
      .values({
        organizationId,
        ownerId,
        name: data.name,
        description: data.description,
        targetSchema: data.targetSchema,
      })
      .returning();

    return inserted[0];
  }

  async updateProject(
    id: number,
    organizationId: number,
    data: { name?: string; description?: string; targetSchema?: string }
  ) {
    await this.findById(id, organizationId);

    const updated = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.organizationId, organizationId)
        )
      )
      .returning();

    return updated[0];
  }

  async deleteProject(id: number, organizationId: number) {
    await this.findById(id, organizationId);

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(datasets)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(datasets.projectId, id),
            eq(datasets.organizationId, organizationId)
          )
        );

      await tx
        .update(dataSources)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(dataSources.projectId, id),
            eq(dataSources.organizationId, organizationId)
          )
        );

      await tx
        .update(projects)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(projects.id, id),
            eq(projects.organizationId, organizationId)
          )
        );
    });
  }
}

export const projectsService = new ProjectsService();

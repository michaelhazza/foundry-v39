import { db } from '../db/index.js';
import { sql, eq, and, isNull, desc, asc } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export abstract class BaseService<T> {
  constructor(
    protected table: any,
    protected tableName: string
  ) {}

  async findAll(opts: {
    page: number;
    pageSize: number;
    organizationId: number;
    orderBy?: 'asc' | 'desc';
    orderColumn?: string;
  }) {
    const offset = (opts.page - 1) * opts.pageSize;
    const orderFn = opts.orderBy === 'asc' ? asc : desc;
    const orderCol = opts.orderColumn ? this.table[opts.orderColumn] : this.table.id;

    const whereClause = this.table.deletedAt
      ? and(
          eq(this.table.organizationId, opts.organizationId),
          isNull(this.table.deletedAt)
        )
      : eq(this.table.organizationId, opts.organizationId);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(this.table)
        .where(whereClause)
        .limit(opts.pageSize)
        .offset(offset)
        .orderBy(orderFn(orderCol)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(whereClause)
    ]);

    return {
      data,
      total: Number(countResult[0].count)
    };
  }

  async findById(id: number, organizationId: number) {
    const whereClause = this.table.deletedAt
      ? and(
          eq(this.table.id, id),
          eq(this.table.organizationId, organizationId),
          isNull(this.table.deletedAt)
        )
      : and(
          eq(this.table.id, id),
          eq(this.table.organizationId, organizationId)
        );

    const results = await db
      .select()
      .from(this.table)
      .where(whereClause)
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundError(`${this.tableName} not found`);
    }

    return results[0];
  }

  async softDelete(id: number, organizationId: number) {
    await this.findById(id, organizationId);

    return db
      .update(this.table)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.organizationId, organizationId)
        )
      )
      .returning();
  }
}

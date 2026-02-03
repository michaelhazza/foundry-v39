import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema/index.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'crypto';

export async function getCurrentUser(userId: number) {
  const results = await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (results.length === 0) {
    throw new NotFoundError('User not found');
  }

  return results[0];
}

export async function listUsers(
  organizationId: number,
  opts: { page: number; pageSize: number; role?: string }
) {
  const offset = (opts.page - 1) * opts.pageSize;

  const conditions = [eq(users.organizationId, organizationId)];
  if (opts.role) {
    conditions.push(eq(users.role, opts.role));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .limit(opts.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
  };
}

export async function updateUser(
  id: number,
  organizationId: number,
  data: { name?: string; role?: string }
) {
  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('User not found');
  }

  const updated = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
    .returning({
      id: users.id,
      organizationId: users.organizationId,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updated[0];
}

export async function deleteUser(id: number, organizationId: number) {
  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError('User not found');
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(userSessions)
      .where(eq(userSessions.userId, id));

    await tx
      .delete(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)));
  });
}

export async function inviteUser(
  organizationId: number,
  data: { email: string; role: string }
) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    throw new BadRequestError('A user with this email already exists');
  }

  const tempPassword = randomBytes(16).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(tempPassword, salt, 64).toString('hex') + ':' + salt;

  const inserted = await db
    .insert(users)
    .values({
      organizationId,
      email: data.email,
      role: data.role,
      passwordHash,
      emailVerified: false,
    })
    .returning({
      id: users.id,
      organizationId: users.organizationId,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return inserted[0];
}

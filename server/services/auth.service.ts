import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, organizations, userSessions } from '../db/schema/index.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../errors/index.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../lib/auth.js';

const SESSION_EXPIRY_DAYS = 30;

function sessionExpiresAt(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);
  return expires;
}

export class AuthService {
  async register({
    email,
    password,
    name,
    organizationName,
  }: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const refreshToken = generateRefreshToken();
    const hashedRefresh = await hashToken(refreshToken);

    const result = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name: organizationName })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: 'admin',
          organizationId: org.id,
        })
        .returning();

      const [session] = await tx
        .insert(userSessions)
        .values({
          userId: user.id,
          refreshToken: hashedRefresh,
          expiresAt: sessionExpiresAt(),
        })
        .returning();

      return { user, org, session };
    });

    const accessToken = generateAccessToken({
      userId: result.user.id,
      organizationId: result.org.id,
      role: result.user.role,
    });

    const { passwordHash: _, ...userWithoutPassword } = result.user;

    return {
      user: userWithoutPassword,
      organization: result.org,
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }: { email: string; password: string }) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const refreshToken = generateRefreshToken();
    const hashedRefresh = await hashToken(refreshToken);

    await db.insert(userSessions).values({
      userId: user.id,
      refreshToken: hashedRefresh,
      expiresAt: sessionExpiresAt(),
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const allSessions = await db.select().from(userSessions);

    let matchedSession = null;
    for (const session of allSessions) {
      const isMatch = await verifyPassword(refreshToken, session.refreshToken);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date() > matchedSession.expiresAt) {
      await db
        .delete(userSessions)
        .where(eq(userSessions.id, matchedSession.id));
      throw new UnauthorizedError('Refresh token has expired');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, matchedSession.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    await db
      .delete(userSessions)
      .where(eq(userSessions.id, matchedSession.id));

    const newRefreshToken = generateRefreshToken();
    const hashedRefresh = await hashToken(newRefreshToken);

    await db.insert(userSessions).values({
      userId: user.id,
      refreshToken: hashedRefresh,
      expiresAt: sessionExpiresAt(),
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: number, refreshToken: string) {
    const sessions = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));

    for (const session of sessions) {
      const isMatch = await verifyPassword(refreshToken, session.refreshToken);
      if (isMatch) {
        await db
          .delete(userSessions)
          .where(
            and(
              eq(userSessions.id, session.id),
              eq(userSessions.userId, userId)
            )
          );
        return;
      }
    }

    throw new UnauthorizedError('Invalid refresh token');
  }

  async forgotPassword(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Return silently to avoid leaking whether an email exists
      return;
    }

    const resetToken = generateRefreshToken();
    const hashedToken = await hashToken(resetToken);

    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    await db.insert(userSessions).values({
      userId: user.id,
      refreshToken: hashedToken,
      expiresAt: resetExpiry,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }

    return;
  }

  async resetPassword({ token, password }: { token: string; password: string }) {
    const allSessions = await db.select().from(userSessions);

    let matchedSession = null;
    for (const session of allSessions) {
      const isMatch = await verifyPassword(token, session.refreshToken);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    if (new Date() > matchedSession.expiresAt) {
      await db
        .delete(userSessions)
        .where(eq(userSessions.id, matchedSession.id));
      throw new BadRequestError('Reset token has expired');
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, matchedSession.userId));

    await db
      .delete(userSessions)
      .where(eq(userSessions.id, matchedSession.id));
  }
}

export const authService = new AuthService();

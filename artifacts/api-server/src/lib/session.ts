import crypto from "node:crypto";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "maakon_sid";
export const SESSION_MAX_AGE_DAYS = 30;

function buildSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function getSessionCookieOptions(
  overrides: CookieOptions = {},
): CookieOptions {
  return {
    ...buildSessionCookieOptions(),
    ...overrides,
  };
}

export function getSessionClearCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = buildSessionCookieOptions();
  return options;
}

/**
 * Creates a new session for a user and returns the token.
 */
export async function createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<string> {
  // 32 crypto-random bytes stored as 64 hex characters
  const token = crypto.randomBytes(32).toString("hex");
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_MAX_AGE_DAYS);

  await db.insert(sessionsTable).values({
    token,
    userId,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return token;
}

/**
 * Validates a session token and returns the full user object if valid.
 */
export async function validateSession(token: string) {
  const result = await db
    .select({ user: usersTable, session: sessionsTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(eq(sessionsTable.token, token))
    .limit(1);

  if (result.length === 0) {
    return null; // Session not found
  }

  const { user, session } = result[0];

  // Check expiration
  if (session.expiresAt.getTime() < Date.now()) {
    // Optionally clean up expired session async
    db.delete(sessionsTable).where(eq(sessionsTable.id, session.id)).execute().catch(() => {});
    return null;
  }

  return user;
}

/**
 * Deletes a session by token.
 */
export async function destroySession(token: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}

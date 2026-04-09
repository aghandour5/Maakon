/**
 * sessions — server-side session store for authenticated users.
 *
 * The session token is a 32-byte crypto-random value stored as hex.
 * It is delivered to the client as an httpOnly, secure, sameSite=lax cookie.
 * Session records are deleted on logout and expire after 30 days.
 */
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),

  // 64-char hex string (32 random bytes) — the value set in the cookie
  token: text("token").unique().notNull(),

  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  // Optional: stored for audit/security purposes only
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Step-up authentication status
  mfaVerified: boolean("mfa_verified").default(false).notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;

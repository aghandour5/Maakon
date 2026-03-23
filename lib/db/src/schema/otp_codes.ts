/**
 * otp_codes — stores one-time passcodes for phone-based authentication.
 *
 * Security properties:
 *  - code is stored as a SHA-256 hex hash (never plaintext)
 *  - expiresAt is 10 minutes from creation
 *  - attempts is incremented on each failed verify; records with attempts >= 5 are rejected
 *  - used is flipped to true on successful verification (no replay)
 */
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),

  // Phone in E.164 format, e.g. +96170123456
  phone: text("phone").notNull(),

  // SHA-256 hex of the 6-digit code — never store plaintext
  codeHash: text("code_hash").notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  // Number of failed verification attempts against this OTP record
  attempts: integer("attempts").default(0).notNull(),

  // Flipped to true once verified successfully (prevents replay)
  used: boolean("used").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;

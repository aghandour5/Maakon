import { pgTable, serial, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator"]);
export const accountTypeEnum = pgEnum("account_type", ["individual", "ngo"]);
export const userNgoVerificationStatusEnum = pgEnum("ngo_verification_status_user", [
  "pending",
  "verified",
  "rejected",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),

  // Supabase Auth UID
  supabaseUid: text("supabase_uid").unique(),

  // Email is now the primary auth identifier
  email: text("email").unique(),

  // Phone is optional — collected during NGO WhatsApp verification
  phone: text("phone").unique(),

  // Profile fields
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),

  accountType: accountTypeEnum("account_type").default("individual").notNull(),
  role: userRoleEnum("role").default("user").notNull(),

  // True once the user has completed post-login onboarding
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),

  // 3-layer trust model
  emailVerified: boolean("email_verified").default(false).notNull(),
  whatsappVerified: boolean("whatsapp_verified").default(false).notNull(),
  ngoVerificationStatus: userNgoVerificationStatusEnum("ngo_verification_status").default("pending"),
  
  // Multi-Factor Authentication (Admins)
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

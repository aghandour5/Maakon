/**
 * ngo_verification_requests — tracks NGO account verification applications.
 *
 * When a new NGO user completes onboarding, a record is inserted here with
 * status='pending'. An admin manually reviews and sets status to 'approved'
 * or 'rejected'. Approval does NOT automatically set a verifiedBadgeType on
 * posts — that is a separate admin action.
 */
import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const ngoVerificationStatusEnum = pgEnum("ngo_verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const ngoVerificationRequestsTable = pgTable("ngo_verification_requests", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  orgName: text("org_name").notNull(),
  description: text("description"),

  // Free-text field for the applicant to describe their supporting documents
  govDoc: text("gov_doc"),

  status: ngoVerificationStatusEnum("status").default("pending").notNull(),

  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  // Optional note from the admin reviewer
  reviewNote: text("review_note"),
});

export type NgoVerificationRequest = typeof ngoVerificationRequestsTable.$inferSelect;

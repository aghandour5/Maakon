import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { postsTable } from "./posts";

export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "dismissed", "actioned"]);
export const reportReasonEnum = pgEnum("report_reason", ["fake", "scam", "unsafe", "outdated", "spam", "other"]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => postsTable.id),
  reason: reportReasonEnum("reason").notNull(),
  details: text("details"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  status: reportStatusEnum("status").default("pending").notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  reportedAt: true,
  resolvedAt: true,
  status: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;

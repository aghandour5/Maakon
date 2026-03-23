import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTypeEnum = pgEnum("feedback_type", ["general", "bug", "feature", "complaint", "other"]);

export const feedbacksTable = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  type: feedbackTypeEnum("type").notNull(),
  name: text("name"),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacksTable.$inferSelect;

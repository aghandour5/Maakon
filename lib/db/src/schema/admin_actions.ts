import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const adminActionsTable = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => usersTable.id),
  targetType: text("target_type").notNull(), // 'post' | 'user' | 'ngo' | 'report'
  targetId: integer("target_id").notNull(),
  action: text("action").notNull(), // 'approve' | 'remove' | 'verify' | 'dismiss_report' | etc
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAdminActionSchema = createInsertSchema(adminActionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActionsTable.$inferSelect;

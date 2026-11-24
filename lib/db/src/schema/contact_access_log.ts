import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const contactAccessLogTable = pgTable("contact_access_log", {
  id: serial("id").primaryKey(),
  // Keep the audit entry when a user, organization or post is deleted.
  viewerUserId: integer("viewer_user_id").notNull(),
  ngoId: integer("ngo_id").notNull(),
  postId: integer("post_id").notNull(),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

import { pgTable, serial, text, timestamp, doublePrecision, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const postTypeEnum = pgEnum("post_type", ["need", "offer"]);
export const postStatusEnum = pgEnum("post_status", ["pending", "active", "hidden", "resolved", "expired", "removed"]);
export const urgencyEnum = pgEnum("urgency", ["critical", "high", "medium", "low"]);

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  postType: postTypeEnum("post_type").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  urgency: urgencyEnum("urgency"),
  governorate: text("governorate").notNull(),
  district: text("district"),

  // Public (fuzzed) coordinates — safe to return in API responses
  publicLat: doublePrecision("public_lat"),
  publicLng: doublePrecision("public_lng"),

  // Private exact coordinates — NEVER returned in public API responses
  privateLat: doublePrecision("private_lat"),
  privateLng: doublePrecision("private_lng"),

  // Private exact address — NEVER returned in public API responses
  exactAddressPrivate: text("exact_address_private"),

  providerType: text("provider_type"),
  verifiedBadgeType: text("verified_badge_type"),
  contactMethod: text("contact_method"),
  contactInfo: text("contact_info"),

  status: postStatusEnum("status").default("pending").notNull(),
  reportCount: integer("report_count").default(0).notNull(),

  userId: integer("user_id").references(() => usersTable.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reportCount: true,
});
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

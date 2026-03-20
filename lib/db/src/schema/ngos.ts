import { pgTable, serial, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ngosTable = pgTable("ngos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  governorate: text("governorate").notNull(),
  district: text("district"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  phone: text("phone"),
  website: text("website"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertNgoSchema = createInsertSchema(ngosTable).omit({ id: true, createdAt: true });
export type InsertNgo = z.infer<typeof insertNgoSchema>;
export type Ngo = typeof ngosTable.$inferSelect;

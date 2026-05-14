import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const seriesTable = pgTable("series", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  photographerName: text("photographer_name").notNull(),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Series = typeof seriesTable.$inferSelect;

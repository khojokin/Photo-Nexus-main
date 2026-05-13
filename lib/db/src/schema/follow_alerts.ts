import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const followAlertsTable = pgTable("follow_alerts", {
  id: serial("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  actorName: text("actor_name").notNull(),
  type: text("type").notNull().default("follow"),
  seriesId: integer("series_id"),
  seriesName: text("series_name"),
  photoId: integer("photo_id"),
  photoTitle: text("photo_title"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FollowAlert = typeof followAlertsTable.$inferSelect;

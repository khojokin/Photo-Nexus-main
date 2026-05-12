import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const followAlertsTable = pgTable("follow_alerts", {
  id: serial("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  actorName: text("actor_name").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FollowAlert = typeof followAlertsTable.$inferSelect;

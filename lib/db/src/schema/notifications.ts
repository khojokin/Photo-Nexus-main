import { pgTable, serial, text, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { photosTable } from "./photos";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientId: varchar("recipient_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'like' | 'comment'
  photoId: integer("photo_id").references(() => photosTable.id, { onDelete: "cascade" }),
  photoTitle: text("photo_title").notNull().default(""),
  actorName: text("actor_name").notNull().default("Someone"),
  commentBody: text("comment_body"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;

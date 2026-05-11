import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderName: text("sender_name").notNull(),
  recipientName: text("recipient_name").notNull(),
  content: text("content").notNull().default(""),
  read: boolean("read").notNull().default(false),
  photoId: integer("photo_id").references(() => photosTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;
export type InsertMessage = typeof messagesTable.$inferInsert;

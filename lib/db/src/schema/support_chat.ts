import { pgTable, serial, text, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

export const supportChatTable = pgTable("support_chat", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull().default("customer"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SupportChat = typeof supportChatTable.$inferSelect;
export type InsertSupportChat = typeof supportChatTable.$inferInsert;

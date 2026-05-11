import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { messagesTable } from "./messages";

export const messageReactionsTable = pgTable(
  "message_reactions",
  {
    messageId: integer("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    reactorName: text("reactor_name").notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.reactorName, t.emoji] })],
);

export type MessageReaction = typeof messageReactionsTable.$inferSelect;

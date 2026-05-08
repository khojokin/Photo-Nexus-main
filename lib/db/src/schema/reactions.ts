import { pgTable, text, timestamp, primaryKey, integer } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";

export const reactionsTable = pgTable(
  "reactions",
  {
    photoId: integer("photo_id").notNull().references(() => photosTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.photoId, t.actorId, t.emoji] })],
);

export type Reaction = typeof reactionsTable.$inferSelect;

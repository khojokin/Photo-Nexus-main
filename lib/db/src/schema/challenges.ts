import { pgTable, serial, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  theme: text("theme").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeEntriesTable = pgTable(
  "challenge_entries",
  {
    challengeId: integer("challenge_id").notNull().references(() => challengesTable.id, { onDelete: "cascade" }),
    photoId: integer("photo_id").notNull().references(() => photosTable.id, { onDelete: "cascade" }),
    submitterName: text("submitter_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.challengeId, t.photoId] })],
);

export type Challenge = typeof challengesTable.$inferSelect;
export type ChallengeEntry = typeof challengeEntriesTable.$inferSelect;

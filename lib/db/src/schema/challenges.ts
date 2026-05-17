import { pgTable, serial, text, timestamp, integer, varchar, primaryKey } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  theme: text("theme").notNull(),
  prize: text("prize"),
  rules: text("rules"),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeEntriesTable = pgTable(
  "challenge_entries",
  {
    id: serial("id").notNull(),
    challengeId: integer("challenge_id").notNull().references(() => challengesTable.id, { onDelete: "cascade" }),
    photoId: integer("photo_id").notNull().references(() => photosTable.id, { onDelete: "cascade" }),
    submitterName: text("submitter_name").notNull(),
    submittedByUserId: varchar("submitted_by_user_id"),
    photoTitle: text("photo_title"),
    photoImageUrl: text("photo_image_url"),
    votes: integer("votes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.challengeId, t.photoId] })],
);

export type Challenge = typeof challengesTable.$inferSelect;
export type ChallengeEntry = typeof challengeEntriesTable.$inferSelect;

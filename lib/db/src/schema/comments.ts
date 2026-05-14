import { pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";
import { usersTable } from "./auth";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photosTable.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Comment = typeof commentsTable.$inferSelect;

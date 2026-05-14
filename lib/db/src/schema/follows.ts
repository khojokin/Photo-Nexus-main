import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const followsTable = pgTable(
  "follows",
  {
    followerName: text("follower_name").notNull(),
    followingName: text("following_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.followerName, table.followingName] })]
);

export type Follow = typeof followsTable.$inferSelect;

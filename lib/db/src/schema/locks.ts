import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const locksTable = pgTable("locks", {
  id: serial("id").primaryKey(),
  lockType: text("lock_type").notNull(),
  targetId: text("target_id").notNull(),
  targetLabel: text("target_label").notNull(),
  reason: text("reason"),
  lockedBy: text("locked_by").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export type Lock = typeof locksTable.$inferSelect;
export type InsertLock = typeof locksTable.$inferInsert;

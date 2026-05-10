import { pgTable, serial, text, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

export const payoutsTable = pgTable("payouts", {
  id: serial("id").primaryKey(),
  payoutId: varchar("payout_id", { length: 32 }).notNull().unique(),
  photographerName: text("photographer_name").notNull(),
  email: text("email"),
  type: text("type").notNull().default("commission"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export type Payout = typeof payoutsTable.$inferSelect;
export type InsertPayout = typeof payoutsTable.$inferInsert;

import { pgTable, serial, text, numeric, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const payoutsTable = pgTable("payouts", {
  id: serial("id").primaryKey(),
  payoutId: varchar("payout_id", { length: 32 }).notNull().unique(),
  userId: varchar("user_id"),
  photographerName: text("photographer_name").notNull(),
  email: text("email"),
  type: text("type").notNull().default("commission"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("paypal"),
  paypalEmail: text("paypal_email"),
  bankName: text("bank_name"),
  bankAccountHolder: text("bank_account_holder"),
  bankAccountLast4: text("bank_account_last4"),
  bankRoutingLast4: text("bank_routing_last4"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export type Payout = typeof payoutsTable.$inferSelect;
export type InsertPayout = typeof payoutsTable.$inferInsert;

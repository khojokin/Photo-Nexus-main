import { pgTable, serial, text, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: varchar("referrer_user_id").notNull(),
  referrerName: text("referrer_name"),
  code: varchar("code", { length: 16 }).notNull().unique(),
  referredUserId: varchar("referred_user_id"),
  referredName: text("referred_name"),
  commissionEarned: numeric("commission_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
});

export type Referral = typeof referralsTable.$inferSelect;

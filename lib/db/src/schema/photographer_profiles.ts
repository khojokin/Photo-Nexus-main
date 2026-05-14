import { pgTable, varchar, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const photographerProfilesTable = pgTable("photographer_profiles", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  isQualifiedForPremium: boolean("is_qualified_for_premium").notNull().default(false),
  premiumEarningsTotal: numeric("premium_earnings_total", { precision: 10, scale: 2 }).notNull().default("0"),
  premiumEarningsPaid: numeric("premium_earnings_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PhotographerProfile = typeof photographerProfilesTable.$inferSelect;

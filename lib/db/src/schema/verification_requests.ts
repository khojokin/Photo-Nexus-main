import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const verificationRequestsTable = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  photographerName: text("photographer_name").notNull(),
  email: text("email"),
  portfolioUrl: text("portfolio_url"),
  instagramUrl: text("instagram_url"),
  website: text("website"),
  bio: text("bio"),
  photoCount: integer("photo_count").default(0),
  followerCount: integer("follower_count").default(0),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export type VerificationRequest = typeof verificationRequestsTable.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequestsTable.$inferInsert;

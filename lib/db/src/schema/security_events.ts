import { jsonb, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const securityEventsTable = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull().default("info"),
  ipAddress: text("ip_address"),
  userId: text("user_id"),
  userAgent: text("user_agent"),
  path: text("path"),
  method: text("method"),
  statusCode: integer("status_code"),
  message: text("message").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blockedIpsTable = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason").notNull(),
  blockedBy: text("blocked_by"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SecurityEvent = typeof securityEventsTable.$inferSelect;
export type BlockedIp = typeof blockedIpsTable.$inferInsert;

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { photosTable } from "./photos";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photosTable.id, { onDelete: "cascade" }),
  reporterName: text("reporter_name").notNull(),
  reason: text("reason").notNull(),
  body: text("body"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;

import { pgTable, serial, text, integer, boolean, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

export const downloadPacksTable = pgTable("download_packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("9.99"),
  createdByName: text("created_by_name").notNull(),
  createdByUserId: varchar("created_by_user_id"),
  photoIds: integer("photo_ids").array().notNull().default([]),
  coverImageUrl: text("cover_image_url"),
  isPublished: boolean("is_published").notNull().default(false),
  totalDownloads: integer("total_downloads").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const packPurchasesTable = pgTable("pack_purchases", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  buyerUserId: varchar("buyer_user_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DownloadPack = typeof downloadPacksTable.$inferSelect;
export type PackPurchase = typeof packPurchasesTable.$inferSelect;

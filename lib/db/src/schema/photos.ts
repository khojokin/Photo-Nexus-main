import { pgTable, text, serial, integer, boolean, timestamp, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  blurHash: text("blur_hash"),
  width: integer("width").notNull().default(1920),
  height: integer("height").notNull().default(1280),
  photographerName: text("photographer_name").notNull(),
  photographerAvatarUrl: text("photographer_avatar_url"),
  tags: text("tags").array().notNull().default([]),
  likes: integer("likes").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  views: integer("views").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isHomepageHero: boolean("is_homepage_hero").notNull().default(false),
  isPotdPinned: boolean("is_potd_pinned").notNull().default(false),
  pinUntilHero: timestamp("pin_until_hero", { withTimezone: true }),
  pinUntilPotd: timestamp("pin_until_potd", { withTimezone: true }),
  isPremiumOnly: boolean("is_premium_only").notNull().default(false),
  contentWarning: boolean("content_warning").notNull().default(false),
  uploadedBy: varchar("uploaded_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  seriesId: integer("series_id"),
  seriesPosition: integer("series_position"),
  camera: text("camera"),
  lens: text("lens"),
  aperture: text("aperture"),
  shutterSpeed: text("shutter_speed"),
  iso: integer("iso"),
  focalLength: text("focal_length"),
  license: text("license").notNull().default("cc0"),
  status: text("status").notNull().default("published"),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({
  id: true,
  likes: true,
  downloads: true,
  views: true,
  createdAt: true,
});

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;

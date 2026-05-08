import { pgTable, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { collectionsTable } from "./collections";
import { photosTable } from "./photos";

export const collectionPhotosTable = pgTable(
  "collection_photos",
  {
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
    photoId: integer("photo_id")
      .notNull()
      .references(() => photosTable.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.photoId] })],
);

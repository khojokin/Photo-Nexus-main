import { Router, type IRouter } from "express";
import { desc, sql, eq } from "drizzle-orm";
import { db, photosTable, collectionsTable, collectionPhotosTable } from "@workspace/db";
import {
  GetFeaturedPhotosResponse,
  GetTrendingPhotosResponse,
  GetSiteSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/hero", async (_req, res): Promise<void> => {
  const now = new Date();
  const [photo] = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.isHomepageHero, true))
    .limit(1);

  if (photo) {
    if (photo.pinUntilHero && photo.pinUntilHero < now) {
      await db.update(photosTable).set({ isHomepageHero: false, pinUntilHero: null }).where(eq(photosTable.id, photo.id));
      res.json(null);
      return;
    }
    res.json(photo);
    return;
  }

  res.json(null);
});

router.get("/stats/featured", async (_req, res): Promise<void> => {
  const photos = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.isFeatured, true))
    .orderBy(desc(photosTable.createdAt))
    .limit(8);

  res.json(GetFeaturedPhotosResponse.parse(photos));
});

router.get("/stats/trending", async (_req, res): Promise<void> => {
  const photos = await db
    .select()
    .from(photosTable)
    .orderBy(desc(sql`${photosTable.likes} + ${photosTable.downloads}`))
    .limit(12);

  res.json(GetTrendingPhotosResponse.parse(photos));
});

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [photoStats] = await db
    .select({
      totalPhotos: sql<number>`count(*)::int`,
      totalLikes: sql<number>`coalesce(sum(${photosTable.likes}), 0)::int`,
      totalDownloads: sql<number>`coalesce(sum(${photosTable.downloads}), 0)::int`,
    })
    .from(photosTable);

  const [collectionStats] = await db
    .select({
      totalCollections: sql<number>`count(*)::int`,
    })
    .from(collectionsTable);

  const tagCountResult = await db.execute(
    sql`SELECT count(DISTINCT tag)::int AS total FROM photos, unnest(tags) AS tag`
  );

  res.json(
    GetSiteSummaryResponse.parse({
      totalPhotos: photoStats?.totalPhotos ?? 0,
      totalLikes: photoStats?.totalLikes ?? 0,
      totalDownloads: photoStats?.totalDownloads ?? 0,
      totalCollections: collectionStats?.totalCollections ?? 0,
      totalTags: (tagCountResult.rows[0] as { total: number })?.total ?? 0,
    })
  );
});

export default router;

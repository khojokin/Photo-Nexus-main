import { Router } from "express";
import { sql, desc } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";

const router = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const metric = (req.query.metric as string) ?? "likes";

  const rows = await db
    .select({
      photographerName: photosTable.photographerName,
      photographerAvatarUrl: photosTable.photographerAvatarUrl,
      totalLikes: sql<number>`sum(${photosTable.likes})::int`,
      totalDownloads: sql<number>`sum(${photosTable.downloads})::int`,
      totalViews: sql<number>`sum(${photosTable.views})::int`,
      photoCount: sql<number>`count(*)::int`,
    })
    .from(photosTable)
    .where(sql`${photosTable.status} = 'published'`)
    .groupBy(photosTable.photographerName, photosTable.photographerAvatarUrl)
    .orderBy(
      metric === "downloads"
        ? desc(sql`sum(${photosTable.downloads})`)
        : metric === "views"
        ? desc(sql`sum(${photosTable.views})`)
        : desc(sql`sum(${photosTable.likes})`)
    )
    .limit(50);

  res.json({ leaderboard: rows });
});

export default router;

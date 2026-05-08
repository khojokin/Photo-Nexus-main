import { Router } from "express";
import { desc } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";

const router = Router();

router.get("/activity", async (_req, res): Promise<void> => {
  const recentPhotos = await db
    .select()
    .from(photosTable)
    .orderBy(desc(photosTable.createdAt))
    .limit(40);

  const events = recentPhotos.map((p) => ({
    type: "upload" as const,
    actorName: p.photographerName,
    photoId: p.id,
    photoTitle: p.title,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json({ events });
});

export default router;

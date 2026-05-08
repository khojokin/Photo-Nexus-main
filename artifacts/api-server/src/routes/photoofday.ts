import { Router } from "express";
import { desc, sql } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";

const router = Router();

router.get("/photo-of-the-day", async (_req, res): Promise<void> => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  const featured = await db
    .select()
    .from(photosTable)
    .where(sql`${photosTable.isFeatured} = true AND ${photosTable.status} = 'published'`)
    .orderBy(sql`(${photosTable.id} * ${seed}) % 999983`)
    .limit(1);

  if (featured.length > 0) {
    res.json({ photo: featured[0] });
    return;
  }

  const [fallback] = await db
    .select()
    .from(photosTable)
    .where(sql`${photosTable.status} = 'published'`)
    .orderBy(desc(sql`${photosTable.likes} + ${photosTable.downloads}`))
    .limit(1);

  res.json({ photo: fallback ?? null });
});

export default router;

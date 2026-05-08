import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, seriesTable, photosTable } from "@workspace/db";

const router = Router();

router.get("/series", async (_req, res): Promise<void> => {
  const series = await db.select().from(seriesTable).orderBy(desc(seriesTable.createdAt));
  res.json({ series });
});

router.post("/series", async (req, res): Promise<void> => {
  const { name, description, photographerName, coverImageUrl } = req.body as { name?: string; description?: string; photographerName?: string; coverImageUrl?: string };
  if (!name || !photographerName) { res.status(400).json({ error: "name and photographerName required" }); return; }

  const [s] = await db.insert(seriesTable).values({ name, description, photographerName, coverImageUrl }).returning();
  res.status(201).json(s);
});

router.get("/series/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [s] = await db.select().from(seriesTable).where(eq(seriesTable.id, id));
  if (!s) { res.status(404).json({ error: "Series not found" }); return; }

  const photos = await db.select().from(photosTable).where(eq(photosTable.seriesId, id)).orderBy(desc(photosTable.createdAt));
  res.json({ series: s, photos });
});

export default router;

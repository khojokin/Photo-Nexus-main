import { Router } from "express";
import { eq, desc, asc, sql, isNull } from "drizzle-orm";
import { db, seriesTable, photosTable } from "@workspace/db";
import { z } from "zod/v4";

const router = Router();

const IdParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/series", async (_req, res): Promise<void> => {
  const series = await db.select().from(seriesTable).orderBy(desc(seriesTable.createdAt));

  // Enrich with photo counts
  const counts = await db
    .select({ seriesId: photosTable.seriesId, count: sql<number>`count(*)::int` })
    .from(photosTable)
    .where(sql`${photosTable.seriesId} is not null`)
    .groupBy(photosTable.seriesId);

  const countMap = new Map(counts.map((c) => [c.seriesId, c.count]));
  const enriched = series.map((s) => ({ ...s, photoCount: countMap.get(s.id) ?? 0 }));

  res.json({ series: enriched });
});

router.post("/series", async (req, res): Promise<void> => {
  const { name, description, photographerName, coverImageUrl } = req.body as {
    name?: string; description?: string; photographerName?: string; coverImageUrl?: string;
  };
  if (!name || !photographerName) {
    res.status(400).json({ error: "name and photographerName required" });
    return;
  }
  const [s] = await db
    .insert(seriesTable)
    .values({ name, description: description ?? null, photographerName, coverImageUrl: coverImageUrl ?? null })
    .returning();
  res.status(201).json(s);
});

router.get("/series/:id", async (req, res): Promise<void> => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [s] = await db.select().from(seriesTable).where(eq(seriesTable.id, parsed.data.id));
  if (!s) { res.status(404).json({ error: "Series not found" }); return; }

  const photos = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.seriesId, parsed.data.id))
    .orderBy(
      sql`${photosTable.seriesPosition} asc nulls last`,
      asc(photosTable.createdAt),
    );

  res.json({ series: s, photos });
});

router.put("/series/:id", async (req, res): Promise<void> => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, description, coverImageUrl } = req.body as {
    name?: string; description?: string; coverImageUrl?: string;
  };

  const [s] = await db
    .update(seriesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
    })
    .where(eq(seriesTable.id, parsed.data.id))
    .returning();

  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  res.json(s);
});

router.delete("/series/:id", async (req, res): Promise<void> => {
  const parsed = IdParam.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  // Unset seriesId and seriesPosition on all member photos
  await db
    .update(photosTable)
    .set({ seriesId: null, seriesPosition: null })
    .where(eq(photosTable.seriesId, parsed.data.id));

  await db.delete(seriesTable).where(eq(seriesTable.id, parsed.data.id));
  res.status(204).end();
});

// Assign a photo to a series (or remove it)
router.patch("/series/:id/photos/:photoId", async (req, res): Promise<void> => {
  const idParsed = IdParam.safeParse(req.params);
  const photoIdParsed = z.object({ photoId: z.coerce.number().int().positive() }).safeParse(req.params);
  if (!idParsed.success || !photoIdParsed.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const { position } = req.body as { position?: number | null };

  await db
    .update(photosTable)
    .set({
      seriesId: idParsed.data.id,
      seriesPosition: position ?? null,
    })
    .where(eq(photosTable.id, photoIdParsed.data.photoId));

  res.json({ success: true });
});

// Remove a photo from its series
router.delete("/series/:id/photos/:photoId", async (req, res): Promise<void> => {
  const photoIdParsed = z.object({ photoId: z.coerce.number().int().positive() }).safeParse(req.params);
  if (!photoIdParsed.success) { res.status(400).json({ error: "Invalid photoId" }); return; }

  await db
    .update(photosTable)
    .set({ seriesId: null, seriesPosition: null })
    .where(eq(photosTable.id, photoIdParsed.data.photoId));

  res.json({ success: true });
});

export default router;

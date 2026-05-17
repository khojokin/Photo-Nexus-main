import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { downloadPacksTable, packPurchasesTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router = Router();

// GET /api/packs
router.get("/packs", async (_req, res): Promise<void> => {
  try {
    const packs = await db
      .select()
      .from(downloadPacksTable)
      .where(eq(downloadPacksTable.isPublished, true))
      .orderBy(desc(downloadPacksTable.createdAt));

    res.json({ packs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch packs" });
  }
});

// GET /api/packs/:id
router.get("/packs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [pack] = await db.select().from(downloadPacksTable).where(eq(downloadPacksTable.id, id));
    if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

    const photoIds = pack.photoIds ?? [];
    const photos = photoIds.length > 0
      ? await db.execute(sql`SELECT id, title, image_url, photographer_name, likes FROM photos WHERE id = ANY(${photoIds}::int[])`)
      : { rows: [] };

    res.json({ pack, photos: photos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pack" });
  }
});

// POST /api/packs — create a pack
router.post("/packs", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { name, description, price, photoIds, coverImageUrl } = req.body as {
    name?: string; description?: string; price?: number; photoIds?: number[]; coverImageUrl?: string;
  };
  if (!name || !photoIds?.length) { res.status(400).json({ error: "name and photoIds required" }); return; }

  const creatorName = (req.authUser as { displayName?: string; firstName?: string } | undefined)?.displayName
    ?? (req.authUser as { displayName?: string; firstName?: string } | undefined)?.firstName
    ?? "Photographer";

  try {
    const [pack] = await db.insert(downloadPacksTable).values({
      name,
      description: description ?? null,
      price: String(price ?? 9.99),
      createdByName: creatorName,
      createdByUserId: req.authUser!.id,
      photoIds: photoIds ?? [],
      coverImageUrl: coverImageUrl ?? null,
      isPublished: true,
    }).returning();

    res.status(201).json({ pack });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create pack" });
  }
});

// POST /api/packs/:id/purchase
router.post("/packs/:id/purchase", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const packId = parseInt(req.params.id);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [pack] = await db.select().from(downloadPacksTable).where(eq(downloadPacksTable.id, packId));
  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

  const { stripePaymentIntentId } = req.body as { stripePaymentIntentId?: string };

  try {
    const [purchase] = await db.insert(packPurchasesTable).values({
      packId,
      buyerUserId: req.authUser!.id,
      stripePaymentIntentId: stripePaymentIntentId ?? null,
      amount: pack.price,
    }).returning();

    await db.execute(sql`UPDATE download_packs SET total_downloads = total_downloads + 1 WHERE id = ${packId}`);

    res.status(201).json({ purchase, downloadUrl: `/api/packs/${packId}/download` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

// GET /api/analytics/my — photographer-specific stats
router.get("/analytics/my", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const name = (req.authUser as { displayName?: string; firstName?: string } | undefined)?.displayName
    ?? (req.authUser as { displayName?: string; firstName?: string } | undefined)?.firstName;

  if (!name) { res.json({ photos: [], totals: { views: 0, likes: 0, downloads: 0 } }); return; }

  try {
    const [totals, photos, daily] = await Promise.all([
      db.execute(sql`
        SELECT coalesce(sum(views),0)::int AS views, coalesce(sum(likes),0)::int AS likes,
               coalesce(sum(downloads),0)::int AS downloads, count(*)::int AS photos
        FROM photos WHERE photographer_name = ${name}
      `),
      db.execute(sql`
        SELECT id, title, image_url, views, likes, downloads, created_at
        FROM photos WHERE photographer_name = ${name}
        ORDER BY likes + downloads DESC LIMIT 20
      `),
      db.execute(sql`
        SELECT to_char(DATE(created_at AT TIME ZONE 'UTC'), 'Mon DD') AS label,
               DATE(created_at AT TIME ZONE 'UTC')::text AS date,
               coalesce(sum(views),0)::int AS views,
               coalesce(sum(likes),0)::int AS likes,
               coalesce(sum(downloads),0)::int AS downloads
        FROM photos WHERE photographer_name = ${name}
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY DATE(created_at AT TIME ZONE 'UTC') ASC
      `),
    ]);

    res.json({
      totals: totals.rows[0] ?? { views: 0, likes: 0, downloads: 0, photos: 0 },
      photos: photos.rows,
      daily: daily.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics unavailable" });
  }
});

export default router;

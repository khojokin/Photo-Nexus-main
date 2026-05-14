import { Router, type IRouter } from "express";
import { eq, desc, ilike, sql, or, and } from "drizzle-orm";
import { db, photosTable, notificationsTable, photographerProfilesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminMiddleware";
import {
  ListPhotosQueryParams,
  ListPhotosResponse,
  CreatePhotoBody,
  GetPhotoParams,
  GetPhotoResponse,
  DeletePhotoParams,
  LikePhotoParams,
  LikePhotoResponse,
  DownloadPhotoParams,
  DownloadPhotoResponse,
  UpdatePhotoParams,
  UpdatePhotoBody,
  UpdatePhotoResponse,
  GetMyPhotosQueryParams,
  GetMyPhotosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/photos", async (req, res): Promise<void> => {
  const parsed = ListPhotosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page, limit, tag, search, sort } = parsed.data;
  const offset = (page - 1) * limit;

  let whereClause = undefined;

  const searchCondition = search
    ? or(
        ilike(photosTable.title, `%${search}%`),
        ilike(photosTable.photographerName, `%${search}%`),
        sql`EXISTS (SELECT 1 FROM unnest(${photosTable.tags}) AS t WHERE t ILIKE ${'%' + search + '%'})`
      )
    : undefined;

  if (searchCondition && tag) {
    whereClause = and(
      searchCondition,
      sql`${photosTable.tags} @> ARRAY[${tag}]::text[]`
    );
  } else if (searchCondition) {
    whereClause = searchCondition;
  } else if (tag) {
    whereClause = sql`${photosTable.tags} @> ARRAY[${tag}]::text[]`;
  }

  let orderBy;
  if (sort === "popular") {
    orderBy = desc(photosTable.likes);
  } else if (sort === "trending") {
    orderBy = desc(sql`${photosTable.likes} + ${photosTable.downloads}`);
  } else {
    orderBy = desc(photosTable.createdAt);
  }

  const [photos, countResult] = await Promise.all([
    db
      .select()
      .from(photosTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(photosTable)
      .where(whereClause),
  ]);

  res.json(
    ListPhotosResponse.parse({
      photos,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    })
  );
});

router.post("/photos", async (req, res): Promise<void> => {
  const parsed = CreatePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const uploadedBy = req.authUser?.id ?? null;
  const [photo] = await db
    .insert(photosTable)
    .values({ ...parsed.data, uploadedBy })
    .returning();
  res.status(201).json(GetPhotoResponse.parse(photo));
});

router.get("/photos/:id", async (req, res): Promise<void> => {
  const params = GetPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [photo] = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.id, params.data.id));

  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  res.json(GetPhotoResponse.parse(photo));
});

router.patch("/photos/:id", async (req, res): Promise<void> => {
  const params = UpdatePhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePhotoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const userId = req.authUser?.id ?? null;
  const userEmail = (req.authUser?.email ?? "").toLowerCase();
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "kingsfordkojo7@gmail.com")
      .split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
  );
  const isAdmin = adminEmails.has(userEmail);
  if (!isAdmin && existing.uploadedBy && existing.uploadedBy !== userId) {
    res.status(403).json({ error: "You don't have permission to edit this photo" });
    return;
  }

  const [updated] = await db
    .update(photosTable)
    .set(body.data)
    .where(eq(photosTable.id, params.data.id))
    .returning();

  res.json(UpdatePhotoResponse.parse(updated));
});

router.delete("/photos/:id", async (req, res): Promise<void> => {
  const params = DeletePhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const userId = req.authUser?.id ?? null;
  const userEmail2 = (req.authUser?.email ?? "").toLowerCase();
  const adminEmails2 = new Set(
    (process.env.ADMIN_EMAILS ?? "kingsfordkojo7@gmail.com")
      .split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
  );
  const isAdmin2 = adminEmails2.has(userEmail2);
  if (!isAdmin2 && existing.uploadedBy && existing.uploadedBy !== userId) {
    res.status(403).json({ error: "You don't have permission to delete this photo" });
    return;
  }

  await db.delete(photosTable).where(eq(photosTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/photos/:id/set-potd", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const pinUntil = req.body?.pinUntil ? new Date(req.body.pinUntil as string) : null;

  await db.update(photosTable).set({ isPotdPinned: false, pinUntilPotd: null });

  const [photo] = await db
    .update(photosTable)
    .set({ isPotdPinned: true, pinUntilPotd: pinUntil })
    .where(eq(photosTable.id, id))
    .returning();

  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(photo);
});

router.delete("/photos/:id/set-potd", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [photo] = await db
    .update(photosTable)
    .set({ isPotdPinned: false, pinUntilPotd: null })
    .where(eq(photosTable.id, id))
    .returning();

  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(photo);
});

router.post("/photos/:id/set-hero", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const pinUntil = req.body?.pinUntil ? new Date(req.body.pinUntil as string) : null;

  await db.update(photosTable).set({ isHomepageHero: false, pinUntilHero: null });

  const [photo] = await db
    .update(photosTable)
    .set({ isHomepageHero: true, pinUntilHero: pinUntil })
    .where(eq(photosTable.id, id))
    .returning();

  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(photo);
});

router.delete("/photos/:id/set-hero", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [photo] = await db
    .update(photosTable)
    .set({ isHomepageHero: false, pinUntilHero: null })
    .where(eq(photosTable.id, id))
    .returning();

  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json(photo);
});

router.post("/photos/:id/like", async (req, res): Promise<void> => {
  const params = LikePhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [photo] = await db
    .update(photosTable)
    .set({ likes: sql`${photosTable.likes} + 1` })
    .where(eq(photosTable.id, params.data.id))
    .returning();

  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const user = req.authUser ?? null;
  const likerId = user?.id ?? null;
  if (photo.uploadedBy && photo.uploadedBy !== likerId) {
    const actorName = user
      ? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Someone")
      : "Someone";

    db.insert(notificationsTable).values({
      recipientId: photo.uploadedBy,
      type: "like",
      photoId: photo.id,
      photoTitle: photo.title,
      actorName,
    }).catch(() => { /* non-critical, swallow */ });
  }

  res.json(LikePhotoResponse.parse(photo));
});

router.post("/photos/:id/download", async (req, res): Promise<void> => {
  const params = DownloadPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(photosTable).where(eq(photosTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  if (existing.isPremiumOnly) {
    const user = req.authUser as { subscriptionStatus?: string; isAdmin?: boolean } | undefined;
    const isAdmin = !!(user as { isAdmin?: boolean } | undefined)?.isAdmin;
    const isPremium = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";
    if (!isAdmin && !isPremium) {
      res.status(403).json({ error: "premium_required", message: "This photo requires a Premium subscription to download." });
      return;
    }
  }

  const [photo] = await db
    .update(photosTable)
    .set({ downloads: sql`${photosTable.downloads} + 1` })
    .where(eq(photosTable.id, params.data.id))
    .returning();

  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  if (existing.isPremiumOnly && existing.uploadedBy) {
    db.insert(photographerProfilesTable)
      .values({ userId: existing.uploadedBy, premiumEarningsTotal: "0.10" })
      .onConflictDoUpdate({
        target: photographerProfilesTable.userId,
        set: { premiumEarningsTotal: sql`${photographerProfilesTable.premiumEarningsTotal} + 0.10` },
      })
      .catch(() => { /* non-critical */ });
  }

  res.json(DownloadPhotoResponse.parse(photo));
});

router.get("/photos/random", async (_req, res): Promise<void> => {
  const [photo] = await db
    .select()
    .from(photosTable)
    .where(sql`${photosTable.status} = 'published'`)
    .orderBy(sql`random()`)
    .limit(1);
  if (!photo) { res.status(404).json({ error: "No photos available" }); return; }
  res.json(photo);
});

router.post("/photos/:id/view", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(photosTable).set({ views: sql`${photosTable.views} + 1` }).where(eq(photosTable.id, id));
  res.json({ success: true });
});

router.get("/photos/:id/analytics", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [photo] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!photo) { res.status(404).json({ error: "Photo not found" }); return; }
  res.json({
    photoId: id,
    title: photo.title,
    likes: photo.likes,
    downloads: photo.downloads,
    views: photo.views,
    engagement: photo.likes + photo.downloads,
    score: photo.likes + photo.downloads * 2 + Math.floor(photo.views / 10),
  });
});

router.get("/users/me/photos", async (req, res): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = GetMyPhotosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const userId = req.authUser.id;

  const [photos, countResult] = await Promise.all([
    db
      .select()
      .from(photosTable)
      .where(eq(photosTable.uploadedBy, userId))
      .orderBy(desc(photosTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(photosTable)
      .where(eq(photosTable.uploadedBy, userId)),
  ]);

  res.json(
    GetMyPhotosResponse.parse({
      photos,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    })
  );
});

export default router;

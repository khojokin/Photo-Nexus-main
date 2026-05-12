import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { db, followsTable, notificationsTable, usersTable, photosTable, followAlertsTable } from "@workspace/db";
import { z } from "zod/v4";

const router: IRouter = Router();

const NameParams = z.object({ name: z.string().min(1).max(120) });
const FollowBody = z.object({ followerName: z.string().min(1).max(120) });

router.get("/photographers/:name/follow-stats", async (req: Request, res: Response): Promise<void> => {
  const params = NameParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid name" }); return; }

  const name = params.data.name;

  const [followerCountRow, followingCountRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followingName, name)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followerName, name)),
  ]);

  res.json({
    followerCount: followerCountRow[0]?.count ?? 0,
    followingCount: followingCountRow[0]?.count ?? 0,
  });
});

router.get("/photographers/:name/is-followed-by/:followerName", async (req: Request, res: Response): Promise<void> => {
  const params = z.object({ name: z.string().min(1), followerName: z.string().min(1) }).safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [row] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerName, params.data.followerName),
        eq(followsTable.followingName, params.data.name)
      )
    );

  res.json({ isFollowing: !!row });
});

router.post("/photographers/:name/follow", async (req: Request, res: Response): Promise<void> => {
  const params = NameParams.safeParse(req.params);
  const body = FollowBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const followingName = params.data.name;
  const followerName = body.data.followerName;

  if (followerName.toLowerCase() === followingName.toLowerCase()) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  await db
    .insert(followsTable)
    .values({ followerName, followingName })
    .onConflictDoNothing();

  // Always create a name-based follow alert (works without Replit Auth)
  db.insert(followAlertsTable)
    .values({ recipientName: followingName, actorName: followerName })
    .catch(() => { /* non-critical */ });

  // Also notify the followed user if they have a Replit Auth account
  const users = await db
    .select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable);

  const matched = users.find((u) => {
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return fullName.toLowerCase() === followingName.toLowerCase();
  });

  if (matched) {
    db.insert(notificationsTable)
      .values({
        recipientId: matched.id,
        type: "follow",
        photoId: null,
        photoTitle: "",
        actorName: followerName,
        commentBody: null,
      })
      .catch(() => { /* non-critical */ });
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingName, followingName));

  res.status(201).json({ followerCount: countRow?.count ?? 0 });
});

router.delete("/photographers/:name/follow", async (req: Request, res: Response): Promise<void> => {
  const params = NameParams.safeParse(req.params);
  const body = FollowBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const followingName = params.data.name;
  const followerName = body.data.followerName;

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.followerName, followerName),
        eq(followsTable.followingName, followingName)
      )
    );

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingName, followingName));

  res.json({ followerCount: countRow?.count ?? 0 });
});

router.get("/photographers/:name/followers", async (req: Request, res: Response): Promise<void> => {
  const params = NameParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid name" }); return; }

  const rows = await db
    .select({ name: followsTable.followerName, since: followsTable.createdAt })
    .from(followsTable)
    .where(eq(followsTable.followingName, params.data.name))
    .orderBy(desc(followsTable.createdAt));

  res.json({ list: rows });
});

router.get("/photographers/:name/following", async (req: Request, res: Response): Promise<void> => {
  const params = NameParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid name" }); return; }

  const rows = await db
    .select({ name: followsTable.followingName, since: followsTable.createdAt })
    .from(followsTable)
    .where(eq(followsTable.followerName, params.data.name))
    .orderBy(desc(followsTable.createdAt));

  res.json({ list: rows });
});

const SuggestedQuery = z.object({
  followerName: z.string().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

router.get("/photographers/suggested", async (req: Request, res: Response): Promise<void> => {
  const parsed = SuggestedQuery.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }

  const { followerName, limit } = parsed.data;

  // Fetch all published photos (capped for perf)
  const allPhotos = await db
    .select({
      id: photosTable.id,
      photographerName: photosTable.photographerName,
      tags: photosTable.tags,
      imageUrl: photosTable.imageUrl,
      likes: photosTable.likes,
    })
    .from(photosTable)
    .where(sql`${photosTable.status} = 'published'`)
    .limit(2000);

  // Group by photographer
  const byPhotographer = new Map<string, { tags: Set<string>; photoCount: number; sampleUrl: string; totalLikes: number }>();
  for (const photo of allPhotos) {
    const name = photo.photographerName;
    if (!byPhotographer.has(name)) {
      byPhotographer.set(name, { tags: new Set(), photoCount: 0, sampleUrl: photo.imageUrl, totalLikes: 0 });
    }
    const entry = byPhotographer.get(name)!;
    entry.photoCount++;
    entry.totalLikes += photo.likes;
    for (const tag of photo.tags) entry.tags.add(tag);
    // prefer a photo with more likes as the sample
    if (photo.likes > (byPhotographer.get(name)?.totalLikes ?? 0) / entry.photoCount) {
      entry.sampleUrl = photo.imageUrl;
    }
  }

  // Get who the user already follows
  let alreadyFollowing = new Set<string>();
  let tasteTags = new Set<string>();

  if (followerName) {
    const followedRows = await db
      .select({ followingName: followsTable.followingName })
      .from(followsTable)
      .where(eq(followsTable.followerName, followerName));

    for (const row of followedRows) {
      alreadyFollowing.add(row.followingName.toLowerCase());
      const entry = byPhotographer.get(row.followingName);
      if (entry) for (const tag of entry.tags) tasteTags.add(tag);
    }
  }

  // Get follower counts
  const followerCountRows = await db
    .select({
      followingName: followsTable.followingName,
      count: sql<number>`count(*)::int`,
    })
    .from(followsTable)
    .groupBy(followsTable.followingName);

  const followerCounts = new Map(followerCountRows.map((r) => [r.followingName.toLowerCase(), r.count]));

  // Score and rank candidates
  const candidates: Array<{
    name: string;
    topTags: string[];
    photoCount: number;
    followerCount: number;
    sampleImageUrl: string;
    score: number;
  }> = [];

  for (const [name, entry] of byPhotographer) {
    const nameLower = name.toLowerCase();
    if (followerName && nameLower === followerName.toLowerCase()) continue;
    if (alreadyFollowing.has(nameLower)) continue;

    const overlapCount = tasteTags.size > 0
      ? [...entry.tags].filter((t) => tasteTags.has(t)).length
      : 0;

    const followerCount = followerCounts.get(nameLower) ?? 0;
    const score = overlapCount * 4 + followerCount * 2 + entry.photoCount + entry.totalLikes * 0.1;

    const topTags = [...entry.tags].slice(0, 3);
    candidates.push({
      name,
      topTags,
      photoCount: entry.photoCount,
      followerCount,
      sampleImageUrl: entry.sampleUrl,
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  res.json({ suggestions: candidates.slice(0, limit) });
});

const FollowingFeedQuery = z.object({
  followerName: z.string().min(1).max(120),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/photos/following-feed", async (req: Request, res: Response): Promise<void> => {
  const parsed = FollowingFeedQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid followerName" });
    return;
  }

  const { followerName, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const followedRows = await db
    .select({ followingName: followsTable.followingName })
    .from(followsTable)
    .where(eq(followsTable.followerName, followerName));

  const followedNames = followedRows.map((r) => r.followingName);

  if (followedNames.length === 0) {
    res.json({ photos: [], total: 0, page, limit });
    return;
  }

  const [photos, countResult] = await Promise.all([
    db
      .select()
      .from(photosTable)
      .where(inArray(photosTable.photographerName, followedNames))
      .orderBy(desc(photosTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(photosTable)
      .where(inArray(photosTable.photographerName, followedNames)),
  ]);

  res.json({ photos, total: countResult[0]?.count ?? 0, page, limit });
});

export default router;

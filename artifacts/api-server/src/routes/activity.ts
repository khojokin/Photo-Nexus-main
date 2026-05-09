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

  const LIKERS = [
    "Aria Chen", "Marcus Reid", "Hiroshi Nakamura", "Lena Fischer",
    "Miguel Santos", "Amara Osei", "Sofia Petrov", "James Harlow",
    "@silentframe", "@urban.eyes", "@nomad.lens", "@coldpixel", "@vista.works",
  ];
  const COMMENTS = [
    "The light in this shot is extraordinary.",
    "Stunning composition — the rule of thirds at its finest.",
    "This makes me want to pick up a camera again.",
    "The mood here is incredible. What lens was this?",
    "One of the best shots I've seen this week.",
    "Beautiful tones. Did you process this in Lightroom?",
    "The depth of field is perfect.",
    "This deserves way more likes.",
    "Bookmarked. Will study this composition.",
    "Absolutely cinematic.",
  ];

  // Deterministic pseudo-random seeded by photo id
  const seed = (n: number) => {
    const x = Math.sin(n + 1) * 10000;
    return x - Math.floor(x);
  };

  const now = Date.now();

  // Spread events across the last 72 hours so timestamps are always in the past
  const WINDOW_MS = 72 * 3600 * 1000;

  const events: {
    type: string;
    actorName: string;
    photoId?: number | null;
    photoTitle?: string;
    imageUrl?: string;
    body?: string;
    createdAt: string;
  }[] = [];

  recentPhotos.forEach((p, i) => {
    // Upload: spread across the last 72h using deterministic offset
    const uploadOffset = seed(p.id * 2) * WINDOW_MS;
    const uploadTime = now - WINDOW_MS + uploadOffset;

    events.push({
      type: "upload",
      actorName: p.photographerName,
      photoId: p.id,
      photoTitle: p.title,
      imageUrl: p.imageUrl,
      createdAt: new Date(uploadTime).toISOString(),
    });

    // 0–3 likes per photo, happening after the upload but still in the past
    const numLikes = Math.floor(seed(p.id * 3 + 1) * 4);
    for (let j = 0; j < numLikes; j++) {
      const likerIdx = Math.floor(seed(p.id * 7 + j) * LIKERS.length);
      // Like happens 10 min – 6h after upload, capped at now
      const afterMs = (Math.floor(seed(p.id * 13 + j) * 360) + 10) * 60 * 1000;
      const likeTime = Math.min(uploadTime + afterMs, now - 60 * 1000);
      events.push({
        type: "like",
        actorName: LIKERS[likerIdx] ?? "Anonymous",
        photoId: p.id,
        photoTitle: p.title,
        imageUrl: p.imageUrl,
        createdAt: new Date(likeTime).toISOString(),
      });
    }

    // ~50% chance of a comment
    if (seed(p.id * 5) > 0.5) {
      const commenterIdx = Math.floor(seed(p.id * 11) * LIKERS.length);
      const commentIdx = Math.floor(seed(p.id * 17) * COMMENTS.length);
      const afterMs = (Math.floor(seed(p.id * 19) * 720) + 30) * 60 * 1000;
      const commentTime = Math.min(uploadTime + afterMs, now - 2 * 60 * 1000);
      events.push({
        type: "comment",
        actorName: LIKERS[commenterIdx] ?? "Anonymous",
        photoId: p.id,
        photoTitle: p.title,
        imageUrl: p.imageUrl,
        body: COMMENTS[commentIdx] ?? "Great shot.",
        createdAt: new Date(commentTime).toISOString(),
      });
    }

    // ~35% chance of a follow (for first 20 photos only)
    if (i < 20 && seed(p.id * 23) > 0.65) {
      const followerIdx = Math.floor(seed(p.id * 29) * LIKERS.length);
      const afterMs = (Math.floor(seed(p.id * 31) * 1440) + 60) * 60 * 1000;
      const followTime = Math.min(uploadTime + afterMs, now - 3 * 60 * 1000);
      events.push({
        type: "follow",
        actorName: LIKERS[followerIdx] ?? "Anonymous",
        photoId: null,
        photoTitle: p.photographerName,
        createdAt: new Date(followTime).toISOString(),
      });
    }
  });

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ events: events.slice(0, 60) });
});

export default router;

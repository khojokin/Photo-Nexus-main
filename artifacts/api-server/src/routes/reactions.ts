import { Router } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, reactionsTable, photosTable, notificationsTable } from "@workspace/db";
import { getCurrentAuthUser } from "../replitAuth";
import { pushUnreadCount } from "./notifications";

const router = Router();

router.get("/photos/:id/reactions", async (req, res): Promise<void> => {
  const photoId = parseInt(req.params.id, 10);
  if (isNaN(photoId)) { res.status(400).json({ error: "Invalid photo id" }); return; }

  const rows = await db
    .select({
      emoji: reactionsTable.emoji,
      count: sql<number>`count(*)::int`,
    })
    .from(reactionsTable)
    .where(eq(reactionsTable.photoId, photoId))
    .groupBy(reactionsTable.emoji);

  const actorId = getCurrentAuthUser(req)?.id ?? req.ip ?? "anon";
  const myRows = await db
    .select({ emoji: reactionsTable.emoji })
    .from(reactionsTable)
    .where(and(eq(reactionsTable.photoId, photoId), eq(reactionsTable.actorId, String(actorId))));
  const myEmojis = new Set(myRows.map((r) => r.emoji));

  res.json({ reactions: rows.map((r) => ({ emoji: r.emoji, count: r.count, mine: myEmojis.has(r.emoji) })) });
});

router.post("/photos/:id/reactions", async (req, res): Promise<void> => {
  const photoId = parseInt(req.params.id, 10);
  if (isNaN(photoId)) { res.status(400).json({ error: "Invalid photo id" }); return; }

  const { emoji } = req.body as { emoji?: string };
  if (!emoji) { res.status(400).json({ error: "emoji required" }); return; }

  const user = getCurrentAuthUser(req);
  const actorId = user?.id ?? req.ip ?? "anon";
  const actorName = user
    ? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Someone")
    : "Someone";

  const existing = await db
    .select()
    .from(reactionsTable)
    .where(and(eq(reactionsTable.photoId, photoId), eq(reactionsTable.actorId, String(actorId)), eq(reactionsTable.emoji, emoji)));

  if (existing.length > 0) {
    await db.delete(reactionsTable).where(
      and(eq(reactionsTable.photoId, photoId), eq(reactionsTable.actorId, String(actorId)), eq(reactionsTable.emoji, emoji))
    );
    res.json({ toggled: false });
  } else {
    await db.insert(reactionsTable).values({ photoId, actorId: String(actorId), emoji });

    const [photo] = await db
      .select({ uploadedBy: photosTable.uploadedBy, title: photosTable.title })
      .from(photosTable)
      .where(eq(photosTable.id, photoId));

    if (photo?.uploadedBy && photo.uploadedBy !== user?.id) {
      db.insert(notificationsTable).values({
        recipientId: photo.uploadedBy,
        type: "like",
        photoId,
        photoTitle: photo.title,
        actorName,
        commentBody: null,
      }).then(() => pushUnreadCount(photo.uploadedBy)).catch(() => { /* non-critical */ });
    }

    res.status(201).json({ toggled: true });
  }
});

export default router;

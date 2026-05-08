import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, commentsTable, photosTable, notificationsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const GetCommentsParams = z.object({ id: z.coerce.number().int().positive() });
const PostCommentBody = z.object({ body: z.string().min(1).max(1000) });
const DeleteCommentParams = z.object({ commentId: z.coerce.number().int().positive() });

router.get("/photos/:id/comments", async (req, res): Promise<void> => {
  const params = GetCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid photo id" });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.photoId, params.data.id))
    .orderBy(desc(commentsTable.createdAt));

  res.json({ comments });
});

router.post("/photos/:id/comments", async (req, res): Promise<void> => {
  const params = GetCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid photo id" });
    return;
  }

  const body = PostCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Comment body is required (max 1000 chars)" });
    return;
  }

  const user = req.authUser ?? null;
  const authorName = user
    ? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Anonymous")
    : "Anonymous";

  const [comment] = await db
    .insert(commentsTable)
    .values({
      photoId: params.data.id,
      authorId: user?.id ?? null,
      authorName,
      body: body.data.body,
    })
    .returning();

  const [photo] = await db
    .select({ uploadedBy: photosTable.uploadedBy, title: photosTable.title })
    .from(photosTable)
    .where(eq(photosTable.id, params.data.id));

  if (photo?.uploadedBy && photo.uploadedBy !== user?.id) {
    db.insert(notificationsTable).values({
      recipientId: photo.uploadedBy,
      type: "comment",
      photoId: params.data.id,
      photoTitle: photo.title,
      actorName: authorName,
      commentBody: body.data.body.slice(0, 120),
    }).catch(() => { /* non-critical, swallow */ });
  }

  res.status(201).json(comment);
});

router.delete("/photos/:id/comments/:commentId", async (req, res): Promise<void> => {
  const commentIdParsed = DeleteCommentParams.safeParse({ commentId: req.params.commentId });
  if (!commentIdParsed.success) {
    res.status(400).json({ error: "Invalid comment id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, commentIdParsed.data.commentId));

  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  const userId = req.authUser?.id ?? null;
  if (existing.authorId && existing.authorId !== userId) {
    res.status(403).json({ error: "You can only delete your own comments" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentIdParsed.data.commentId));
  res.sendStatus(204);
});

export default router;

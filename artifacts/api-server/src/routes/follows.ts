import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, followsTable, notificationsTable, usersTable } from "@workspace/db";
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

  // Best-effort: notify the followed user if they have an account
  // Match by firstName + lastName concatenation or just firstName
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

export default router;

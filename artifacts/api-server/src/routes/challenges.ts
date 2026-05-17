import { Router } from "express";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { challengesTable, challengeEntriesTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router = Router();

// GET /api/challenges
router.get("/challenges", async (_req, res): Promise<void> => {
  try {
    const challenges = await db
      .select({
        id: challengesTable.id,
        title: challengesTable.title,
        description: challengesTable.description,
        theme: challengesTable.theme,
        deadline: challengesTable.deadline,
        createdAt: challengesTable.createdAt,
        entryCount: sql<number>`(SELECT count(*) FROM challenge_entries WHERE challenge_id = ${challengesTable.id})::int`,
      })
      .from(challengesTable)
      .orderBy(desc(challengesTable.createdAt));

    res.json({ challenges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// GET /api/challenges/:id
router.get("/challenges/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
    if (!challenge) { res.status(404).json({ error: "Not found" }); return; }

    const entries = await db
      .select()
      .from(challengeEntriesTable)
      .where(eq(challengeEntriesTable.challengeId, id))
      .orderBy(desc(challengeEntriesTable.createdAt));

    res.json({ challenge, entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
});

// POST /api/challenges — create (admin only)
router.post("/challenges", requireAdmin, async (req, res): Promise<void> => {
  const { title, description, theme, deadline } = req.body as {
    title?: string; description?: string; theme?: string; deadline?: string;
  };
  if (!title || !theme) { res.status(400).json({ error: "title and theme required" }); return; }
  try {
    const [challenge] = await db.insert(challengesTable).values({
      title,
      description: description ?? "",
      theme,
      deadline: deadline ? new Date(deadline) : null,
    }).returning();
    res.status(201).json({ challenge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

// POST /api/challenges/:id/enter
router.post("/challenges/:id/enter", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const challengeId = parseInt(req.params.id);
  if (isNaN(challengeId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { photoId, photoTitle, photoImageUrl } = req.body as {
    photoId?: number; photoTitle?: string; photoImageUrl?: string;
  };
  if (!photoId) { res.status(400).json({ error: "photoId required" }); return; }

  const submitterName = (req.authUser as { displayName?: string; firstName?: string } | undefined)?.displayName
    ?? (req.authUser as { displayName?: string; firstName?: string } | undefined)?.firstName
    ?? "Anonymous";

  try {
    const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId));
    if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

    await db.insert(challengeEntriesTable).values({
      challengeId,
      photoId,
      submitterName,
      submittedByUserId: req.authUser?.id ?? null,
      photoTitle: photoTitle ?? null,
      photoImageUrl: photoImageUrl ?? null,
    } as typeof challengeEntriesTable.$inferInsert);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit entry" });
  }
});

// POST /api/challenges/:id/entries/:entryId/vote
router.post("/challenges/:id/entries/:entryId/vote", async (req, res): Promise<void> => {
  const entryId = parseInt(req.params.entryId);
  if (isNaN(entryId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.execute(sql`UPDATE challenge_entries SET votes = votes + 1 WHERE id = ${entryId}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to vote" });
  }
});

export default router;

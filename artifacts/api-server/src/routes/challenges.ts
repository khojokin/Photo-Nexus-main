import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, challengesTable, challengeEntriesTable, photosTable } from "@workspace/db";

const router = Router();

router.get("/challenges", async (_req, res): Promise<void> => {
  const challenges = await db
    .select({
      id: challengesTable.id,
      title: challengesTable.title,
      description: challengesTable.description,
      theme: challengesTable.theme,
      deadline: challengesTable.deadline,
      createdAt: challengesTable.createdAt,
      entryCount: sql<number>`count(${challengeEntriesTable.photoId})::int`,
    })
    .from(challengesTable)
    .leftJoin(challengeEntriesTable, eq(challengesTable.id, challengeEntriesTable.challengeId))
    .groupBy(challengesTable.id)
    .orderBy(desc(challengesTable.createdAt));

  res.json({ challenges });
});

router.post("/challenges", async (req, res): Promise<void> => {
  const { title, description, theme, deadline } = req.body as { title?: string; description?: string; theme?: string; deadline?: string };
  if (!title || !theme) { res.status(400).json({ error: "title and theme required" }); return; }

  const [challenge] = await db.insert(challengesTable).values({
    title,
    description,
    theme,
    deadline: deadline ? new Date(deadline) : undefined,
  }).returning();

  res.status(201).json({ ...challenge, entryCount: 0 });
});

router.get("/challenges/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id));
  if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

  const entries = await db
    .select({ photo: photosTable, submitterName: challengeEntriesTable.submitterName, entryCreatedAt: challengeEntriesTable.createdAt })
    .from(challengeEntriesTable)
    .innerJoin(photosTable, eq(challengeEntriesTable.photoId, photosTable.id))
    .where(eq(challengeEntriesTable.challengeId, id))
    .orderBy(desc(challengeEntriesTable.createdAt));

  res.json({ challenge, entries });
});

router.post("/challenges/:id/enter", async (req, res): Promise<void> => {
  const challengeId = parseInt(req.params.id, 10);
  if (isNaN(challengeId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { photoId, submitterName } = req.body as { photoId?: number; submitterName?: string };
  if (!photoId || !submitterName) { res.status(400).json({ error: "photoId and submitterName required" }); return; }

  await db.insert(challengeEntriesTable).values({ challengeId, photoId, submitterName }).onConflictDoNothing();
  res.status(201).json({ success: true });
});

export default router;

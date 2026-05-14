import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { locksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

const LOCK_TYPES = ["user", "photo", "collection", "account", "uploads", "comments"] as const;

const CreateLockBody = z.object({
  lockType: z.enum(LOCK_TYPES),
  targetId: z.string().min(1),
  targetLabel: z.string().min(1).max(200).optional(),
  reason: z.string().max(500).optional(),
  lockedBy: z.string().max(120).optional(),
});

const PatchLockBody = z.object({
  isActive: z.boolean(),
});

router.get("/locks", requireAdmin, async (_req, res): Promise<void> => {
  const locks = await db
    .select()
    .from(locksTable)
    .orderBy(desc(locksTable.lockedAt));
  res.json({ locks });
});

router.get("/locks/check/:type/:id", async (req, res): Promise<void> => {
  const { type, id } = req.params;
  const [lock] = await db
    .select()
    .from(locksTable)
    .where(
      and(
        eq(locksTable.lockType, type),
        eq(locksTable.targetId, id),
        eq(locksTable.isActive, true)
      )
    )
    .limit(1);
  res.json({ locked: Boolean(lock), lock: lock ?? null });
});

router.post("/locks", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateLockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  const adminEmail = req.authUser?.email ?? parsed.data.lockedBy ?? "admin";
  const [lock] = await db
    .insert(locksTable)
    .values({
      lockType: parsed.data.lockType,
      targetId: parsed.data.targetId,
      targetLabel: parsed.data.targetLabel ?? parsed.data.targetId,
      reason: parsed.data.reason,
      lockedBy: adminEmail,
    })
    .returning();

  res.status(201).json(lock);
});

router.patch("/locks/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = PatchLockBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [updated] = await db
    .update(locksTable)
    .set({
      isActive: parsed.data.isActive,
      unlockedAt: parsed.data.isActive ? null : new Date(),
    })
    .where(eq(locksTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/locks/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(locksTable).where(eq(locksTable.id, id));
  res.sendStatus(204);
});

export default router;

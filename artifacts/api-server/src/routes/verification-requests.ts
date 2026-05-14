import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { verificationRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

const SubmitBody = z.object({
  photographerName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().max(1000).optional(),
  photoCount: z.number().int().min(0).optional(),
  followerCount: z.number().int().min(0).optional(),
  reason: z.string().min(10).max(1000),
});

const ReviewBody = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(500).optional(),
});

router.get("/verification-requests", requireAdmin, async (_req, res): Promise<void> => {
  const requests = await db
    .select()
    .from(verificationRequestsTable)
    .orderBy(desc(verificationRequestsTable.submittedAt));
  res.json({ requests });
});

router.get("/verification-requests/my", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const requests = await db
    .select()
    .from(verificationRequestsTable)
    .where(eq(verificationRequestsTable.userId, req.authUser.id))
    .orderBy(desc(verificationRequestsTable.submittedAt));
  res.json({ requests });
});

router.post("/verification-requests", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const parsed = SubmitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  const existing = await db
    .select()
    .from(verificationRequestsTable)
    .where(eq(verificationRequestsTable.userId, req.authUser.id))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "pending") {
    res.status(409).json({ error: "You already have a pending verification request." });
    return;
  }

  const [request] = await db
    .insert(verificationRequestsTable)
    .values({
      userId: req.authUser.id,
      ...parsed.data,
      email: parsed.data.email ?? req.authUser.email ?? undefined,
    })
    .returning();

  res.status(201).json({ request });
});

router.patch("/verification-requests/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const adminEmail = req.authUser?.email ?? "admin";
  const [updated] = await db
    .update(verificationRequestsTable)
    .set({
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      reviewedBy: adminEmail,
      reviewedAt: new Date(),
    })
    .where(eq(verificationRequestsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ request: updated });
});

router.delete("/verification-requests/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(verificationRequestsTable).where(eq(verificationRequestsTable.id, id));
  res.sendStatus(204);
});

export default router;

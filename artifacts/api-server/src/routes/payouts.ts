import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { payoutsTable, photographerProfilesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

function generatePayoutId(): string {
  return "PAY-" + randomBytes(4).toString("hex").toUpperCase();
}

const UserPayoutRequestBody = z.object({
  photographerName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  type: z.enum(["commission", "license", "print", "tip", "withdrawal"]).default("withdrawal"),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  paymentMethod: z.enum(["paypal", "bank_transfer"]).default("paypal"),
  paypalEmail: z.string().email().optional(),
  bankName: z.string().max(120).optional(),
  bankAccountHolder: z.string().max(120).optional(),
  bankAccountLast4: z.string().length(4).optional(),
  bankRoutingLast4: z.string().length(4).optional(),
  notes: z.string().max(500).optional(),
});

const AdminCreatePayoutBody = z.object({
  photographerName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  type: z.enum(["commission", "license", "print", "tip", "withdrawal"]).default("commission"),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  paymentMethod: z.enum(["paypal", "bank_transfer"]).default("paypal"),
  paypalEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
});

const UpdatePayoutBody = z.object({
  status: z.enum(["pending", "approved", "paid", "rejected"]),
  adminNotes: z.string().max(500).optional(),
});

router.get("/payouts", async (_req, res): Promise<void> => {
  const payouts = await db
    .select()
    .from(payoutsTable)
    .orderBy(desc(payoutsTable.requestedAt));
  res.json({ payouts });
});

router.get("/payouts/my", async (req, res): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payouts = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.userId, req.authUser.id))
    .orderBy(desc(payoutsTable.requestedAt));
  res.json({ payouts });
});

router.post("/payouts/request", async (req, res): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = UserPayoutRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  const [payout] = await db
    .insert(payoutsTable)
    .values({
      ...parsed.data,
      userId: req.authUser.id,
      payoutId: generatePayoutId(),
      amount: String(parsed.data.amount),
    })
    .returning();

  res.status(201).json(payout);
});

router.post("/payouts", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreatePayoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [payout] = await db
    .insert(payoutsTable)
    .values({
      ...parsed.data,
      payoutId: generatePayoutId(),
      amount: String(parsed.data.amount),
    })
    .returning();

  res.status(201).json(payout);
});

router.patch("/payouts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdatePayoutBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [updated] = await db
    .update(payoutsTable)
    .set({
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      processedAt: parsed.data.status !== "pending" ? new Date() : null,
    })
    .where(eq(payoutsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  if (parsed.data.status === "paid" && updated.userId && updated.type === "withdrawal") {
    db.insert(photographerProfilesTable)
      .values({ userId: updated.userId, premiumEarningsPaid: updated.amount })
      .onConflictDoUpdate({
        target: photographerProfilesTable.userId,
        set: { premiumEarningsPaid: sql`${photographerProfilesTable.premiumEarningsPaid} + ${updated.amount}` },
      })
      .catch(() => { /* non-critical */ });
  }

  res.json(updated);
});

router.delete("/payouts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(payoutsTable).where(eq(payoutsTable.id, id));
  res.sendStatus(204);
});

export default router;

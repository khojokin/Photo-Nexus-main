import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { payoutsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generatePayoutId(): string {
  return "PAY-" + randomBytes(4).toString("hex").toUpperCase();
}

const CreatePayoutBody = z.object({
  photographerName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  type: z.enum(["commission", "license", "print", "tip"]).default("commission"),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  notes: z.string().max(500).optional(),
});

const UpdatePayoutBody = z.object({
  status: z.enum(["pending", "paid", "rejected"]),
  notes: z.string().max(500).optional(),
});

router.get("/payouts", async (_req, res): Promise<void> => {
  const payouts = await db
    .select()
    .from(payoutsTable)
    .orderBy(desc(payoutsTable.requestedAt));
  res.json({ payouts });
});

router.post("/payouts", async (req, res): Promise<void> => {
  const parsed = CreatePayoutBody.safeParse(req.body);
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

router.patch("/payouts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdatePayoutBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [updated] = await db
    .update(payoutsTable)
    .set({
      status: parsed.data.status,
      notes: parsed.data.notes,
      processedAt: parsed.data.status !== "pending" ? new Date() : null,
    })
    .where(eq(payoutsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/payouts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(payoutsTable).where(eq(payoutsTable.id, id));
  res.sendStatus(204);
});

export default router;

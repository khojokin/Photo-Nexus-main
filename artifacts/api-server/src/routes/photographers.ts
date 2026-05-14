import { Router, type IRouter } from "express";
import { db, photographerProfilesTable, payoutsTable } from "@workspace/db";
import { eq, desc, sum, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

function generatePayoutId(): string {
  return "PAY-" + randomBytes(4).toString("hex").toUpperCase();
}

router.get("/photographers/me/earnings", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [profile] = await db
    .select()
    .from(photographerProfilesTable)
    .where(eq(photographerProfilesTable.userId, req.authUser.id));

  const totalEarned = parseFloat(profile?.premiumEarningsTotal ?? "0");
  const totalPaid = parseFloat(profile?.premiumEarningsPaid ?? "0");

  const pendingRows = await db
    .select({ amt: sum(payoutsTable.amount) })
    .from(payoutsTable)
    .where(
      and(
        eq(payoutsTable.userId, req.authUser.id),
        inArray(payoutsTable.status, ["pending", "approved"])
      )
    );
  const pendingTotal = parseFloat(String(pendingRows[0]?.amt ?? "0"));

  const availableBalance = Math.max(0, totalEarned - totalPaid - pendingTotal);

  res.json({
    isQualifiedForPremium: profile?.isQualifiedForPremium ?? false,
    premiumEarningsTotal: totalEarned.toFixed(2),
    premiumEarningsPaid: totalPaid.toFixed(2),
    pendingTotal: pendingTotal.toFixed(2),
    availableBalance: availableBalance.toFixed(2),
  });
});

const PayoutRequestBody = z.object({
  paymentMethod: z.enum(["paypal", "bank_transfer"]).default("paypal"),
  paypalEmail: z.string().email().optional(),
  bankName: z.string().max(120).optional(),
  bankAccountHolder: z.string().max(120).optional(),
  bankAccountLast4: z.string().length(4).optional(),
  bankRoutingLast4: z.string().length(4).optional(),
});

router.post("/photographers/me/payout-request", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [profile] = await db
    .select()
    .from(photographerProfilesTable)
    .where(eq(photographerProfilesTable.userId, req.authUser.id));

  if (!profile?.isQualifiedForPremium) {
    res.status(403).json({ error: "not_qualified", message: "You are not a qualified photographer eligible for premium payouts." });
    return;
  }

  const totalEarned = parseFloat(profile.premiumEarningsTotal);
  const totalPaid = parseFloat(profile.premiumEarningsPaid);

  const pendingRows = await db
    .select({ amt: sum(payoutsTable.amount) })
    .from(payoutsTable)
    .where(
      and(
        eq(payoutsTable.userId, req.authUser.id),
        inArray(payoutsTable.status, ["pending", "approved"])
      )
    );
  const pendingTotal = parseFloat(String(pendingRows[0]?.amt ?? "0"));
  const availableBalance = totalEarned - totalPaid - pendingTotal;

  if (availableBalance < 50) {
    res.status(400).json({
      error: "below_minimum",
      message: `Minimum payout is $50.00. Your available balance is $${availableBalance.toFixed(2)}.`,
      availableBalance: availableBalance.toFixed(2),
    });
    return;
  }

  const parsed = PayoutRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  const user = req.authUser as { firstName?: string; lastName?: string; email?: string; id: string };
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email || user.id;

  const [payout] = await db
    .insert(payoutsTable)
    .values({
      payoutId: generatePayoutId(),
      userId: user.id,
      photographerName: name,
      email: user.email ?? null,
      type: "withdrawal",
      description: `Premium photo earnings withdrawal`,
      amount: availableBalance.toFixed(2),
      status: "pending",
      paymentMethod: parsed.data.paymentMethod,
      paypalEmail: parsed.data.paypalEmail ?? null,
      bankName: parsed.data.bankName ?? null,
      bankAccountHolder: parsed.data.bankAccountHolder ?? null,
      bankAccountLast4: parsed.data.bankAccountLast4 ?? null,
      bankRoutingLast4: parsed.data.bankRoutingLast4 ?? null,
    })
    .returning();

  res.status(201).json(payout);
});

router.get("/admin/photographers", requireAdmin, async (_req, res): Promise<void> => {
  const profiles = await db
    .select()
    .from(photographerProfilesTable)
    .orderBy(desc(photographerProfilesTable.updatedAt));
  res.json({ profiles });
});

const QualifyBody = z.object({ isQualifiedForPremium: z.boolean() });

router.patch("/admin/photographers/:userId/qualify", requireAdmin, async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  if (!userId) { res.status(400).json({ error: "Invalid userId" }); return; }

  const parsed = QualifyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [profile] = await db
    .insert(photographerProfilesTable)
    .values({ userId, isQualifiedForPremium: parsed.data.isQualifiedForPremium })
    .onConflictDoUpdate({
      target: photographerProfilesTable.userId,
      set: { isQualifiedForPremium: parsed.data.isQualifiedForPremium },
    })
    .returning();

  res.json(profile);
});

export default router;

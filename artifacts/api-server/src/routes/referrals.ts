import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { referralsTable } from "@workspace/db/schema";


const router = Router();

function randomCode(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET /api/referrals/my
router.get("/referrals/my", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const userId = req.authUser!.id;
    let [referral] = await db.select().from(referralsTable).where(eq(referralsTable.referrerUserId, userId));

    if (!referral) {
      const code = randomCode();
      [referral] = await db.insert(referralsTable).values({
        referrerUserId: userId,
        referrerName: (req.authUser as { displayName?: string; firstName?: string } | undefined)?.displayName
          ?? (req.authUser as { displayName?: string; firstName?: string } | undefined)?.firstName
          ?? "Photographer",
        code,
      }).returning();
    }

    const conversions = await db.execute(
      sql`SELECT count(*)::int AS total, coalesce(sum(commission_earned), 0) AS earnings FROM referrals WHERE referrer_user_id = ${userId} AND referred_user_id IS NOT NULL`
    );

    const row = conversions.rows[0] as { total: number; earnings: string } | undefined;

    res.json({
      code: referral.code,
      link: `${req.protocol}://${req.get("host")}/?ref=${referral.code}`,
      conversions: row?.total ?? 0,
      totalEarnings: parseFloat(row?.earnings ?? "0").toFixed(2),
      createdAt: referral.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch referral data" });
  }
});

// POST /api/referrals/track — called when a new user signs up with a ref code
router.post("/referrals/track", async (req, res): Promise<void> => {
  if (!req.authUser) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  try {
    const [referral] = await db.select().from(referralsTable).where(eq(referralsTable.code, code));
    if (!referral) { res.status(404).json({ error: "Invalid referral code" }); return; }
    if (referral.referredUserId) { res.json({ already: true }); return; }

    await db.update(referralsTable)
      .set({
        referredUserId: req.authUser!.id,
        referredName: (req.authUser as { displayName?: string; firstName?: string } | undefined)?.displayName ?? null,
        convertedAt: new Date(),
        commissionEarned: "5.00",
      })
      .where(eq(referralsTable.code, code));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to track referral" });
  }
});

export default router;

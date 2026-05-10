import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

router.get("/admin/subscriptions", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      subscriptionStatus: usersTable.subscriptionStatus,
      stripeSubscriptionId: usersTable.stripeSubscriptionId,
      subscriptionCurrentPeriodEnd: usersTable.subscriptionCurrentPeriodEnd,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json({ users });
});

export default router;

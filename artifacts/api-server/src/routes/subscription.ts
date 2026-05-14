import { Router, type IRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function isPremiumStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

// ── GET /subscription/status ──────────────────────────────────────────────────
router.get("/subscription/status", async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.json({ status: "free", isPremium: false, currentPeriodEnd: null, hasBilling: false });
    return;
  }

  const [user] = await db
    .select({
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionCurrentPeriodEnd: usersTable.subscriptionCurrentPeriodEnd,
      stripeCustomerId: usersTable.stripeCustomerId,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.authUser.id));

  const status = user?.subscriptionStatus ?? "free";
  res.json({
    status,
    isPremium: isPremiumStatus(status),
    currentPeriodEnd: user?.subscriptionCurrentPeriodEnd ?? null,
    hasBilling: Boolean(user?.stripeCustomerId),
  });
});

// ── POST /subscription/checkout ───────────────────────────────────────────────
router.post("/subscription/checkout", async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.APP_URL;

  if (!priceId || !appUrl) {
    res.status(500).json({ error: "Missing STRIPE_PRICE_ID or APP_URL" });
    return;
  }

  const stripe = getStripeClient();

  const [user] = await db
    .select({ stripeCustomerId: usersTable.stripeCustomerId, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, req.authUser.id));

  let customerId = user?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? req.authUser.email ?? undefined,
      metadata: { userId: req.authUser.id },
    });
    customerId = customer.id;
    await db
      .update(usersTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(usersTable.id, req.authUser.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/premium?checkout=success`,
    cancel_url: `${appUrl}/premium?checkout=cancel`,
    metadata: { userId: req.authUser.id },
  });

  res.json({ url: session.url });
});

// ── POST /subscription/portal ─────────────────────────────────────────────────
router.post("/subscription/portal", async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    res.status(500).json({ error: "Missing APP_URL" });
    return;
  }

  const [user] = await db
    .select({ stripeCustomerId: usersTable.stripeCustomerId })
    .from(usersTable)
    .where(eq(usersTable.id, req.authUser.id));

  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "No billing profile found" });
    return;
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/premium`,
  });

  res.json({ url: session.url });
});

// ── POST /subscription/webhook ────────────────────────────────────────────────
router.post("/subscription/webhook", async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch {
    res.status(400).send("Invalid webhook signature");
    return;
  }

  try {
    switch (event.type) {
      // ── Checkout completed: first-time subscription ────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.metadata?.userId;
        if (!userId) break;
        await db
          .update(usersTable)
          .set({
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            subscriptionStatus: "active",
          })
          .where(eq(usersTable.id, userId));
        break;
      }

      // ── Subscription lifecycle ─────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
            subscriptionCurrentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          })
          .where(eq(usersTable.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            subscriptionStatus: "free",
            subscriptionCurrentPeriodEnd: null,
          })
          .where(eq(usersTable.stripeCustomerId, customerId));
        break;
      }

      // ── Invoice events: handle payment failures ────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;
        await db
          .update(usersTable)
          .set({ subscriptionStatus: "active" })
          .where(eq(usersTable.stripeCustomerId, customerId));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;
        await db
          .update(usersTable)
          .set({ subscriptionStatus: "past_due" })
          .where(eq(usersTable.stripeCustomerId, customerId));
        break;
      }
    }

    res.json({ received: true });
  } catch {
    res.status(500).send("Webhook handler failed");
  }
});

export default router;

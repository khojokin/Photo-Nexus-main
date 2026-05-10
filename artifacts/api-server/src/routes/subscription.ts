import { Router, type IRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

function isPremiumStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

router.get("/subscription/status", async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.json({ status: "free", isPremium: false, currentPeriodEnd: null });
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
      email: user?.email ?? undefined,
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
    res.status(400).send("Invalid signature");
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await db
          .update(usersTable)
          .set({
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            subscriptionStatus: "active",
          })
          .where(eq(usersTable.id, userId));
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (customerId) {
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(usersTable.stripeCustomerId, customerId));
      }
    }

    res.json({ received: true });
  } catch {
    res.status(500).send("Webhook handler failed");
  }
});

export default router;

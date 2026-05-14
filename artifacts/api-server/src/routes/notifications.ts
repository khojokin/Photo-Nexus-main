import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { db, notificationsTable, followAlertsTable } from "@workspace/db";
import { z } from "zod/v4";

const router: IRouter = Router();

const sseClients = new Map<string, Set<Response>>();

export async function pushUnreadCount(recipientId: string): Promise<void> {
  const clients = sseClients.get(recipientId);
  if (!clients || clients.size === 0) return;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.recipientId, recipientId),
          eq(notificationsTable.isRead, false)
        )
      );
    const count = row?.count ?? 0;
    const payload = `data: ${JSON.stringify({ unreadCount: count })}\n\n`;
    for (const res of clients) {
      try { res.write(payload); } catch { clients.delete(res); }
    }
  } catch { /* non-critical */ }
}

router.get("/notifications/stream", async (req: Request, res: Response): Promise<void> => {
  if (!req.authUser) {
    res.status(401).end();
    return;
  }

  const userId = req.authUser.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);

  const sendCount = async () => {
    try {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.recipientId, userId),
            eq(notificationsTable.isRead, false)
          )
        );
      const count = row?.count ?? 0;
      res.write(`data: ${JSON.stringify({ unreadCount: count })}\n\n`);
    } catch { /* ignore */ }
  };

  await sendCount();

  const pollInterval = setInterval(() => void sendCount(), 15_000);
  const heartbeat = setInterval(() => { try { res.write(": heartbeat\n\n"); } catch { /* closed */ } }, 30_000);

  req.on("close", () => {
    clearInterval(pollInterval);
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
  });
});

router.get("/notifications", async (req: Request, res: Response): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.recipientId, req.authUser.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({ notifications, unreadCount });
});

router.patch("/notifications/read-all", async (req: Request, res: Response): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.recipientId, req.authUser.id),
        eq(notificationsTable.isRead, false)
      )
    );

  void pushUnreadCount(req.authUser.id);
  res.json({ success: true });
});

// ── Name-based follow alert endpoints (no Replit Auth required) ──────────────

const NameQuery = z.object({ name: z.string().min(1).max(120) });

router.get("/notifications/follow-alerts", async (req: Request, res: Response): Promise<void> => {
  const parsed = NameQuery.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing name" }); return; }

  const alerts = await db
    .select()
    .from(followAlertsTable)
    .where(ilike(followAlertsTable.recipientName, parsed.data.name))
    .orderBy(desc(followAlertsTable.createdAt))
    .limit(50);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  res.json({ alerts, unreadCount });
});

router.patch("/notifications/follow-alerts/read-all", async (req: Request, res: Response): Promise<void> => {
  const parsed = NameQuery.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing name" }); return; }

  await db
    .update(followAlertsTable)
    .set({ isRead: true })
    .where(ilike(followAlertsTable.recipientName, parsed.data.name));

  res.json({ success: true });
});

router.patch("/notifications/follow-alerts/:id/read", async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(req.params.id ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .update(followAlertsTable)
    .set({ isRead: true })
    .where(eq(followAlertsTable.id, id));

  res.json({ success: true });
});

router.patch("/notifications/:id/read", async (req: Request, res: Response): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number.parseInt(rawId ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationsTable.id, id),
        eq(notificationsTable.recipientId, req.authUser.id)
      )
    );

  void pushUnreadCount(req.authUser.id);
  res.json({ success: true });
});

export default router;

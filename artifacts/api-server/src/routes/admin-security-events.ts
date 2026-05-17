import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { securityEventsTable, blockedIpsTable } from "@workspace/db";
import { desc, eq, gte, sql, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminMiddleware";
import { z } from "zod";

const router: IRouter = Router();

// ── Security events log ──────────────────────────────────────────────────────

router.get("/admin/security-events", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const events = await db
      .select()
      .from(securityEventsTable)
      .where(gte(securityEventsTable.createdAt, since))
      .orderBy(desc(securityEventsTable.createdAt))
      .limit(300);

    const [metrics] = await db
      .select({
        total: count(),
        critical: sql<number>`COUNT(*) FILTER (WHERE severity = 'critical')`,
        errors: sql<number>`COUNT(*) FILTER (WHERE severity = 'error')`,
        warnings: sql<number>`COUNT(*) FILTER (WHERE severity = 'warn')`,
        rateLimitHits: sql<number>`COUNT(*) FILTER (WHERE event_type = 'rate_limited')`,
      })
      .from(securityEventsTable)
      .where(gte(securityEventsTable.createdAt, since));

    const topIpResult = await db.execute<{ ip_address: string; cnt: number }>(sql`
      SELECT ip_address, COUNT(*) AS cnt
      FROM security_events
      WHERE ip_address IS NOT NULL
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY ip_address
      ORDER BY cnt DESC
      LIMIT 1
    `);

    res.json({
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        ipAddress: e.ipAddress,
        userId: e.userId,
        path: e.path,
        method: e.method,
        statusCode: e.statusCode,
        message: e.message,
        createdAt: e.createdAt,
      })),
      metrics: {
        total: Number(metrics?.total ?? 0),
        critical: Number(metrics?.critical ?? 0),
        errors: Number(metrics?.errors ?? 0),
        warnings: Number(metrics?.warnings ?? 0),
        topIp: topIpResult.rows[0]?.ip_address ?? null,
        rateLimitHits: Number(metrics?.rateLimitHits ?? 0),
      },
    });
  } catch (err) {
    console.error("Security events fetch error:", err);
    res.status(500).json({ error: "Failed to load security events." });
  }
});

// ── IP blocking ──────────────────────────────────────────────────────────────

const BlockIpBody = z.object({
  ipAddress: z.string().min(1).max(64),
  reason: z.string().min(1).max(300),
  expiresInHours: z.number().int().min(1).max(8760).optional(),
});

router.get("/admin/blocked-ips", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(blockedIpsTable)
    .orderBy(desc(blockedIpsTable.createdAt));
  res.json({ blockedIps: rows });
});

router.post("/admin/blocked-ips", requireAdmin, async (req, res): Promise<void> => {
  const parsed = BlockIpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { ipAddress, reason, expiresInHours } = parsed.data;
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null;

  const [row] = await db
    .insert(blockedIpsTable)
    .values({ ipAddress, reason, blockedBy: req.authUser?.id ?? null, expiresAt })
    .onConflictDoUpdate({ target: blockedIpsTable.ipAddress, set: { reason, expiresAt, blockedBy: req.authUser?.id ?? null } })
    .returning();

  res.status(201).json(row);
});

router.delete("/admin/blocked-ips/:ip", requireAdmin, async (req, res): Promise<void> => {
  const ip = decodeURIComponent(req.params["ip"] as string);
  await db.delete(blockedIpsTable).where(eq(blockedIpsTable.ipAddress, ip));
  res.sendStatus(204);
});

// ── Active sessions count ─────────────────────────────────────────────────────

router.get("/admin/active-sessions", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [row] = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) AS count FROM sessions WHERE expire > NOW()
    `);
    res.json({ activeSessions: Number(row?.count ?? 0) });
  } catch {
    res.json({ activeSessions: 0 });
  }
});

router.delete("/admin/sessions/purge-expired", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.execute(sql`DELETE FROM sessions WHERE expire <= NOW()`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to purge sessions." });
  }
});

// ── Security events cleanup ───────────────────────────────────────────────────

router.delete("/admin/security-events/clear", requireAdmin, async (_req, res): Promise<void> => {
  try {
    await db.execute(sql`DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '30 days'`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to clear old events." });
  }
});

export default router;

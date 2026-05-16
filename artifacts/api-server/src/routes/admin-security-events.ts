import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

interface SecurityEventRow {
  id: number;
  event_type: string;
  severity: string;
  ip_address: string | null;
  user_id: string | null;
  path: string | null;
  method: string | null;
  status_code: number | null;
  message: string;
  created_at: string;
}

interface MetricsRow {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  top_ip: string | null;
  rate_limit_hits: number;
}

router.get("/admin/security-events", requireAdmin, async (_req, res): Promise<void> => {
  try {
    // Check if the security_events table exists first
    const tableCheck = await db.execute<{ exists: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'security_events'
      ) AS exists
    `);

    const tableExists = tableCheck?.rows?.[0]?.exists === true;

    if (!tableExists) {
      // Table not yet created — return empty data with a note
      res.json({
        events: [],
        metrics: {
          total: 0,
          critical: 0,
          errors: 0,
          warnings: 0,
          topIp: null,
          rateLimitHits: 0,
        },
        note: "security_events table not found. Run sql/affuaa-supabase-full-schema.sql to create it.",
      });
      return;
    }

    // Fetch recent events (last 7 days)
    const eventsResult = await db.execute<SecurityEventRow>(sql`
      SELECT
        id, event_type, severity, ip_address, user_id,
        path, method, status_code, message, created_at
      FROM security_events
      WHERE created_at > now() - interval '7 days'
      ORDER BY created_at DESC
      LIMIT 200
    `);

    // Aggregate metrics
    const metricsResult = await db.execute<MetricsRow>(sql`
      SELECT
        COUNT(*)                                              AS total,
        COUNT(*) FILTER (WHERE severity = 'critical')        AS critical,
        COUNT(*) FILTER (WHERE severity = 'error')           AS errors,
        COUNT(*) FILTER (WHERE severity = 'warn')            AS warnings,
        (
          SELECT ip_address FROM security_events
          WHERE ip_address IS NOT NULL
            AND created_at > now() - interval '7 days'
          GROUP BY ip_address
          ORDER BY COUNT(*) DESC
          LIMIT 1
        )                                                     AS top_ip,
        COUNT(*) FILTER (WHERE event_type = 'rate_limited')  AS rate_limit_hits
      FROM security_events
      WHERE created_at > now() - interval '7 days'
    `);

    const metrics = metricsResult?.rows?.[0];

    const events = (eventsResult?.rows ?? []).map((r) => ({
      id: r.id,
      eventType: r.event_type,
      severity: r.severity,
      ipAddress: r.ip_address,
      userId: r.user_id,
      path: r.path,
      method: r.method,
      statusCode: r.status_code,
      message: r.message,
      createdAt: r.created_at,
    }));

    res.json({
      events,
      metrics: {
        total: Number(metrics?.total ?? 0),
        critical: Number(metrics?.critical ?? 0),
        errors: Number(metrics?.errors ?? 0),
        warnings: Number(metrics?.warnings ?? 0),
        topIp: metrics?.top_ip ?? null,
        rateLimitHits: Number(metrics?.rate_limit_hits ?? 0),
      },
    });
  } catch (err) {
    console.error("Security events fetch error:", err);
    res.status(500).json({ error: "Failed to load security events." });
  }
});

export default router;

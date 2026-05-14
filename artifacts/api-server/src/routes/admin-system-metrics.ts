import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

type SizeRow = {
  database_size: string | number;
  photos_size: string | number | null;
  collections_size: string | number | null;
  users_size: string | number | null;
  logs_size: string | number | null;
};

router.get("/admin/system-metrics", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const sizeResult = await db.execute<SizeRow>(sql`
      SELECT
        pg_database_size(current_database()) AS database_size,
        COALESCE(pg_total_relation_size(to_regclass('public.photos')), 0) AS photos_size,
        COALESCE(pg_total_relation_size(to_regclass('public.collections')), 0) AS collections_size,
        COALESCE(pg_total_relation_size(to_regclass('public.users')), 0) AS users_size,
        (
          COALESCE(pg_total_relation_size(to_regclass('public.sessions')), 0)
          + COALESCE(pg_total_relation_size(to_regclass('public.reports')), 0)
          + COALESCE(pg_total_relation_size(to_regclass('public.notifications')), 0)
        ) AS logs_size
    `);

    const row = sizeResult?.rows?.[0];
    if (!row) {
      res.status(500).json({ error: "Unable to load database metrics" });
      return;
    }

    const limitGb = Number(process.env.SUPABASE_DB_LIMIT_GB ?? "0");
    const limitBytes = Number.isFinite(limitGb) && limitGb > 0
      ? Math.floor(limitGb * 1024 * 1024 * 1024)
      : null;

    res.json({
      databaseSizeBytes: Number(row.database_size ?? 0),
      limitBytes,
      breakdown: {
        photos: Number(row.photos_size ?? 0),
        collections: Number(row.collections_size ?? 0),
        users: Number(row.users_size ?? 0),
        logs: Number(row.logs_size ?? 0),
      },
      sampledAt: new Date().toISOString(),
      source: "postgres",
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load database metrics", details: String(error) });
  }
});

export default router;
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router = Router();

router.get("/stats/analytics", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  try {
    const [dailyStats, photographerStats] = await Promise.all([
      db.execute(sql`
        SELECT
          to_char(DATE(created_at AT TIME ZONE 'UTC'), 'Mon DD') AS label,
          DATE(created_at AT TIME ZONE 'UTC')::text AS date,
          count(*)::int AS uploads,
          coalesce(sum(likes), 0)::int AS likes,
          coalesce(sum(downloads), 0)::int AS downloads,
          coalesce(sum(views), 0)::int AS views
        FROM photos
        WHERE created_at >= ${cutoff}::timestamptz
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY DATE(created_at AT TIME ZONE 'UTC') ASC
      `),
      db.execute(sql`
        SELECT
          photographer_name,
          count(*)::int AS photo_count,
          coalesce(sum(likes), 0)::int AS total_likes,
          coalesce(sum(downloads), 0)::int AS total_downloads,
          coalesce(sum(views), 0)::int AS total_views
        FROM photos
        GROUP BY photographer_name
        ORDER BY coalesce(sum(likes), 0) + coalesce(sum(downloads), 0) DESC
        LIMIT 10
      `),
    ]);

    res.json({
      dailyStats: dailyStats.rows,
      photographerStats: photographerStats.rows,
    });
  } catch (err) {
    console.error("Analytics query error:", err);
    res.status(500).json({ error: "Analytics unavailable" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";
import { ListTagsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tags", async (_req, res): Promise<void> => {
  const rows = await db.execute(
    sql`
      SELECT
        tag AS name,
        count(*)::int AS "photoCount"
      FROM photos, unnest(tags) AS tag
      GROUP BY tag
      ORDER BY "photoCount" DESC
    `
  );

  res.json(ListTagsResponse.parse(rows.rows));
});

export default router;

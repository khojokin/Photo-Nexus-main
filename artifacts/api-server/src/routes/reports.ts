import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";

const router = Router();

router.post("/photos/:id/report", async (req, res): Promise<void> => {
  const photoId = parseInt(req.params.id, 10);
  if (isNaN(photoId)) { res.status(400).json({ error: "Invalid photo id" }); return; }

  const { reporterName, reason, body } = req.body as { reporterName?: string; reason?: string; body?: string };
  if (!reporterName || !reason) { res.status(400).json({ error: "reporterName and reason required" }); return; }

  const [report] = await db.insert(reportsTable).values({ photoId, reporterName, reason, body }).returning();
  res.status(201).json(report);
});

router.get("/admin/reports", async (_req, res): Promise<void> => {
  const reports = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
  res.json({ reports });
});

router.put("/admin/reports/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status } = req.body as { status?: string };
  if (!status) { res.status(400).json({ error: "status required" }); return; }

  const [updated] = await db.update(reportsTable).set({ status }).where(eq(reportsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(updated);
});

export default router;

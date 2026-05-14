import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

const DEFAULTS: Record<string, string> = {
  ads_enabled: "true",
};

async function getSetting(key: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  return row?.value ?? DEFAULTS[key] ?? "";
}

router.get("/settings", async (_req, res): Promise<void> => {
  const adsEnabledVal = await getSetting("ads_enabled");
  res.json({ adsEnabled: adsEnabledVal === "true" });
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as { adsEnabled?: boolean };

  if (typeof body.adsEnabled === "boolean") {
    await db
      .insert(siteSettingsTable)
      .values({ key: "ads_enabled", value: body.adsEnabled ? "true" : "false" })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: body.adsEnabled ? "true" : "false" } });
  }

  const adsEnabledVal = await getSetting("ads_enabled");
  res.json({ adsEnabled: adsEnabledVal === "true" });
});

export default router;

import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, getCurrentAuthUser } from "../replitAuth";

const router = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const authUser = getCurrentAuthUser(req);
  if (!authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json({ user });
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const authUser = getCurrentAuthUser(req);
  if (!authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { bio, location, website, instagram, twitter, equipment, styleTags, availability, hiringUrl, accentColor, featuredPhotoId } = req.body as {
    bio?: string; location?: string; website?: string; instagram?: string; twitter?: string;
    equipment?: string[]; styleTags?: string[]; availability?: string; hiringUrl?: string;
    accentColor?: string; featuredPhotoId?: number | null;
  };

  const [updated] = await db.update(usersTable)
    .set({ bio, location, website, instagram, twitter, equipment, styleTags, availability, hiringUrl, accentColor, featuredPhotoId })
    .where(eq(usersTable.id, authUser.id))
    .returning();

  res.json({ user: updated });
});

router.get("/users/:name/profile", async (req, res): Promise<void> => {
  const name = decodeURIComponent(req.params.name);
  const [user] = await db.select().from(usersTable).where(sql`lower(${usersTable.firstName} || ' ' || ${usersTable.lastName}) = lower(${name}) OR lower(${usersTable.email}) = lower(${name})`).limit(1);
  res.json({ user: user ?? null });
});

export default router;

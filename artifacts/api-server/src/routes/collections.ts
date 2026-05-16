import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, collectionsTable, collectionPhotosTable, photosTable } from "@workspace/db";
import {
  CreateCollectionBody,
  GetCollectionParams,
  GetCollectionResponse,
  DeleteCollectionParams,
  AddPhotoToCollectionParams,
  AddPhotoToCollectionBody,
  ListCollectionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/collections", async (_req, res): Promise<void> => {
  const collections = await db
    .select({
      id: collectionsTable.id,
      name: collectionsTable.name,
      description: collectionsTable.description,
      coverImageUrl: collectionsTable.coverImageUrl,
      createdAt: collectionsTable.createdAt,
      photoCount: sql<number>`count(${collectionPhotosTable.photoId})::int`,
    })
    .from(collectionsTable)
    .leftJoin(
      collectionPhotosTable,
      eq(collectionsTable.id, collectionPhotosTable.collectionId)
    )
    .groupBy(collectionsTable.id)
    .orderBy(collectionsTable.createdAt);

  res.json(ListCollectionsResponse.parse(collections));
});

router.post("/collections", async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [collection] = await db
    .insert(collectionsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({
    ...collection,
    photoCount: 0,
  });
});

router.get("/collections/:id", async (req, res): Promise<void> => {
  const params = GetCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, params.data.id));

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const photoRows = await db
    .select({ photo: photosTable })
    .from(collectionPhotosTable)
    .innerJoin(photosTable, eq(collectionPhotosTable.photoId, photosTable.id))
    .where(eq(collectionPhotosTable.collectionId, params.data.id));

  const photos = photoRows.map((r) => r.photo);

  res.json(
    GetCollectionResponse.parse({
      ...collection,
      photoCount: photos.length,
      photos,
    })
  );
});

router.patch("/collections/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, description, coverImageUrl } = req.body as { name?: string; description?: string; coverImageUrl?: string };
  const update: Record<string, unknown> = {};
  if (name !== undefined) update["name"] = name;
  if (description !== undefined) update["description"] = description;
  if (coverImageUrl !== undefined) update["coverImageUrl"] = coverImageUrl;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }

  const [updated] = await db.update(collectionsTable).set(update).where(eq(collectionsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Collection not found" }); return; }
  res.json(updated);
});

router.delete("/collections/:id/photos/:photoId", async (req, res): Promise<void> => {
  const collectionId = parseInt(req.params["id"] as string, 10);
  const photoId = parseInt(req.params["photoId"] as string, 10);
  if (isNaN(collectionId) || isNaN(photoId)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(collectionPhotosTable).where(
    and(eq(collectionPhotosTable.collectionId, collectionId), eq(collectionPhotosTable.photoId, photoId))
  );
  res.sendStatus(204);
});

router.delete("/collections/:id", async (req, res): Promise<void> => {
  const params = DeleteCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db
    .delete(collectionsTable)
    .where(eq(collectionsTable.id, params.data.id))
    .returning();

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/collections/:id/photos", async (req, res): Promise<void> => {
  const params = AddPhotoToCollectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddPhotoToCollectionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, params.data.id));

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  await db
    .insert(collectionPhotosTable)
    .values({
      collectionId: params.data.id,
      photoId: body.data.photoId,
    })
    .onConflictDoNothing();

  const photoRows = await db
    .select({ photo: photosTable })
    .from(collectionPhotosTable)
    .innerJoin(photosTable, eq(collectionPhotosTable.photoId, photosTable.id))
    .where(eq(collectionPhotosTable.collectionId, params.data.id));

  res.status(201).json({
    ...collection,
    photoCount: photoRows.length,
  });
});

router.get("/collections/for-photo/:photoId", async (req, res): Promise<void> => {
  const photoId = parseInt(req.params.photoId ?? "", 10);
  if (isNaN(photoId)) {
    res.status(400).json({ error: "Invalid photoId" });
    return;
  }

  const collections = await db
    .select({
      id: collectionsTable.id,
      name: collectionsTable.name,
      description: collectionsTable.description,
      coverImageUrl: collectionsTable.coverImageUrl,
      photoCount: sql<number>`count(cp2.photo_id)::int`,
    })
    .from(collectionPhotosTable)
    .innerJoin(collectionsTable, eq(collectionPhotosTable.collectionId, collectionsTable.id))
    .leftJoin(
      sql`collection_photos as cp2`,
      sql`cp2.collection_id = ${collectionsTable.id}`
    )
    .where(eq(collectionPhotosTable.photoId, photoId))
    .groupBy(collectionsTable.id, collectionsTable.name, collectionsTable.description, collectionsTable.coverImageUrl);

  res.json({ collections });
});

export default router;

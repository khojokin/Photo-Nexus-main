import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
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

export default router;

import { Router, type IRouter } from "express";
import { sql, ne, eq } from "drizzle-orm";
import { db, photosTable } from "@workspace/db";

const router: IRouter = Router();

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as number,
    title: r.title as string,
    description: r.description as string | null,
    imageUrl: r.image_url as string,
    blurHash: r.blur_hash as string | null,
    width: r.width as number,
    height: r.height as number,
    photographerName: r.photographer_name as string,
    photographerAvatarUrl: r.photographer_avatar_url as string | null,
    tags: r.tags as string[],
    likes: r.likes as number,
    downloads: r.downloads as number,
    views: r.views as number,
    isFeatured: r.is_featured as boolean,
    contentWarning: r.content_warning as boolean,
    uploadedBy: r.uploaded_by as string | null,
    createdAt: r.created_at as string,
    publishAt: r.publish_at as string | null,
    seriesId: r.series_id as number | null,
    camera: r.camera as string | null,
    lens: r.lens as string | null,
    aperture: r.aperture as string | null,
    shutterSpeed: r.shutter_speed as string | null,
    iso: r.iso as number | null,
    focalLength: r.focal_length as string | null,
    license: r.license as string,
    status: r.status as string,
  };
}

function safeSqlArray(tags: string[]): string {
  return `ARRAY[${tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`;
}

router.get("/photos/:id/similar", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(photosTable).where(eq(photosTable.id, id));
  if (!source) { res.status(404).json({ error: "Photo not found" }); return; }

  const limit = Math.min(parseInt(String(req.query.limit ?? "8"), 10), 24);

  if (!source.tags || source.tags.length === 0) {
    const photos = await db
      .select()
      .from(photosTable)
      .where(ne(photosTable.id, id))
      .orderBy(sql`${photosTable.likes} + ${photosTable.downloads} DESC`)
      .limit(limit);
    res.json({ photos });
    return;
  }

  const tagArr = safeSqlArray(source.tags);
  const maxRes = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(likes + downloads), 1)::float AS max FROM photos WHERE id != ${id}`
  );
  const maxEng = (maxRes.rows[0] as { max: number })?.max ?? 1;

  const result = await db.execute<Record<string, unknown>>(sql.raw(`
    SELECT *,
      (
        (SELECT count(*)::int FROM unnest(tags) AS t WHERE t = ANY(${tagArr})) * 10
        + COALESCE((likes + downloads)::float / ${maxEng} * 5, 0)
      ) AS score
    FROM photos
    WHERE id != ${id}
      AND status = 'published'
    ORDER BY score DESC, created_at DESC
    LIMIT ${limit}
  `));

  res.json({ photos: result.rows.map(mapRow) });
});

const MOOD_TAG_MAP: Record<string, { label: string; description: string; tags: string[] }> = {
  moody: {
    label: "Moody & Dark",
    description: "Drama, shadow and emotion",
    tags: ["dark", "moody", "dramatic", "noir", "shadow", "night", "fog", "mist", "storm", "rain", "smoke", "mystery"],
  },
  serene: {
    label: "Serene & Calm",
    description: "Peace, stillness and clarity",
    tags: ["calm", "peaceful", "serene", "minimal", "zen", "water", "lake", "morning", "soft", "pastel", "quiet", "still"],
  },
  vibrant: {
    label: "Vibrant & Bold",
    description: "Color, energy and life",
    tags: ["colorful", "vibrant", "vivid", "bold", "street", "festival", "market", "urban", "neon", "bright", "pop"],
  },
  epic: {
    label: "Epic & Grand",
    description: "Scale, wilderness and awe",
    tags: ["landscape", "mountain", "epic", "grand", "wilderness", "aerial", "vast", "horizon", "golden", "canyon", "glacier"],
  },
  intimate: {
    label: "Intimate & Close",
    description: "Detail, texture and connection",
    tags: ["portrait", "close-up", "macro", "detail", "texture", "face", "eyes", "hands", "intimate", "human", "emotion"],
  },
  golden: {
    label: "Golden Hour",
    description: "Warmth, glow and magic light",
    tags: ["golden-hour", "sunset", "sunrise", "warmth", "glow", "dusk", "dawn", "magic-hour", "backlit", "silhouette"],
  },
  monochrome: {
    label: "Monochrome",
    description: "Black, white and everything between",
    tags: ["black-and-white", "monochrome", "bw", "grayscale", "contrast", "shadow", "silver", "film", "analog"],
  },
  wild: {
    label: "Wild & Untamed",
    description: "Nature, creatures and raw earth",
    tags: ["wildlife", "nature", "animal", "forest", "bird", "ocean", "sea", "jungle", "raw", "untamed", "safari", "wolf"],
  },
};

router.get("/recommendations/moods", (_req, res): void => {
  const moods = Object.entries(MOOD_TAG_MAP).map(([id, m]) => ({
    id,
    label: m.label,
    description: m.description,
    tags: m.tags,
  }));
  res.json({ moods });
});

router.get("/recommendations/mood/:mood", async (req, res): Promise<void> => {
  const mood = req.params.mood.toLowerCase();
  const moodDef = MOOD_TAG_MAP[mood];
  if (!moodDef) { res.status(404).json({ error: "Unknown mood" }); return; }

  const limit = Math.min(parseInt(String(req.query.limit ?? "12"), 10), 48);
  const tagArr = safeSqlArray(moodDef.tags);

  const result = await db.execute<Record<string, unknown>>(sql.raw(`
    SELECT *,
      (SELECT count(*)::int FROM unnest(tags) AS t WHERE t = ANY(${tagArr})) AS mood_score
    FROM photos
    WHERE status = 'published'
      AND (SELECT count(*)::int FROM unnest(tags) AS t WHERE t = ANY(${tagArr})) > 0
    ORDER BY mood_score DESC, (likes + downloads) DESC
    LIMIT ${limit}
  `));

  res.json({ photos: result.rows.map(mapRow), mood, label: moodDef.label });
});

router.get("/recommendations/for-you", async (req, res): Promise<void> => {
  const tasteParam = req.query.taste as string | undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "12"), 10), 48);

  const tasteTags = tasteParam
    ? tasteParam.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20)
    : [];

  if (tasteTags.length === 0) {
    const photos = await db
      .select()
      .from(photosTable)
      .where(sql`${photosTable.status} = 'published'`)
      .orderBy(sql`${photosTable.likes} + ${photosTable.downloads} * 2 + ${photosTable.views} / 10 DESC`)
      .limit(limit);
    res.json({ photos, personalized: false });
    return;
  }

  const tagArr = safeSqlArray(tasteTags);
  const maxRes = await db.execute<{ max: number }>(
    sql`SELECT COALESCE(MAX(likes + downloads * 2), 1)::float AS max FROM photos WHERE status = 'published'`
  );
  const maxEng = (maxRes.rows[0] as { max: number })?.max ?? 1;

  const result = await db.execute<Record<string, unknown>>(sql.raw(`
    SELECT *,
      (
        (SELECT count(*)::int FROM unnest(tags) AS t WHERE t = ANY(${tagArr})) * 10
        + COALESCE((likes + downloads * 2)::float / ${maxEng} * 5, 0)
      ) AS relevance_score
    FROM photos
    WHERE status = 'published'
    ORDER BY relevance_score DESC, created_at DESC
    LIMIT ${limit}
  `));

  res.json({ photos: result.rows.map(mapRow), personalized: true, tasteTags });
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { photosTable, collectionsTable, collectionPhotosTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminMiddleware";

const router: IRouter = Router();

const SEED_PHOTOS = [
  { title: "Golden Hour in the Alps", description: "Warm light cascading over snow-capped peaks at dusk. Shot just after the sun dipped below the ridge, painting the clouds amber.", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["landscape","mountains","golden-hour","nature"], likes: 342, downloads: 128, views: 2840, isFeatured: true, camera: "Sony A7R V", lens: "24-70mm f/2.8 GM", aperture: "f/8", shutterSpeed: "1/250s", iso: 100, focalLength: "35mm" },
  { title: "Icelandic Horizon", description: "Volcanic black sand beach meeting a stormy Atlantic sky. The contrast between the dark shore and silver waves is otherworldly.", imageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600", width: 1600, height: 1067, photographerName: "Ingrid Bjornsson", photographerAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", tags: ["iceland","landscape","ocean","travel"], likes: 402, downloads: 167, views: 3210, isFeatured: true, camera: "Nikon Z9", lens: "14-24mm f/2.8 S", aperture: "f/11", shutterSpeed: "1/125s", iso: 200, focalLength: "18mm" },
  { title: "Salt Flats Mirror", description: "A perfect reflection of the sky on Bolivia's Salar de Uyuni after light rain — the world's largest natural mirror.", imageUrl: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["landscape","travel","minimal","aerial","bolivia"], likes: 612, downloads: 274, views: 5100, isFeatured: true, camera: "Canon R5", lens: "16-35mm f/2.8L", aperture: "f/9", shutterSpeed: "1/200s", iso: 100, focalLength: "16mm" },
  { title: "Desert Geometry", description: "Abstract patterns formed by sand dunes in the Sahara at first light. The raking light reveals every ripple in the sand.", imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600", width: 1600, height: 1067, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["desert","abstract","landscape","minimal","sahara"], likes: 487, downloads: 201, views: 4020, isFeatured: true, camera: "Fujifilm GFX 100S", lens: "32-64mm f/4", aperture: "f/8", shutterSpeed: "1/400s", iso: 50, focalLength: "64mm" },
  { title: "Forest Light", description: "Shafts of morning light piercing through ancient redwoods, turning the mist into golden curtains.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600", width: 1600, height: 1067, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["forest","nature","light","landscape","california"], likes: 311, downloads: 143, views: 2670, isFeatured: false, camera: "Sony A7R V", lens: "85mm f/1.4 GM", aperture: "f/4", shutterSpeed: "1/60s", iso: 400, focalLength: "85mm" },
  { title: "The Lone Pine", description: "A solitary pine tree silhouetted against a violet sky at twilight — the last moment before darkness.", imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["nature","minimal","landscape","trees","twilight"], likes: 421, downloads: 189, views: 3500, isFeatured: false, camera: "Sony A7R V", lens: "24-70mm f/2.8 GM", aperture: "f/5.6", shutterSpeed: "1/30s", iso: 800, focalLength: "55mm" },
  { title: "Lavender Fields", description: "Endless rows of lavender fade into the Provençal horizon under an overcast sky, the scent almost palpable.", imageUrl: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1600", width: 1600, height: 1067, photographerName: "Nathalie Dupont", photographerAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", tags: ["nature","landscape","travel","france","flowers"], likes: 388, downloads: 164, views: 3140, isFeatured: false, camera: "Canon R6 II", lens: "70-200mm f/2.8L IS", aperture: "f/4", shutterSpeed: "1/500s", iso: 200, focalLength: "135mm" },
  { title: "Quiet Streets of Kyoto", description: "A misty morning walk through the historic lanes of Kyoto — paper lanterns still glowing at dawn.", imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["street","japan","travel","urban","kyoto"], likes: 218, downloads: 94, views: 1980, isFeatured: true, camera: "Leica M11", lens: "35mm f/1.4 Summilux", aperture: "f/2.8", shutterSpeed: "1/60s", iso: 1600, focalLength: "35mm" },
  { title: "Rain on Glass", description: "Raindrops refracting city lights on a taxi window — the whole city reduced to bokeh circles.", imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["abstract","urban","rain","street","night"], likes: 265, downloads: 109, views: 2340, isFeatured: false, camera: "Canon R5", lens: "50mm f/1.2L", aperture: "f/1.4", shutterSpeed: "1/80s", iso: 3200, focalLength: "50mm" },
  { title: "Black & White Tokyo", description: "Rush hour at Shinjuku station in high-contrast monochrome — a thousand stories in a single frame.", imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["black & white","street","japan","documentary","tokyo"], likes: 509, downloads: 221, views: 4300, isFeatured: false, camera: "Leica M11 Monochrom", lens: "28mm f/2 Summicron", aperture: "f/5.6", shutterSpeed: "1/250s", iso: 800, focalLength: "28mm" },
  { title: "Night Market Colours", description: "The vibrant chaos of a Bangkok night market at full swing — colour, smoke, and motion.", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600", width: 1600, height: 1067, photographerName: "Nathalie Dupont", photographerAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", tags: ["street","travel","urban","night","thailand"], likes: 298, downloads: 118, views: 2560, isFeatured: false, camera: "Canon R6 II", lens: "24mm f/1.4L", aperture: "f/2", shutterSpeed: "1/40s", iso: 6400, focalLength: "24mm" },
  { title: "Terracotta Rooftops", description: "Looking out over a sun-drenched hillside village in Tuscany — history baked into every tile.", imageUrl: "https://images.unsplash.com/photo-1534445538923-ab38b6c0d8d1?w=1600", width: 1600, height: 1067, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["architecture","italy","travel","urban","tuscany"], likes: 178, downloads: 62, views: 1540, isFeatured: false, camera: "Nikon Z8", lens: "24-120mm f/4 S", aperture: "f/8", shutterSpeed: "1/320s", iso: 100, focalLength: "70mm" },
  { title: "Monsoon Reflections", description: "A flooded alley mirrors neon signs after heavy rain in Mumbai. The city doubled, abstract.", imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["street","rain","urban","documentary","india"], likes: 374, downloads: 152, views: 3020, isFeatured: false, camera: "Canon R5", lens: "35mm f/1.4L", aperture: "f/2.8", shutterSpeed: "1/100s", iso: 1600, focalLength: "35mm" },
  { title: "City Lights from Above", description: "New York at 11pm from a helicopter — a circuit board of amber and white, alive with motion.", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600", width: 1600, height: 1067, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["aerial","night","urban","new-york","cityscape"], likes: 489, downloads: 211, views: 4100, isFeatured: false, camera: "Sony A7R V", lens: "35mm f/1.4 GM", aperture: "f/2.8", shutterSpeed: "1/60s", iso: 6400, focalLength: "35mm" },
  { title: "Ocean Solitude", description: "A lone figure standing at the edge of an endless sea. Scale made tangible — human vs. infinite.", imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600", width: 1600, height: 1067, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["ocean","portrait","minimal","travel","solitude"], likes: 193, downloads: 77, views: 1720, isFeatured: false, camera: "Hasselblad X2D", lens: "45mm f/3.5", aperture: "f/5.6", shutterSpeed: "1/500s", iso: 100, focalLength: "45mm" },
  { title: "Aerial Coastline", description: "Turquoise meets jade where the coral reef meets the open sea — shot from a small plane at dawn.", imageUrl: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600", width: 1600, height: 1067, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["aerial","ocean","travel","nature","abstract"], likes: 445, downloads: 198, views: 3780, isFeatured: true, camera: "Sony A7R V", lens: "35mm f/1.4 GM", aperture: "f/2.8", shutterSpeed: "1/800s", iso: 100, focalLength: "35mm" },
  { title: "Storm Over the Pacific", description: "Dark cumulonimbus clouds build over the ocean — electricity in the air, sea turning iron-grey.", imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600", width: 1600, height: 900, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["ocean","weather","landscape","drama","storm"], likes: 267, downloads: 99, views: 2100, isFeatured: false, camera: "Hasselblad X2D", lens: "90mm f/2.5", aperture: "f/8", shutterSpeed: "1/1000s", iso: 100, focalLength: "90mm" },
  { title: "Macro World", description: "Dew drops on a spider web, each one a tiny universe reflecting the world around it.", imageUrl: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600", width: 1600, height: 1067, photographerName: "Yuki Tanaka", photographerAvatarUrl: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200", tags: ["macro","nature","abstract","wildlife","dew"], likes: 534, downloads: 232, views: 4600, isFeatured: false, camera: "Canon R5", lens: "100mm f/2.8L Macro IS", aperture: "f/8", shutterSpeed: "1/200s", iso: 200, focalLength: "100mm" },
  { title: "Ice Crystals", description: "Frost forming on a window pane, each crystal growing in perfect hexagonal symmetry.", imageUrl: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600", width: 1600, height: 1067, photographerName: "Yuki Tanaka", photographerAvatarUrl: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200", tags: ["macro","abstract","winter","ice","nature"], likes: 411, downloads: 178, views: 3340, isFeatured: false, camera: "Canon R5", lens: "MP-E 65mm f/2.8 1-5x", aperture: "f/11", shutterSpeed: "1/160s", iso: 200, focalLength: "65mm" },
  { title: "Geometric Light", description: "Shadows of a Venetian blind projected onto a white wall — graphic lines, shifting hour by hour.", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600", width: 1600, height: 1067, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["abstract","light","minimal","architecture","graphic"], likes: 329, downloads: 136, views: 2730, isFeatured: false, camera: "Nikon Z8", lens: "50mm f/1.8 S", aperture: "f/8", shutterSpeed: "1/125s", iso: 64, focalLength: "50mm" },
  { title: "Window Light Portrait", description: "Soft north-facing window light sculpts a face with quiet authority. No reflector, no strobe — just the room.", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600", width: 1067, height: 1600, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["portrait","light","minimal","documentary"], likes: 476, downloads: 193, views: 3950, isFeatured: false, camera: "Fujifilm GFX 100S", lens: "110mm f/2", aperture: "f/2.8", shutterSpeed: "1/80s", iso: 400, focalLength: "110mm" },
  { title: "Fisherman at Dawn", description: "A fisherman casting his net on the Mekong Delta, silhouetted against the rising sun.", imageUrl: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["documentary","travel","portrait","golden-hour","vietnam"], likes: 554, downloads: 237, views: 4750, isFeatured: true, camera: "Leica M11", lens: "90mm f/2 Summicron APO", aperture: "f/4", shutterSpeed: "1/500s", iso: 400, focalLength: "90mm" },
  { title: "Hands at Work", description: "A potter's hands shaping clay — the intimacy of craft, captured mid-motion.", imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600", width: 1600, height: 1067, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["documentary","portrait","craft","hands","minimal"], likes: 318, downloads: 134, views: 2600, isFeatured: false, camera: "Hasselblad X2D", lens: "135mm f/2.8", aperture: "f/3.5", shutterSpeed: "1/160s", iso: 800, focalLength: "135mm" },
  { title: "Brutalist Symmetry", description: "The raw concrete geometry of a 1970s civic building — angular, imposing, secretly beautiful.", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600", width: 1600, height: 1200, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["architecture","brutalism","urban","minimal","black & white"], likes: 287, downloads: 118, views: 2350, isFeatured: false, camera: "Nikon Z8", lens: "24mm f/1.8 S", aperture: "f/8", shutterSpeed: "1/250s", iso: 64, focalLength: "24mm" },
  { title: "Gothic Vaulting", description: "Looking straight up into the ribbed vaulting of a medieval cathedral — stone suspended in impossible arcs.", imageUrl: "https://images.unsplash.com/photo-1466354424719-343280fe118b?w=1600", width: 1067, height: 1600, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["architecture","cathedral","travel","europe","interior"], likes: 361, downloads: 155, views: 2980, isFeatured: false, camera: "Nikon Z8", lens: "14-24mm f/2.8 S", aperture: "f/8", shutterSpeed: "1/30s", iso: 3200, focalLength: "14mm" },
  { title: "Milky Way Arch", description: "The galactic core arching over a dark desert mesa — 4,000 light-years of history in a single frame.", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["astrophotography","night","landscape","stars","milky-way"], likes: 723, downloads: 312, views: 6400, isFeatured: true, camera: "Sony A7S III", lens: "14mm f/1.8 GM", aperture: "f/1.8", shutterSpeed: "20s", iso: 6400, focalLength: "14mm" },
  { title: "Eagle in Flight", description: "A bald eagle banking hard over an Alaskan salmon river — every feather crisp at 1/4000s.", imageUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["wildlife","birds","nature","alaska","action"], likes: 631, downloads: 267, views: 5300, isFeatured: false, camera: "Sony A9 III", lens: "600mm f/4 GM", aperture: "f/5.6", shutterSpeed: "1/4000s", iso: 1600, focalLength: "600mm" },
  { title: "Elephant at Dusk", description: "A lone elephant silhouetted against the burning Amboseli sky with Kilimanjaro ghosted in the background.", imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=1600", width: 1600, height: 1067, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["wildlife","africa","landscape","golden-hour","kenya"], likes: 698, downloads: 293, views: 5850, isFeatured: true, camera: "Fujifilm GFX 100S", lens: "500mm f/5.6 R LM OIS WR", aperture: "f/6.3", shutterSpeed: "1/1000s", iso: 800, focalLength: "500mm" },
];

const SEED_COLLECTIONS: Array<{ name: string; description: string; coverImageUrl: string; photoTitles: string[] }> = [
  { name: "The Golden Hour", description: "Every photograph made when the sun is low — that fleeting window of warmth and long shadows.", coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", photoTitles: ["Golden Hour in the Alps","Fisherman at Dawn","Elephant at Dusk","Desert Geometry","The Lone Pine"] },
  { name: "Landscapes", description: "Sweeping views of untouched nature — from frozen tundra to sun-scorched desert.", coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", photoTitles: ["Desert Geometry","Icelandic Horizon","Salt Flats Mirror","Forest Light","Lavender Fields","The Lone Pine"] },
  { name: "Urban Stories", description: "Life unfolding on city streets — every frame a document of how we share space.", coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", photoTitles: ["Quiet Streets of Kyoto","Black & White Tokyo","Night Market Colours","Monsoon Reflections","Rain on Glass","City Lights from Above"] },
  { name: "Minimal", description: "Less is more — clean compositions, quiet beauty, and the power of negative space.", coverImageUrl: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=800", photoTitles: ["Salt Flats Mirror","Desert Geometry","Geometric Light","Ocean Solitude","Brutalist Symmetry","Hands at Work"] },
  { name: "Ocean & Water", description: "Everything water — from still reflections to crashing surf and the open Pacific.", coverImageUrl: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800", photoTitles: ["Ocean Solitude","Aerial Coastline","Icelandic Horizon","Storm Over the Pacific","Monsoon Reflections"] },
  { name: "Night & Stars", description: "The world after dark — astrophotography, city glow, and the drama of available light.", coverImageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", photoTitles: ["Milky Way Arch","City Lights from Above","Night Market Colours","Rain on Glass"] },
];

router.get("/admin/seed/status", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [photoRow] = await db.select({ count: count() }).from(photosTable);
    const [colRow] = await db.select({ count: count() }).from(collectionsTable);
    const photos = photoRow?.count ?? 0;
    const collections = colRow?.count ?? 0;
    res.json({ photos, collections, hasData: photos > 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to get seed status", details: String(err) });
  }
});

router.post("/admin/seed", requireAdmin, async (req, res): Promise<void> => {
  const force = req.query["force"] === "true";

  try {
    const [photoRow] = await db.select({ count: count() }).from(photosTable);
    const existing = photoRow?.count ?? 0;

    if (existing > 0 && !force) {
      res.status(409).json({ error: "Data already exists. Use force=true to wipe and reseed." });
      return;
    }

    if (force) {
      await db.delete(collectionPhotosTable);
      await db.delete(collectionsTable);
      await db.delete(photosTable);
    }

    const photoIdMap = new Map<string, number>();
    for (const p of SEED_PHOTOS) {
      const inserted = await db.insert(photosTable).values({
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        width: p.width,
        height: p.height,
        photographerName: p.photographerName,
        photographerAvatarUrl: p.photographerAvatarUrl,
        tags: p.tags,
        likes: p.likes,
        downloads: p.downloads,
        views: p.views,
        isFeatured: p.isFeatured,
        camera: p.camera,
        lens: p.lens,
        aperture: p.aperture,
        shutterSpeed: p.shutterSpeed,
        iso: p.iso,
        focalLength: p.focalLength,
        license: "cc0",
        status: "published",
      }).returning({ id: photosTable.id });
      photoIdMap.set(p.title, inserted[0]!.id);
    }

    for (const col of SEED_COLLECTIONS) {
      const inserted = await db.insert(collectionsTable).values({
        name: col.name,
        description: col.description,
        coverImageUrl: col.coverImageUrl,
      }).returning({ id: collectionsTable.id });
      const colId = inserted[0]!.id;
      for (const title of col.photoTitles) {
        const photoId = photoIdMap.get(title);
        if (!photoId) continue;
        await db.insert(collectionPhotosTable).values({ collectionId: colId, photoId }).onConflictDoNothing();
      }
    }

    res.json({
      ok: true,
      photos: SEED_PHOTOS.length,
      collections: SEED_COLLECTIONS.length,
      wiped: force && existing > 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Seed failed", details: String(err) });
  }
});

export default router;

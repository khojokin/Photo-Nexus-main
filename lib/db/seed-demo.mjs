/**
 * Demo seed — populates the database with realistic photos, photographers and collections.
 * Run: node lib/db/seed-demo.mjs
 */

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Photographers ────────────────────────────────────────────────────────────

const PHOTOGRAPHERS = [
  { name: "Aria Chen", avatar: null },
  { name: "Marcus Reid", avatar: null },
  { name: "Hiroshi Nakamura", avatar: null },
  { name: "Lena Fischer", avatar: null },
  { name: "Miguel Santos", avatar: null },
  { name: "Amara Osei", avatar: null },
  { name: "Sofia Petrov", avatar: null },
  { name: "James Harlow", avatar: null },
];

// ─── Photos ───────────────────────────────────────────────────────────────────
// Using real Unsplash photo IDs (w=1600&q=85 for quality)
const BASE = "https://images.unsplash.com/photo-";
const u = (id, w = 1600) => `${BASE}${id}?w=${w}&q=85&auto=format&fit=crop`;

const PHOTOS = [
  // Aria Chen — landscape / nature
  {
    title: "Mountain at Dusk",
    description: "The last light of evening catches the ridgeline in shades of amber and violet.",
    imageUrl: u("1506905925346-21bda4d32df4"),
    width: 5184, height: 3456,
    photographerName: "Aria Chen",
    tags: ["landscape", "mountains", "golden hour", "nature"],
    likes: 312, downloads: 98, views: 4210, isFeatured: true,
    camera: "Sony A7R IV", lens: "24-70mm f/2.8", aperture: "f/8", shutterSpeed: "1/250s", iso: 200,
    license: "cc0",
  },
  {
    title: "Alpine Mirror",
    description: "Still water reflects the peaks above with perfect symmetry.",
    imageUrl: u("1504593811423-6dd665756598"),
    width: 6000, height: 4000,
    photographerName: "Aria Chen",
    tags: ["lake", "mountains", "reflection", "nature", "landscape"],
    likes: 478, downloads: 143, views: 6820, isFeatured: true,
    camera: "Sony A7R IV", lens: "16-35mm f/4", aperture: "f/11", shutterSpeed: "0.5s", iso: 100,
    license: "cc0",
  },
  {
    title: "Into the Mist",
    description: "A lone trail disappears into morning fog blanketing the valley.",
    imageUrl: u("1518020382113-a7e8fc38cd49"),
    width: 4896, height: 3264,
    photographerName: "Aria Chen",
    tags: ["fog", "forest", "nature", "moody", "landscape"],
    likes: 221, downloads: 67, views: 3190,
    camera: "Sony A7R IV", lens: "70-200mm f/4", aperture: "f/5.6", shutterSpeed: "1/400s", iso: 400,
    license: "cc0",
  },
  {
    title: "Autumn Canopy",
    description: "October light filters through a cathedral of turning maples.",
    imageUrl: u("1493246507009-8163566a7a5c"),
    width: 5472, height: 3648,
    photographerName: "Aria Chen",
    tags: ["autumn", "forest", "trees", "nature", "light"],
    likes: 187, downloads: 54, views: 2740,
    camera: "Fujifilm GFX 100S", lens: "32-64mm", aperture: "f/4", shutterSpeed: "1/320s", iso: 200,
    license: "editorial",
  },
  {
    title: "First Snow",
    description: "Silence arrives with the first heavy snowfall of the season.",
    imageUrl: u("1529271230144-e8c648ef570d"),
    width: 6000, height: 4000,
    photographerName: "Aria Chen",
    tags: ["snow", "winter", "trees", "nature", "landscape"],
    likes: 156, downloads: 41, views: 2100,
    license: "cc0",
  },

  // Marcus Reid — urban / street
  {
    title: "Neon Crossroads",
    description: "Rush hour bleeds colour across wet asphalt in the financial district.",
    imageUrl: u("1477959858617-67f85cf4f1df"),
    width: 5184, height: 3456,
    photographerName: "Marcus Reid",
    tags: ["city", "night", "street", "urban", "neon"],
    likes: 543, downloads: 201, views: 8930, isFeatured: true,
    camera: "Nikon Z7 II", lens: "35mm f/1.4", aperture: "f/2", shutterSpeed: "1/60s", iso: 1600,
    license: "cc0",
  },
  {
    title: "Under the Bridge",
    description: "Geometric shadows of an elevated highway frame an unexpected portrait.",
    imageUrl: u("1525431498782-a51da9a02dbf"),
    width: 4480, height: 6720,
    photographerName: "Marcus Reid",
    tags: ["architecture", "urban", "shadows", "street"],
    likes: 298, downloads: 112, views: 4670,
    camera: "Nikon Z7 II", lens: "50mm f/1.8", aperture: "f/2.8", shutterSpeed: "1/500s", iso: 400,
    license: "cc0",
  },
  {
    title: "Rain Season",
    description: "A figure navigates a deserted street market in the downpour.",
    imageUrl: u("1547592166-23ac45744acd"),
    width: 4032, height: 3024,
    photographerName: "Marcus Reid",
    tags: ["rain", "street", "documentary", "urban", "moody"],
    likes: 367, downloads: 134, views: 5820,
    camera: "Leica M11", lens: "28mm f/2.8", aperture: "f/4", shutterSpeed: "1/125s", iso: 800,
    license: "cc0",
  },
  {
    title: "Last Train",
    description: "A solitary commuter waits on an empty platform at midnight.",
    imageUrl: u("1504700610630-ac6aba3536d3"),
    width: 6000, height: 4000,
    photographerName: "Marcus Reid",
    tags: ["urban", "night", "documentary", "light", "street"],
    likes: 209, downloads: 77, views: 3400,
    license: "cc0",
  },

  // Hiroshi Nakamura — minimalism / architecture
  {
    title: "Lines & Light",
    description: "The new cultural centre at noon — shadow and form in conversation.",
    imageUrl: u("1486325212027-8081e485255e"),
    width: 6720, height: 4480,
    photographerName: "Hiroshi Nakamura",
    tags: ["architecture", "minimalism", "geometry", "light", "modern"],
    likes: 612, downloads: 289, views: 11200, isFeatured: true,
    camera: "Canon EOS R5", lens: "24mm f/1.4", aperture: "f/8", shutterSpeed: "1/500s", iso: 100,
    license: "cc0",
  },
  {
    title: "Concrete Cathedral",
    description: "Brutalist interior — the architect's belief that form is devotion.",
    imageUrl: u("1516912481851-bc1df91f52b7"),
    width: 5184, height: 3456,
    photographerName: "Hiroshi Nakamura",
    tags: ["architecture", "interior", "minimalism", "brutalist", "light"],
    likes: 445, downloads: 178, views: 7800,
    camera: "Canon EOS R5", lens: "16-35mm f/2.8", aperture: "f/5.6", shutterSpeed: "1/60s", iso: 400,
    license: "cc0",
  },
  {
    title: "Sand Geometry",
    description: "Wind has sculpted perfect ridges across the dune face.",
    imageUrl: u("1546768292-e6a0c37393c6"),
    width: 6000, height: 4000,
    photographerName: "Hiroshi Nakamura",
    tags: ["desert", "minimalism", "texture", "abstract", "nature"],
    likes: 334, downloads: 121, views: 5600,
    license: "cc0",
  },
  {
    title: "Cobalt & Ochre",
    description: "A doorway in Chefchaouen — two colours in perfect tension.",
    imageUrl: u("1464278533981-50106e6176b1"),
    width: 4000, height: 6000,
    photographerName: "Hiroshi Nakamura",
    tags: ["door", "colour", "minimalism", "travel", "architecture"],
    likes: 289, downloads: 98, views: 4200,
    license: "editorial",
  },

  // Lena Fischer — portrait / fashion
  {
    title: "Natural Light Study",
    description: "Nothing but a north-facing window and patience.",
    imageUrl: u("1494790108377-be9c29b29330"),
    width: 4480, height: 6720,
    photographerName: "Lena Fischer",
    tags: ["portrait", "natural light", "fashion", "editorial", "people"],
    likes: 721, downloads: 312, views: 14500, isFeatured: true,
    camera: "Phase One IQ4", lens: "80mm f/2.8", aperture: "f/2.8", shutterSpeed: "1/250s", iso: 200,
    license: "all-rights-reserved",
  },
  {
    title: "Morning Ritual",
    description: "Quiet domesticity — shot in my studio apartment before the city woke.",
    imageUrl: u("1571091718767-18b5b1457add"),
    width: 5184, height: 3456,
    photographerName: "Lena Fischer",
    tags: ["lifestyle", "portrait", "interior", "morning", "editorial"],
    likes: 434, downloads: 167, views: 7200,
    camera: "Phase One IQ4", lens: "110mm f/2.8", aperture: "f/3.5", shutterSpeed: "1/320s", iso: 400,
    license: "all-rights-reserved",
  },
  {
    title: "Silhouette",
    description: "When the subject steps in front of the window, the image tells itself.",
    imageUrl: u("1521727857595-87e1a0cf5b7c"),
    width: 4000, height: 6000,
    photographerName: "Lena Fischer",
    tags: ["silhouette", "portrait", "light", "moody", "editorial"],
    likes: 589, downloads: 234, views: 9800,
    license: "cc0",
  },

  // Miguel Santos — travel / adventure
  {
    title: "Ocean Breath",
    description: "The Atlantic at high tide — all foam and urgency.",
    imageUrl: u("1505118380757-91f5f5632de0"),
    width: 6000, height: 4000,
    photographerName: "Miguel Santos",
    tags: ["ocean", "waves", "nature", "travel", "seascape"],
    likes: 398, downloads: 145, views: 6700, isFeatured: true,
    camera: "Nikon D850", lens: "14-24mm f/2.8", aperture: "f/11", shutterSpeed: "1/1000s", iso: 200,
    license: "cc0",
  },
  {
    title: "Desert Road",
    description: "Two thousand kilometres of red dirt between here and the coast.",
    imageUrl: u("1509316785289-025f5b846b35"),
    width: 5760, height: 3840,
    photographerName: "Miguel Santos",
    tags: ["desert", "travel", "landscape", "road", "adventure"],
    likes: 312, downloads: 118, views: 5400,
    camera: "Nikon D850", lens: "24-70mm f/2.8", aperture: "f/8", shutterSpeed: "1/500s", iso: 100,
    license: "cc0",
  },
  {
    title: "Golden Dunes",
    description: "The Sahara at sunrise holds light unlike anything else on earth.",
    imageUrl: u("1502751872490-8d26f5f3a4b8"),
    width: 6000, height: 4000,
    photographerName: "Miguel Santos",
    tags: ["desert", "dunes", "golden hour", "travel", "landscape"],
    likes: 456, downloads: 187, views: 8200,
    license: "cc0",
  },
  {
    title: "Waterfall Cathedral",
    description: "Standing at the base of a 90-metre waterfall in Iceland.",
    imageUrl: u("1503376780353-7e6692767b70"),
    width: 4480, height: 6720,
    photographerName: "Miguel Santos",
    tags: ["waterfall", "nature", "iceland", "travel", "adventure"],
    likes: 534, downloads: 212, views: 9600,
    camera: "Nikon D850", lens: "14-24mm f/2.8", aperture: "f/16", shutterSpeed: "1s", iso: 100,
    license: "cc0",
  },
  {
    title: "Beacon Light",
    description: "A lighthouse at the edge of the world — still faithfully burning.",
    imageUrl: u("1470770841072-f978cf4d019e"),
    width: 5184, height: 3456,
    photographerName: "Miguel Santos",
    tags: ["lighthouse", "seascape", "travel", "nature", "coast"],
    likes: 278, downloads: 89, views: 4800,
    license: "editorial",
  },

  // Amara Osei — documentary / people
  {
    title: "Market Day",
    description: "Trade routes unchanged for four centuries — photographed at first light.",
    imageUrl: u("1501854140801-50d01698950b"),
    width: 5760, height: 3840,
    photographerName: "Amara Osei",
    tags: ["documentary", "people", "market", "travel", "culture"],
    likes: 489, downloads: 198, views: 8900, isFeatured: true,
    camera: "Leica SL2", lens: "35mm f/1.4", aperture: "f/2", shutterSpeed: "1/500s", iso: 800,
    license: "editorial",
  },
  {
    title: "Field of Flowers",
    description: "A lavender harvest in Provence — the work before the photograph.",
    imageUrl: u("1475924156734-496f643ab56"),
    width: 6000, height: 4000,
    photographerName: "Amara Osei",
    tags: ["nature", "flowers", "landscape", "colour", "travel"],
    likes: 367, downloads: 134, views: 6300,
    license: "cc0",
  },
  {
    title: "Heritage Hands",
    description: "A weaver continues a craft her grandmother taught her.",
    imageUrl: u("1444084990430-f70f92be4f4a"),
    width: 4480, height: 6720,
    photographerName: "Amara Osei",
    tags: ["documentary", "hands", "craft", "culture", "people"],
    likes: 412, downloads: 156, views: 7100,
    license: "editorial",
  },

  // Sofia Petrov — abstract / fine art
  {
    title: "Light Painting",
    description: "Twelve minutes of long exposure in my studio — nothing moved except the lamp.",
    imageUrl: u("1552083375-1099950ad577"),
    width: 6000, height: 4000,
    photographerName: "Sofia Petrov",
    tags: ["abstract", "light", "fine art", "studio", "long exposure"],
    likes: 623, downloads: 267, views: 12400, isFeatured: true,
    camera: "Hasselblad X2D", lens: "90mm f/2.5", aperture: "f/16", shutterSpeed: "720s", iso: 50,
    license: "all-rights-reserved",
  },
  {
    title: "Ice Cave, Iceland",
    description: "Blue light inside the Vatnajökull glacier — a cathedral carved by time.",
    imageUrl: u("1435224654926-88d7a9cf5a0c"),
    width: 5184, height: 3456,
    photographerName: "Sofia Petrov",
    tags: ["ice", "cave", "abstract", "blue", "nature", "iceland"],
    likes: 789, downloads: 334, views: 15600, isFeatured: true,
    camera: "Hasselblad X2D", lens: "24mm f/4.5", aperture: "f/8", shutterSpeed: "4s", iso: 400,
    license: "cc0",
  },
  {
    title: "Forest Path, Dusk",
    description: "The last path through the wood before full dark — taken without a torch.",
    imageUrl: u("1495310814709-db7d81aff06a"),
    width: 4480, height: 6720,
    photographerName: "Sofia Petrov",
    tags: ["forest", "dusk", "nature", "moody", "fine art"],
    likes: 298, downloads: 112, views: 5200,
    license: "cc0",
  },
  {
    title: "Stardust",
    description: "A night spent in Atacama — every photograph a reminder of scale.",
    imageUrl: u("1540206395-68808572332f"),
    width: 6000, height: 4000,
    photographerName: "Sofia Petrov",
    tags: ["stars", "milky way", "night", "landscape", "astrophotography"],
    likes: 934, downloads: 412, views: 19800, isFeatured: true,
    camera: "Sony A7S III", lens: "14mm f/1.8", aperture: "f/1.8", shutterSpeed: "15s", iso: 6400,
    license: "cc0",
  },

  // James Harlow — wildlife / nature
  {
    title: "Misty Peaks",
    description: "Cloud cover breaks for eight seconds over the high ridgeline.",
    imageUrl: u("1469474968028-56623f02e42e"),
    width: 5760, height: 3840,
    photographerName: "James Harlow",
    tags: ["mountains", "mist", "landscape", "nature", "moody"],
    likes: 445, downloads: 178, views: 8400,
    camera: "Canon EOS R5", lens: "100-500mm f/4.5", aperture: "f/6.3", shutterSpeed: "1/800s", iso: 800,
    license: "cc0",
  },
  {
    title: "Tropical Clarity",
    description: "Shallow reef in the Maldives — visibility fifty metres in every direction.",
    imageUrl: u("1448317971280-6c74624b82c5"),
    width: 5184, height: 3456,
    photographerName: "James Harlow",
    tags: ["ocean", "tropical", "travel", "nature", "underwater"],
    likes: 567, downloads: 223, views: 10200,
    license: "cc0",
  },
  {
    title: "Winter Birch",
    description: "A stand of birch after the first heavy frost — silver and silence.",
    imageUrl: u("1513836279014-a89f7a76ae86"),
    width: 4000, height: 6000,
    photographerName: "James Harlow",
    tags: ["trees", "winter", "nature", "forest", "black and white"],
    likes: 378, downloads: 145, views: 6700,
    license: "cc0",
  },
  {
    title: "The Summit",
    description: "Four thousand metres — the effort to stand still long enough to press the shutter.",
    imageUrl: u("1444464666168-49d633b86797"),
    width: 5760, height: 3840,
    photographerName: "James Harlow",
    tags: ["mountains", "fog", "landscape", "adventure", "nature"],
    likes: 612, downloads: 256, views: 11800, isFeatured: true,
    camera: "Canon EOS R5", lens: "24-70mm f/2.8", aperture: "f/11", shutterSpeed: "1/500s", iso: 200,
    license: "cc0",
  },
  {
    title: "Paris in Rain",
    description: "A street in Montmartre at 6am — the city before it wakes.",
    imageUrl: u("1431794062232-2a99b8179f69"),
    width: 5184, height: 3456,
    photographerName: "James Harlow",
    tags: ["paris", "street", "rain", "travel", "moody"],
    likes: 489, downloads: 189, views: 9100,
    license: "editorial",
  },
];

// ─── Collections ──────────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    name: "Golden Hour",
    description: "Photography that captures the alchemy of the last hour of daylight.",
    coverImageUrl: u("1506905925346-21bda4d32df4", 800),
    photoTitles: ["Mountain at Dusk", "Alpine Mirror", "Desert Road", "Golden Dunes", "The Summit"],
  },
  {
    name: "Urban Geometry",
    description: "Cities as abstract compositions — lines, shadows, and steel.",
    coverImageUrl: u("1486325212027-8081e485255e", 800),
    photoTitles: ["Lines & Light", "Concrete Cathedral", "Under the Bridge", "Neon Crossroads", "Last Train"],
  },
  {
    name: "Into the Wild",
    description: "Landscapes that remind you how small we are.",
    coverImageUrl: u("1540206395-68808572332f", 800),
    photoTitles: ["Stardust", "Misty Peaks", "Waterfall Cathedral", "First Snow", "Alpine Mirror", "The Summit"],
  },
  {
    name: "Abstract & Fine Art",
    description: "Photography as a medium for pure visual expression.",
    coverImageUrl: u("1552083375-1099950ad577", 800),
    photoTitles: ["Light Painting", "Ice Cave, Iceland", "Sand Geometry", "Silhouette", "Cobalt & Ochre"],
  },
  {
    name: "Faces & Souls",
    description: "Portraits that linger — moments of stillness inside the noise.",
    coverImageUrl: u("1494790108377-be9c29b29330", 800),
    photoTitles: ["Natural Light Study", "Morning Ritual", "Silhouette", "Heritage Hands", "Market Day"],
  },
  {
    name: "Twilight & Stars",
    description: "When the sun is gone, the real show begins.",
    coverImageUrl: u("1540206395-68808572332f", 800),
    photoTitles: ["Stardust", "Neon Crossroads", "Last Train", "Beacon Light", "Rain Season"],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🌱 Seeding demo data…");

    // Clear existing
    await client.query("DELETE FROM collection_photos");
    await client.query("DELETE FROM collections");
    await client.query("DELETE FROM photos");

    // Insert photos
    const photoIds = {};
    for (const p of PHOTOS) {
      const res = await client.query(
        `INSERT INTO photos
          (title, description, image_url, width, height, photographer_name, photographer_avatar_url,
           tags, likes, downloads, views, is_featured, camera, lens, aperture, shutter_speed, iso,
           focal_length, license, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::text[],$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING id`,
        [
          p.title, p.description ?? null, p.imageUrl, p.width, p.height,
          p.photographerName, p.photographerAvatarUrl ?? null,
          `{${(p.tags ?? []).join(",")}}`,
          p.likes ?? 0, p.downloads ?? 0, p.views ?? 0, p.isFeatured ?? false,
          p.camera ?? null, p.lens ?? null, p.aperture ?? null,
          p.shutterSpeed ?? null, p.iso ?? null, p.focalLength ?? null,
          p.license ?? "cc0", "published",
        ]
      );
      photoIds[p.title] = res.rows[0].id;
      process.stdout.write(".");
    }
    console.log(`\n✅ ${PHOTOS.length} photos inserted`);

    // Insert collections + junction rows
    for (const col of COLLECTIONS) {
      const res = await client.query(
        `INSERT INTO collections (name, description, cover_image_url, is_private)
         VALUES ($1, $2, $3, false) RETURNING id`,
        [col.name, col.description, col.coverImageUrl]
      );
      const colId = res.rows[0].id;

      let pos = 1;
      for (const title of col.photoTitles) {
        const pid = photoIds[title];
        if (!pid) continue;
        await client.query(
          `INSERT INTO collection_photos (collection_id, photo_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [colId, pid]
        );
        pos++;
      }
    }
    console.log(`✅ ${COLLECTIONS.length} collections inserted`);
    console.log("✨ Seed complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

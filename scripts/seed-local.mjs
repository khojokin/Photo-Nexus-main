import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const photos = [
  {
    title: "Golden Hour in the Alps",
    description: "Warm light cascading over snow-capped peaks at dusk.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    tags: ["landscape", "mountains", "golden-hour", "nature"],
    likes: 342, downloads: 128, is_featured: true,
  },
  {
    title: "Quiet Streets of Kyoto",
    description: "A misty morning walk through the historic lanes of Kyoto.",
    image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    tags: ["street", "japan", "travel", "urban"],
    likes: 218, downloads: 94, is_featured: true,
  },
  {
    title: "Desert Geometry",
    description: "Abstract patterns formed by sand dunes in the Sahara.",
    image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    tags: ["desert", "abstract", "landscape", "minimal"],
    likes: 487, downloads: 201, is_featured: true,
  },
  {
    title: "Ocean Solitude",
    description: "A lone figure standing at the edge of an endless sea.",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Sofia Andersen",
    tags: ["ocean", "portrait", "minimal", "travel"],
    likes: 193, downloads: 77, is_featured: false,
  },
  {
    title: "Forest Light",
    description: "Shafts of morning light piercing through ancient redwoods.",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    tags: ["forest", "nature", "light", "landscape"],
    likes: 311, downloads: 143, is_featured: false,
  },
  {
    title: "Rain on Glass",
    description: "Raindrops refracting city lights on a taxi window.",
    image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    tags: ["abstract", "urban", "rain", "street"],
    likes: 265, downloads: 109, is_featured: false,
  },
  {
    title: "Icelandic Horizon",
    description: "Volcanic black sand beach meeting a stormy Atlantic sky.",
    image_url: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Ingrid Bjornsson",
    tags: ["iceland", "landscape", "ocean", "travel"],
    likes: 402, downloads: 167, is_featured: true,
  },
  {
    title: "Terracotta Rooftops",
    description: "Looking out over a sun-drenched hillside village in Tuscany.",
    image_url: "https://images.unsplash.com/photo-1534445538923-ab38b6c0d8d1?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Lorenzo Ricci",
    tags: ["architecture", "italy", "travel", "urban"],
    likes: 178, downloads: 62, is_featured: false,
  },
  {
    title: "Macro World",
    description: "Dew drops on a spider web, each one a tiny universe.",
    image_url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    tags: ["macro", "nature", "abstract", "wildlife"],
    likes: 534, downloads: 232, is_featured: false,
  },
  {
    title: "Night Market Colours",
    description: "The vibrant chaos of a Bangkok night market at full swing.",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    tags: ["street", "travel", "urban", "night"],
    likes: 298, downloads: 118, is_featured: false,
  },
  {
    title: "The Lone Pine",
    description: "A solitary pine tree silhouetted against a violet sky.",
    image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    tags: ["nature", "minimal", "landscape", "trees"],
    likes: 421, downloads: 189, is_featured: false,
  },
  {
    title: "Salt Flats Mirror",
    description: "A perfect reflection of the sky on Bolivia's Salar de Uyuni.",
    image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Carlos Mendez",
    tags: ["landscape", "travel", "minimal", "aerial"],
    likes: 612, downloads: 274, is_featured: true,
  },
  {
    title: "Monsoon Reflections",
    description: "A flooded alley mirrors neon signs after heavy rain in Mumbai.",
    image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    tags: ["street", "rain", "urban", "documentary"],
    likes: 374, downloads: 152, is_featured: false,
  },
  {
    title: "Aerial Coastline",
    description: "Turquoise meets jade where the coral reef meets the open sea.",
    image_url: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    tags: ["aerial", "ocean", "travel", "nature"],
    likes: 445, downloads: 198, is_featured: true,
  },
  {
    title: "Black & White Tokyo",
    description: "Rush hour at Shinjuku station in high-contrast monochrome.",
    image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    tags: ["black & white", "street", "japan", "documentary"],
    likes: 509, downloads: 221, is_featured: false,
  },
  {
    title: "Lavender Fields",
    description: "Endless rows of lavender fade into the Provençal horizon.",
    image_url: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    tags: ["nature", "landscape", "travel", "france"],
    likes: 388, downloads: 164, is_featured: false,
  },
];

async function run() {
  await client.connect();
  console.log("Connected to local DB.");

  const existing = await client.query("SELECT COUNT(*) FROM photos");
  if (parseInt(existing.rows[0].count) > 0) {
    console.log(`${existing.rows[0].count} photos already exist — skipping seed.`);
    await client.end();
    return;
  }

  for (const p of photos) {
    await client.query(
      `INSERT INTO photos (title, description, image_url, width, height, photographer_name, tags, likes, downloads, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [p.title, p.description, p.image_url, p.width, p.height, p.photographer_name,
       p.tags, p.likes, p.downloads, p.is_featured]
    );
  }

  console.log(`Seeded ${photos.length} photos.`);

  await client.query(`
    INSERT INTO collections (name, description) VALUES
    ('Landscapes', 'Sweeping views of untouched nature.'),
    ('Urban Stories', 'Life unfolding in the city.'),
    ('Minimal', 'Less is more — clean compositions and quiet beauty.')
  `);
  console.log("Seeded 3 collections.");

  await client.end();
  console.log("Done!");
}

run().catch((e) => { console.error(e.message); process.exit(1); });

import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;

const pass = process.env.SUPABASE_DB_PASSWORD;
if (!pass) {
  console.error("SUPABASE_DB_PASSWORD is not set");
  process.exit(1);
}

const enc = encodeURIComponent(pass);
const url = `postgresql://postgres:${enc}@db.jpsymmcwinxvpxlrhrrn.supabase.co:5432/postgres`;

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log("Connected to Supabase!");

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      width INTEGER NOT NULL DEFAULT 1920,
      height INTEGER NOT NULL DEFAULT 1280,
      photographer_name VARCHAR(120) NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      likes INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      uploaded_by VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      cover_image_url TEXT,
      created_by VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS collection_photos (
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection_id, photo_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      profile_image_url TEXT,
      google_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(255) PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("Tables created.");

  // Check if photos already exist
  const existing = await client.query("SELECT COUNT(*) FROM photos");
  if (parseInt(existing.rows[0].count) > 0) {
    console.log(`${existing.rows[0].count} photos already exist — skipping seed.`);
    await client.end();
    return;
  }

  // Seed sample photos
  const photos = [
    {
      title: "Golden Hour in the Alps",
      description: "Warm light cascading over snow-capped peaks at dusk.",
      image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Elena Vasquez",
      tags: ["landscape", "mountains", "golden-hour", "nature"],
      likes: 342, downloads: 128, views: 2100, is_featured: true,
    },
    {
      title: "Quiet Streets of Kyoto",
      description: "A misty morning walk through the historic lanes of Kyoto.",
      image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Kenji Watanabe",
      tags: ["street", "japan", "travel", "urban"],
      likes: 218, downloads: 94, views: 1540, is_featured: true,
    },
    {
      title: "Desert Geometry",
      description: "Abstract patterns formed by sand dunes in the Sahara.",
      image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Amara Diallo",
      tags: ["desert", "abstract", "landscape", "minimal"],
      likes: 487, downloads: 201, views: 3200, is_featured: true,
    },
    {
      title: "Ocean Solitude",
      description: "A lone figure standing at the edge of an endless sea.",
      image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Sofia Andersen",
      tags: ["ocean", "portrait", "minimal", "travel"],
      likes: 193, downloads: 77, views: 980, is_featured: false,
    },
    {
      title: "Forest Light",
      description: "Shafts of morning light piercing through ancient redwoods.",
      image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Marcus Chen",
      tags: ["forest", "nature", "light", "landscape"],
      likes: 311, downloads: 143, views: 1870, is_featured: false,
    },
    {
      title: "Rain on Glass",
      description: "Raindrops refracting city lights on a taxi window.",
      image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Priya Sharma",
      tags: ["abstract", "urban", "rain", "street"],
      likes: 265, downloads: 109, views: 1420, is_featured: false,
    },
    {
      title: "Icelandic Horizon",
      description: "Volcanic black sand beach meeting a stormy Atlantic sky.",
      image_url: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Ingrid Bjornsson",
      tags: ["iceland", "landscape", "ocean", "travel"],
      likes: 402, downloads: 167, views: 2650, is_featured: true,
    },
    {
      title: "Terracotta Rooftops",
      description: "Looking out over a sun-drenched hillside village in Tuscany.",
      image_url: "https://images.unsplash.com/photo-1534445538923-ab38b6c0d8d1?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Lorenzo Ricci",
      tags: ["architecture", "italy", "travel", "urban"],
      likes: 178, downloads: 62, views: 890, is_featured: false,
    },
    {
      title: "Macro World",
      description: "Dew drops on a spider web, each one a tiny universe.",
      image_url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Yuki Tanaka",
      tags: ["macro", "nature", "abstract", "wildlife"],
      likes: 534, downloads: 232, views: 3890, is_featured: false,
    },
    {
      title: "Night Market Colours",
      description: "The vibrant chaos of a Bangkok night market at full swing.",
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Nathalie Dupont",
      tags: ["street", "travel", "urban", "night"],
      likes: 298, downloads: 118, views: 1760, is_featured: false,
    },
    {
      title: "The Lone Pine",
      description: "A solitary pine tree silhouetted against a violet sky.",
      image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Elena Vasquez",
      tags: ["nature", "minimal", "landscape", "trees"],
      likes: 421, downloads: 189, views: 2980, is_featured: false,
    },
    {
      title: "Salt Flats Mirror",
      description: "A perfect reflection of the sky on Bolivia's Salar de Uyuni.",
      image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=1600",
      width: 1600, height: 1067,
      photographer_name: "Carlos Mendez",
      tags: ["landscape", "travel", "minimal", "aerial"],
      likes: 612, downloads: 274, views: 4200, is_featured: true,
    },
  ];

  for (const p of photos) {
    await client.query(
      `INSERT INTO photos (title, description, image_url, width, height, photographer_name, tags, likes, downloads, views, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [p.title, p.description, p.image_url, p.width, p.height, p.photographer_name,
       p.tags, p.likes, p.downloads, p.views, p.is_featured]
    );
  }

  console.log(`Seeded ${photos.length} photos.`);

  // Seed collections
  const colResult = await client.query(
    `INSERT INTO collections (name, description) VALUES
     ('Landscapes', 'Sweeping views of untouched nature.'),
     ('Urban Stories', 'Life unfolding in the city.'),
     ('Minimal', 'Less is more — clean compositions and quiet beauty.')
     RETURNING id`
  );
  console.log(`Seeded ${colResult.rows.length} collections.`);

  await client.end();
  console.log("Done!");
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

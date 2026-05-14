import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const photos = [
  // ── Landscapes ──
  {
    title: "Golden Hour in the Alps",
    description: "Warm light cascading over snow-capped peaks at dusk. Shot just after the sun dipped below the ridge, painting the clouds amber.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["landscape", "mountains", "golden-hour", "nature"],
    likes: 342, downloads: 128, views: 2840, is_featured: true,
    camera: "Sony A7R V", lens: "24-70mm f/2.8 GM", aperture: "f/8", shutter_speed: "1/250s", iso: 100, focal_length: "35mm",
    license: "cc0",
  },
  {
    title: "Icelandic Horizon",
    description: "Volcanic black sand beach meeting a stormy Atlantic sky. The contrast between the dark shore and silver waves is otherworldly.",
    image_url: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Ingrid Bjornsson",
    photographer_avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    tags: ["iceland", "landscape", "ocean", "travel"],
    likes: 402, downloads: 167, views: 3210, is_featured: true,
    camera: "Nikon Z9", lens: "14-24mm f/2.8 S", aperture: "f/11", shutter_speed: "1/125s", iso: 200, focal_length: "18mm",
    license: "cc0",
  },
  {
    title: "Salt Flats Mirror",
    description: "A perfect reflection of the sky on Bolivia's Salar de Uyuni after light rain — the world's largest natural mirror.",
    image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Carlos Mendez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    tags: ["landscape", "travel", "minimal", "aerial", "bolivia"],
    likes: 612, downloads: 274, views: 5100, is_featured: true,
    camera: "Canon R5", lens: "16-35mm f/2.8L", aperture: "f/9", shutter_speed: "1/200s", iso: 100, focal_length: "16mm",
    license: "cc0",
  },
  {
    title: "Desert Geometry",
    description: "Abstract patterns formed by sand dunes in the Sahara at first light. The raking light reveals every ripple in the sand.",
    image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    tags: ["desert", "abstract", "landscape", "minimal", "sahara"],
    likes: 487, downloads: 201, views: 4020, is_featured: true,
    camera: "Fujifilm GFX 100S", lens: "32-64mm f/4", aperture: "f/8", shutter_speed: "1/400s", iso: 50, focal_length: "64mm",
    license: "cc0",
  },
  {
    title: "Forest Light",
    description: "Shafts of morning light piercing through ancient redwoods, turning the mist into golden curtains.",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    tags: ["forest", "nature", "light", "landscape", "california"],
    likes: 311, downloads: 143, views: 2670, is_featured: false,
    camera: "Sony A7R V", lens: "85mm f/1.4 GM", aperture: "f/4", shutter_speed: "1/60s", iso: 400, focal_length: "85mm",
    license: "cc0",
  },
  {
    title: "The Lone Pine",
    description: "A solitary pine tree silhouetted against a violet sky at twilight — the last moment before darkness.",
    image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["nature", "minimal", "landscape", "trees", "twilight"],
    likes: 421, downloads: 189, views: 3500, is_featured: false,
    camera: "Sony A7R V", lens: "24-70mm f/2.8 GM", aperture: "f/5.6", shutter_speed: "1/30s", iso: 800, focal_length: "55mm",
    license: "cc0",
  },
  {
    title: "Lavender Fields",
    description: "Endless rows of lavender fade into the Provençal horizon under an overcast sky, the scent almost palpable.",
    image_url: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    tags: ["nature", "landscape", "travel", "france", "flowers"],
    likes: 388, downloads: 164, views: 3140, is_featured: false,
    camera: "Canon R6 II", lens: "70-200mm f/2.8L IS", aperture: "f/4", shutter_speed: "1/500s", iso: 200, focal_length: "135mm",
    license: "cc0",
  },

  // ── Urban & Street ──
  {
    title: "Quiet Streets of Kyoto",
    description: "A misty morning walk through the historic lanes of Kyoto — paper lanterns still glowing at dawn.",
    image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200",
    tags: ["street", "japan", "travel", "urban", "kyoto"],
    likes: 218, downloads: 94, views: 1980, is_featured: true,
    camera: "Leica M11", lens: "35mm f/1.4 Summilux", aperture: "f/2.8", shutter_speed: "1/60s", iso: 1600, focal_length: "35mm",
    license: "cc0",
  },
  {
    title: "Rain on Glass",
    description: "Raindrops refracting city lights on a taxi window — the whole city reduced to bokeh circles.",
    image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    photographer_avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200",
    tags: ["abstract", "urban", "rain", "street", "night"],
    likes: 265, downloads: 109, views: 2340, is_featured: false,
    camera: "Canon R5", lens: "50mm f/1.2L", aperture: "f/1.4", shutter_speed: "1/80s", iso: 3200, focal_length: "50mm",
    license: "cc0",
  },
  {
    title: "Black & White Tokyo",
    description: "Rush hour at Shinjuku station in high-contrast monochrome — a thousand stories in a single frame.",
    image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200",
    tags: ["black & white", "street", "japan", "documentary", "tokyo"],
    likes: 509, downloads: 221, views: 4300, is_featured: false,
    camera: "Leica M11 Monochrom", lens: "28mm f/2 Summicron", aperture: "f/5.6", shutter_speed: "1/250s", iso: 800, focal_length: "28mm",
    license: "cc0",
  },
  {
    title: "Night Market Colours",
    description: "The vibrant chaos of a Bangkok night market at full swing — colour, smoke, and motion.",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    tags: ["street", "travel", "urban", "night", "thailand"],
    likes: 298, downloads: 118, views: 2560, is_featured: false,
    camera: "Canon R6 II", lens: "24mm f/1.4L", aperture: "f/2", shutter_speed: "1/40s", iso: 6400, focal_length: "24mm",
    license: "cc0",
  },
  {
    title: "Terracotta Rooftops",
    description: "Looking out over a sun-drenched hillside village in Tuscany — history baked into every tile.",
    image_url: "https://images.unsplash.com/photo-1534445538923-ab38b6c0d8d1?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    tags: ["architecture", "italy", "travel", "urban", "tuscany"],
    likes: 178, downloads: 62, views: 1540, is_featured: false,
    camera: "Nikon Z8", lens: "24-120mm f/4 S", aperture: "f/8", shutter_speed: "1/320s", iso: 100, focal_length: "70mm",
    license: "cc0",
  },
  {
    title: "Monsoon Reflections",
    description: "A flooded alley mirrors neon signs after heavy rain in Mumbai. The city doubled, abstract.",
    image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    photographer_avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200",
    tags: ["street", "rain", "urban", "documentary", "india"],
    likes: 374, downloads: 152, views: 3020, is_featured: false,
    camera: "Canon R5", lens: "35mm f/1.4L", aperture: "f/2.8", shutter_speed: "1/100s", iso: 1600, focal_length: "35mm",
    license: "cc0",
  },
  {
    title: "City Lights from Above",
    description: "New York at 11pm from a helicopter — a circuit board of amber and white, alive with motion.",
    image_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    tags: ["aerial", "night", "urban", "new-york", "cityscape"],
    likes: 489, downloads: 211, views: 4100, is_featured: false,
    camera: "Sony A7R V", lens: "35mm f/1.4 GM", aperture: "f/2.8", shutter_speed: "1/60s", iso: 6400, focal_length: "35mm",
    license: "cc0",
  },

  // ── Ocean & Water ──
  {
    title: "Ocean Solitude",
    description: "A lone figure standing at the edge of an endless sea. Scale made tangible — human vs. infinite.",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200",
    tags: ["ocean", "portrait", "minimal", "travel", "solitude"],
    likes: 193, downloads: 77, views: 1720, is_featured: false,
    camera: "Hasselblad X2D", lens: "45mm f/3.5", aperture: "f/5.6", shutter_speed: "1/500s", iso: 100, focal_length: "45mm",
    license: "cc0",
  },
  {
    title: "Aerial Coastline",
    description: "Turquoise meets jade where the coral reef meets the open sea — shot from a small plane at dawn.",
    image_url: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    tags: ["aerial", "ocean", "travel", "nature", "abstract"],
    likes: 445, downloads: 198, views: 3780, is_featured: true,
    camera: "Sony A7R V", lens: "35mm f/1.4 GM", aperture: "f/2.8", shutter_speed: "1/800s", iso: 100, focal_length: "35mm",
    license: "cc0",
  },
  {
    title: "Storm Over the Pacific",
    description: "Dark cumulonimbus clouds build over the ocean — electricity in the air, sea turning iron-grey.",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600",
    width: 1600, height: 900,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200",
    tags: ["ocean", "weather", "landscape", "drama", "storm"],
    likes: 267, downloads: 99, views: 2100, is_featured: false,
    camera: "Hasselblad X2D", lens: "90mm f/2.5", aperture: "f/8", shutter_speed: "1/1000s", iso: 100, focal_length: "90mm",
    license: "cc0",
  },

  // ── Macro & Abstract ──
  {
    title: "Macro World",
    description: "Dew drops on a spider web, each one a tiny universe reflecting the world around it.",
    image_url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    photographer_avatar_url: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200",
    tags: ["macro", "nature", "abstract", "wildlife", "dew"],
    likes: 534, downloads: 232, views: 4600, is_featured: false,
    camera: "Canon R5", lens: "100mm f/2.8L Macro IS", aperture: "f/8", shutter_speed: "1/200s", iso: 200, focal_length: "100mm",
    license: "cc0",
  },
  {
    title: "Ice Crystals",
    description: "Frost forming on a window pane, each crystal growing in perfect hexagonal symmetry.",
    image_url: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    photographer_avatar_url: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200",
    tags: ["macro", "abstract", "winter", "ice", "nature"],
    likes: 411, downloads: 178, views: 3340, is_featured: false,
    camera: "Canon R5", lens: "MP-E 65mm f/2.8 1-5x", aperture: "f/11", shutter_speed: "1/160s", iso: 200, focal_length: "65mm",
    license: "cc0",
  },
  {
    title: "Geometric Light",
    description: "Shadows of a Venetian blind projected onto a white wall — graphic lines, shifting hour by hour.",
    image_url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    tags: ["abstract", "light", "minimal", "architecture", "graphic"],
    likes: 329, downloads: 136, views: 2730, is_featured: false,
    camera: "Nikon Z8", lens: "50mm f/1.8 S", aperture: "f/8", shutter_speed: "1/125s", iso: 64, focal_length: "50mm",
    license: "cc0",
  },

  // ── Portrait & People ──
  {
    title: "Window Light Portrait",
    description: "Soft north-facing window light sculpts a face with quiet authority. No reflector, no strobe — just the room.",
    image_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600",
    width: 1067, height: 1600,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    tags: ["portrait", "light", "minimal", "documentary"],
    likes: 476, downloads: 193, views: 3950, is_featured: false,
    camera: "Fujifilm GFX 100S", lens: "110mm f/2", aperture: "f/2.8", shutter_speed: "1/80s", iso: 400, focal_length: "110mm",
    license: "cc0",
  },
  {
    title: "Fisherman at Dawn",
    description: "A fisherman casting his net on the Mekong Delta, silhouetted against the rising sun.",
    image_url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200",
    tags: ["documentary", "travel", "portrait", "golden-hour", "vietnam"],
    likes: 554, downloads: 237, views: 4750, is_featured: true,
    camera: "Leica M11", lens: "90mm f/2 Summicron APO", aperture: "f/4", shutter_speed: "1/500s", iso: 400, focal_length: "90mm",
    license: "cc0",
  },
  {
    title: "Hands at Work",
    description: "A potter's hands shaping clay — the intimacy of craft, captured mid-motion.",
    image_url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200",
    tags: ["documentary", "portrait", "craft", "hands", "minimal"],
    likes: 318, downloads: 134, views: 2600, is_featured: false,
    camera: "Hasselblad X2D", lens: "135mm f/2.8", aperture: "f/3.5", shutter_speed: "1/160s", iso: 800, focal_length: "135mm",
    license: "cc0",
  },

  // ── Architecture ──
  {
    title: "Brutalist Symmetry",
    description: "The raw concrete geometry of a 1970s civic building — angular, imposing, secretly beautiful.",
    image_url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600",
    width: 1600, height: 1200,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    tags: ["architecture", "brutalism", "urban", "minimal", "black & white"],
    likes: 287, downloads: 118, views: 2350, is_featured: false,
    camera: "Nikon Z8", lens: "24mm f/1.8 S", aperture: "f/8", shutter_speed: "1/250s", iso: 64, focal_length: "24mm",
    license: "cc0",
  },
  {
    title: "Gothic Vaulting",
    description: "Looking straight up into the ribbed vaulting of a medieval cathedral — stone suspended in impossible arcs.",
    image_url: "https://images.unsplash.com/photo-1466354424719-343280fe118b?w=1600",
    width: 1067, height: 1600,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
    tags: ["architecture", "cathedral", "travel", "europe", "interior"],
    likes: 361, downloads: 155, views: 2980, is_featured: false,
    camera: "Nikon Z8", lens: "14-24mm f/2.8 S", aperture: "f/8", shutter_speed: "1/30s", iso: 3200, focal_length: "14mm",
    license: "cc0",
  },

  // ── Astrophotography & Night ──
  {
    title: "Milky Way Arch",
    description: "The galactic core arching over a dark desert mesa — 4,000 light-years of history in a single frame.",
    image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Carlos Mendez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    tags: ["astrophotography", "night", "landscape", "stars", "milky-way"],
    likes: 723, downloads: 312, views: 6400, is_featured: true,
    camera: "Sony A7S III", lens: "14mm f/1.8 GM", aperture: "f/1.8", shutter_speed: "20s", iso: 6400, focal_length: "14mm",
    license: "cc0",
  },

  // ── Wildlife ──
  {
    title: "Eagle in Flight",
    description: "A bald eagle banking hard over an Alaskan salmon river — every feather crisp at 1/4000s.",
    image_url: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    tags: ["wildlife", "birds", "nature", "alaska", "action"],
    likes: 631, downloads: 267, views: 5300, is_featured: false,
    camera: "Sony A9 III", lens: "600mm f/4 GM", aperture: "f/5.6", shutter_speed: "1/4000s", iso: 1600, focal_length: "600mm",
    license: "cc0",
  },
  {
    title: "Elephant at Dusk",
    description: "A lone elephant silhouetted against the burning Amboseli sky with Kilimanjaro ghosted in the background.",
    image_url: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=1600",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    tags: ["wildlife", "africa", "landscape", "golden-hour", "kenya"],
    likes: 698, downloads: 293, views: 5850, is_featured: true,
    camera: "Fujifilm GFX 100S", lens: "500mm f/5.6 R LM OIS WR", aperture: "f/6.3", shutter_speed: "1/1000s", iso: 800, focal_length: "500mm",
    license: "cc0",
  },
];

const collections = [
  {
    name: "The Golden Hour",
    description: "Every photograph made when the sun is low — that fleeting window of warmth and long shadows.",
    cover_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    photoTitles: ["Golden Hour in the Alps", "Fisherman at Dawn", "Elephant at Dusk", "Desert Geometry", "The Lone Pine"],
  },
  {
    name: "Landscapes",
    description: "Sweeping views of untouched nature — from frozen tundra to sun-scorched desert.",
    cover_image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800",
    photoTitles: ["Desert Geometry", "Icelandic Horizon", "Salt Flats Mirror", "Forest Light", "Lavender Fields", "The Lone Pine"],
  },
  {
    name: "Urban Stories",
    description: "Life unfolding on city streets — every frame a document of how we share space.",
    cover_image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    photoTitles: ["Quiet Streets of Kyoto", "Black & White Tokyo", "Night Market Colours", "Monsoon Reflections", "Rain on Glass", "City Lights from Above"],
  },
  {
    name: "Minimal",
    description: "Less is more — clean compositions, quiet beauty, and the power of negative space.",
    cover_image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=800",
    photoTitles: ["Salt Flats Mirror", "Desert Geometry", "Geometric Light", "Ocean Solitude", "Brutalist Symmetry", "Hands at Work"],
  },
  {
    name: "Ocean & Water",
    description: "Everything water — from still reflections to crashing surf and the open Pacific.",
    cover_image_url: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800",
    photoTitles: ["Ocean Solitude", "Aerial Coastline", "Icelandic Horizon", "Storm Over the Pacific", "Monsoon Reflections"],
  },
  {
    name: "Night & Stars",
    description: "The world after dark — astrophotography, city glow, and the drama of available light.",
    cover_image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    photoTitles: ["Milky Way Arch", "City Lights from Above", "Night Market Colours", "Rain on Glass"],
  },
];

async function run() {
  await client.connect();
  console.log("Connected to database.");

  const existing = await client.query("SELECT COUNT(*) FROM photos");
  if (parseInt(existing.rows[0].count) > 0) {
    console.log(`${existing.rows[0].count} photos already exist — skipping seed.`);
    await client.end();
    return;
  }

  // Insert photos, build title → id map
  const photoIdMap = new Map();
  for (const p of photos) {
    const result = await client.query(
      `INSERT INTO photos
         (title, description, image_url, width, height, photographer_name, photographer_avatar_url,
          tags, likes, downloads, views, is_featured, camera, lens, aperture, shutter_speed, iso,
          focal_length, license, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'published')
       RETURNING id`,
      [
        p.title, p.description, p.image_url, p.width, p.height,
        p.photographer_name, p.photographer_avatar_url ?? null,
        p.tags, p.likes, p.downloads, p.views ?? 0, p.is_featured,
        p.camera ?? null, p.lens ?? null, p.aperture ?? null,
        p.shutter_speed ?? null, p.iso ?? null, p.focal_length ?? null,
        p.license ?? "cc0",
      ]
    );
    photoIdMap.set(p.title, result.rows[0].id);
  }
  console.log(`✓ Seeded ${photos.length} photos.`);

  // Insert collections and link photos
  for (const col of collections) {
    const colResult = await client.query(
      `INSERT INTO collections (name, description, cover_image_url)
       VALUES ($1, $2, $3) RETURNING id`,
      [col.name, col.description, col.cover_image_url ?? null]
    );
    const colId = colResult.rows[0].id;

    for (const title of col.photoTitles) {
      const photoId = photoIdMap.get(title);
      if (!photoId) { console.warn(`  ⚠ Photo not found: "${title}"`); continue; }
      await client.query(
        `INSERT INTO collection_photos (collection_id, photo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [colId, photoId]
      );
    }
    console.log(`✓ Collection "${col.name}" — ${col.photoTitles.length} photos linked.`);
  }

  await client.end();
  console.log("\nSeed complete!");
}

run().catch((e) => { console.error(e.message); process.exit(1); });

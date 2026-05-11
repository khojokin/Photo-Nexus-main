import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

// ─── Photographers ────────────────────────────────────────────────────────────
const photographers = [
  {
    id: "photographer-elena-vasquez",
    email: "elena@affuaa.com",
    firstName: "Elena",
    lastName: "Vasquez",
    profileImageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    bio: "Chasing light across mountain ranges and coastal cliffs. Based in Barcelona, shooting landscapes for over a decade. My work explores the relationship between scale and solitude.",
    location: "Barcelona, Spain",
    website: "https://elenavasquez.com",
    instagram: "elenavasquez.photo",
    twitter: "elenavasquez",
    equipment: ["Sony A7R V", "Canon EF 16-35mm f/2.8L", "Sony FE 70-200mm f/2.8 GM"],
    styleTags: ["landscape", "minimalist", "golden-hour"],
    availability: "available",
  },
  {
    id: "photographer-kenji-watanabe",
    email: "kenji@affuaa.com",
    firstName: "Kenji",
    lastName: "Watanabe",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    bio: "Street photographer obsessed with the in-between moments. Tokyo is my laboratory. I shoot in black and white because colour is a distraction from truth.",
    location: "Tokyo, Japan",
    website: "https://kenjiwatanabe.jp",
    instagram: "kenji.wb",
    twitter: "kenjiwb",
    equipment: ["Leica M11", "Leica Summicron 35mm f/2", "Ricoh GR IIIx"],
    styleTags: ["street", "black-and-white", "documentary"],
    availability: "available",
  },
  {
    id: "photographer-amara-diallo",
    email: "amara@affuaa.com",
    firstName: "Amara",
    lastName: "Diallo",
    profileImageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
    bio: "Aerial and abstract work from above the Sahara to the Atlantic coast. I use drones and long exposures to strip the world down to geometry and texture.",
    location: "Dakar, Senegal",
    website: "https://amaradiallo.art",
    instagram: "amaradiallo.aerial",
    twitter: "amaradiallo",
    equipment: ["DJI Mavic 3 Pro", "Nikon Z8", "Nikkor Z 24-70mm f/2.8 S"],
    styleTags: ["aerial", "abstract", "desert"],
    availability: "for-hire",
  },
  {
    id: "photographer-sofia-andersen",
    email: "sofia@affuaa.com",
    firstName: "Sofia",
    lastName: "Andersen",
    profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    bio: "Minimalism as a philosophy, not just a style. I photograph the Nordic coast with restraint — empty frames, muted palettes, deliberate solitude.",
    location: "Copenhagen, Denmark",
    website: "https://sofiaandersen.dk",
    instagram: "sofia.andersen.photo",
    twitter: "sofiaandersen",
    equipment: ["Hasselblad X2D 100C", "XCD 45mm f/3.5", "XCD 90V f/2.5"],
    styleTags: ["minimalist", "nordic", "ocean"],
    availability: "available",
  },
  {
    id: "photographer-marcus-chen",
    email: "marcus@affuaa.com",
    firstName: "Marcus",
    lastName: "Chen",
    profileImageUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80",
    bio: "Wildlife and nature from the Pacific Rim. I spend more time in the forest than in cities, which is exactly how I like it. Patience is the only technique that matters.",
    location: "Vancouver, Canada",
    website: "https://marcuschen.ca",
    instagram: "marcuschen.wild",
    twitter: "marcuschen",
    equipment: ["Canon EOS R5", "Canon RF 100-500mm f/4.5-7.1L", "Canon RF 24-105mm f/4L"],
    styleTags: ["wildlife", "nature", "forest"],
    availability: "limited",
  },
  {
    id: "photographer-priya-sharma",
    email: "priya@affuaa.com",
    firstName: "Priya",
    lastName: "Sharma",
    profileImageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&q=80",
    bio: "Documentary work from Mumbai's monsoon alleys to Rajasthan's desert festivals. I photograph stories that would otherwise go unwitnessed.",
    location: "Mumbai, India",
    website: "https://priyasharma.in",
    instagram: "priya.sharma.docs",
    twitter: "priyasharma",
    equipment: ["Fujifilm GFX 100S II", "GF 32-64mm f/4", "GF 80mm f/1.7"],
    styleTags: ["documentary", "street", "monsoon"],
    availability: "available",
  },
  {
    id: "photographer-ingrid-bjornsson",
    email: "ingrid@affuaa.com",
    firstName: "Ingrid",
    lastName: "Bjornsson",
    profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    bio: "Iceland-based landscape photographer. I photograph volcanic terrain, glacier edges, and northern lights with a 4×5 large format camera alongside digital.",
    location: "Reykjavik, Iceland",
    website: "https://ingridbjornsson.is",
    instagram: "ingrid.bjornsson",
    twitter: "ingridbjornsson",
    equipment: ["Phase One XT", "Schneider Kreuznach 35mm", "Nikon Z 7II"],
    styleTags: ["iceland", "landscape", "long-exposure"],
    availability: "for-hire",
  },
  {
    id: "photographer-lorenzo-ricci",
    email: "lorenzo@affuaa.com",
    firstName: "Lorenzo",
    lastName: "Ricci",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    bio: "Architectural photography from Rome. I'm drawn to the tension between ancient form and modern light — the way a Roman arch catches afternoon sun is still miraculous to me.",
    location: "Rome, Italy",
    website: "https://lorenzoricci.it",
    instagram: "lorenzo.ricci.arch",
    twitter: "lorenzoricci",
    equipment: ["Nikon Z9", "Nikkor Z 14-24mm f/2.8 S", "PC-Nikkor 19mm f/4E"],
    styleTags: ["architecture", "italy", "urban"],
    availability: "limited",
  },
  {
    id: "photographer-yuki-tanaka",
    email: "yuki@affuaa.com",
    firstName: "Yuki",
    lastName: "Tanaka",
    profileImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
    bio: "I photograph the invisible — dew on a web, the inside of a flower, the geometry of frost. Macro photography is a form of seeing that changes how I look at everything.",
    location: "Osaka, Japan",
    website: "https://yukitanaka.photo",
    instagram: "yuki.tanaka.macro",
    twitter: "yukitanaka",
    equipment: ["Sony A1", "Sony FE 90mm f/2.8 Macro G", "Sony FE 50mm f/2.8 Macro"],
    styleTags: ["macro", "abstract", "nature"],
    availability: "available",
  },
  {
    id: "photographer-nathalie-dupont",
    email: "nathalie@affuaa.com",
    firstName: "Nathalie",
    lastName: "Dupont",
    profileImageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80",
    bio: "Travel photographer based in Paris, covering everything from Provençal lavender fields to Southeast Asian night markets. I look for colour, chaos, and connection.",
    location: "Paris, France",
    website: "https://nathaliedupont.fr",
    instagram: "nathalie.dupont.travel",
    twitter: "nathaliedupont",
    equipment: ["Sony A7C II", "Tamron 17-28mm f/2.8", "Sony FE 85mm f/1.4 GM"],
    styleTags: ["travel", "street", "colour"],
    availability: "available",
  },
];

// ─── Photos ───────────────────────────────────────────────────────────────────
const photos = [
  // Elena Vasquez
  {
    title: "Golden Hour in the Alps",
    description: "Warm light cascading over snow-capped peaks at dusk. Shot from 3,200m elevation after a four-hour climb.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    tags: ["landscape", "mountains", "golden-hour", "nature", "alpine"],
    likes: 1842, downloads: 628, views: 14200, is_featured: true,
    camera: "Sony A7R V", lens: "Sony FE 70-200mm f/2.8 GM", aperture: "f/8",
    shutter_speed: "1/250s", iso: 100, focal_length: "135mm",
    uploaded_by: "photographer-elena-vasquez",
  },
  {
    title: "The Lone Pine",
    description: "A solitary pine silhouetted against a violet dusk sky on the Pyrenean plateau.",
    image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    tags: ["nature", "minimal", "landscape", "trees", "silhouette"],
    likes: 1421, downloads: 489, views: 9800, is_featured: false,
    camera: "Sony A7R V", lens: "Canon EF 16-35mm f/2.8L", aperture: "f/11",
    shutter_speed: "1/60s", iso: 200, focal_length: "35mm",
    uploaded_by: "photographer-elena-vasquez",
  },
  {
    title: "Coastal Mist",
    description: "Morning fog rolling in over Cap de Creus. The world before colour.",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    tags: ["ocean", "minimal", "landscape", "fog", "coast"],
    likes: 993, downloads: 377, views: 7200, is_featured: true,
    camera: "Sony A7R V", lens: "Canon EF 16-35mm f/2.8L", aperture: "f/16",
    shutter_speed: "8s", iso: 50, focal_length: "16mm",
    uploaded_by: "photographer-elena-vasquez",
  },
  {
    title: "Pyrenean Gold",
    description: "Autumn transforms the valley below the Col du Tourmalet into a mosaic of ochre and amber.",
    image_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Elena Vasquez",
    photographer_avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    tags: ["landscape", "autumn", "golden-hour", "mountains", "valley"],
    likes: 2106, downloads: 741, views: 18600, is_featured: true,
    camera: "Sony A7R V", lens: "Sony FE 70-200mm f/2.8 GM", aperture: "f/5.6",
    shutter_speed: "1/500s", iso: 400, focal_length: "200mm",
    uploaded_by: "photographer-elena-vasquez",
  },

  // Kenji Watanabe
  {
    title: "Quiet Streets of Kyoto",
    description: "A misty morning walk through the historic lanes of Gion before the tourists arrive.",
    image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    tags: ["street", "japan", "travel", "urban", "kyoto"],
    likes: 1218, downloads: 394, views: 8900, is_featured: true,
    camera: "Leica M11", lens: "Leica Summicron 35mm f/2", aperture: "f/4",
    shutter_speed: "1/125s", iso: 800, focal_length: "35mm",
    uploaded_by: "photographer-kenji-watanabe",
  },
  {
    title: "Black & White Tokyo",
    description: "Rush hour at Shinjuku Station reduced to pure graphic contrast. 3.5 million people pass through here daily.",
    image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    tags: ["black-and-white", "street", "japan", "documentary", "tokyo"],
    likes: 2509, downloads: 921, views: 22100, is_featured: false,
    camera: "Leica M11", lens: "Leica Summicron 35mm f/2", aperture: "f/2.8",
    shutter_speed: "1/60s", iso: 3200, focal_length: "35mm",
    uploaded_by: "photographer-kenji-watanabe",
  },
  {
    title: "Rainy Season",
    description: "Neon reflections on wet asphalt in Shinjuku's Golden Gai. Shot hand-held at 1/15s.",
    image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    tags: ["abstract", "urban", "rain", "street", "night", "japan"],
    likes: 1765, downloads: 609, views: 12300, is_featured: false,
    camera: "Leica M11", lens: "Leica Summicron 35mm f/2", aperture: "f/1.4",
    shutter_speed: "1/15s", iso: 6400, focal_length: "35mm",
    uploaded_by: "photographer-kenji-watanabe",
  },
  {
    title: "Senbon Torii",
    description: "The thousand red gates of Fushimi Inari at dawn — a tunnel of vermillion into the sacred.",
    image_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Kenji Watanabe",
    photographer_avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
    tags: ["japan", "architecture", "travel", "spiritual", "kyoto"],
    likes: 3104, downloads: 1142, views: 31400, is_featured: true,
    camera: "Ricoh GR IIIx", lens: "26.1mm equiv.", aperture: "f/4",
    shutter_speed: "1/250s", iso: 200, focal_length: "26mm",
    uploaded_by: "photographer-kenji-watanabe",
  },

  // Amara Diallo
  {
    title: "Desert Geometry",
    description: "Abstract patterns formed by sand dunes in the Sahara at first light. Shot from 800m altitude.",
    image_url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
    tags: ["desert", "abstract", "landscape", "minimal", "aerial"],
    likes: 2487, downloads: 901, views: 19800, is_featured: true,
    camera: "DJI Mavic 3 Pro", lens: "28mm equiv.", aperture: "f/2.8",
    shutter_speed: "1/1000s", iso: 100, focal_length: "28mm",
    uploaded_by: "photographer-amara-diallo",
  },
  {
    title: "Salt Flats Mirror",
    description: "A perfect reflection of an infinite sky on the Lac Assal salt flats. The world doubled.",
    image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
    tags: ["landscape", "travel", "minimal", "aerial", "reflection"],
    likes: 3612, downloads: 1374, views: 38200, is_featured: true,
    camera: "DJI Mavic 3 Pro", lens: "24mm equiv.", aperture: "f/2.8",
    shutter_speed: "1/800s", iso: 100, focal_length: "24mm",
    uploaded_by: "photographer-amara-diallo",
  },
  {
    title: "The Terracotta Village",
    description: "A Saharan village built from the earth itself, indistinguishable from the landscape at distance.",
    image_url: "https://images.unsplash.com/photo-1591197172062-c718f82aba20?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Amara Diallo",
    photographer_avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80",
    tags: ["aerial", "africa", "architecture", "desert", "travel"],
    likes: 1891, downloads: 673, views: 14500, is_featured: false,
    camera: "Nikon Z8", lens: "Nikkor Z 24-70mm f/2.8 S", aperture: "f/8",
    shutter_speed: "1/500s", iso: 200, focal_length: "35mm",
    uploaded_by: "photographer-amara-diallo",
  },

  // Sofia Andersen
  {
    title: "Ocean Solitude",
    description: "A lone figure at the edge of the Skagerrak. The image is about everything behind her.",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80",
    width: 1920, height: 1280,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    tags: ["ocean", "portrait", "minimal", "travel", "nordic"],
    likes: 1193, downloads: 477, views: 9200, is_featured: false,
    camera: "Hasselblad X2D 100C", lens: "XCD 45mm f/3.5", aperture: "f/8",
    shutter_speed: "1/500s", iso: 64, focal_length: "45mm",
    uploaded_by: "photographer-sofia-andersen",
  },
  {
    title: "Nordic Fog",
    description: "The Faroe Islands disappear into cloud at 200m elevation. Shot on a 5km ridgeline hike.",
    image_url: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    tags: ["landscape", "fog", "minimal", "nordic", "faroe-islands"],
    likes: 2402, downloads: 867, views: 21700, is_featured: true,
    camera: "Hasselblad X2D 100C", lens: "XCD 90V f/2.5", aperture: "f/5.6",
    shutter_speed: "1/125s", iso: 400, focal_length: "90mm",
    uploaded_by: "photographer-sofia-andersen",
  },
  {
    title: "White on White",
    description: "Svalbard in February. Everything is the same colour. The only distinction is texture.",
    image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Sofia Andersen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
    tags: ["winter", "minimal", "snow", "landscape", "nordic"],
    likes: 1847, downloads: 712, views: 16800, is_featured: false,
    camera: "Hasselblad X2D 100C", lens: "XCD 45mm f/3.5", aperture: "f/11",
    shutter_speed: "1/2000s", iso: 64, focal_length: "45mm",
    uploaded_by: "photographer-sofia-andersen",
  },

  // Marcus Chen
  {
    title: "Forest Light",
    description: "Shafts of morning light piercing through ancient Douglas firs in Olympic National Forest.",
    image_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80",
    tags: ["forest", "nature", "light", "landscape", "trees"],
    likes: 1311, downloads: 543, views: 10800, is_featured: false,
    camera: "Canon EOS R5", lens: "Canon RF 24-105mm f/4L", aperture: "f/8",
    shutter_speed: "1/60s", iso: 800, focal_length: "35mm",
    uploaded_by: "photographer-marcus-chen",
  },
  {
    title: "Aerial Coastline",
    description: "Where the Great Bear Rainforest meets the Pacific — turquoise shallows over kelp beds.",
    image_url: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80",
    tags: ["aerial", "ocean", "travel", "nature", "coastline"],
    likes: 2445, downloads: 898, views: 24300, is_featured: true,
    camera: "Canon EOS R5", lens: "Canon RF 100-500mm f/4.5-7.1L", aperture: "f/5.6",
    shutter_speed: "1/1000s", iso: 200, focal_length: "100mm",
    uploaded_by: "photographer-marcus-chen",
  },
  {
    title: "The Watcher",
    description: "A great grey owl holds his perch in the Boreal forest. 40 minutes of stillness for this frame.",
    image_url: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80",
    tags: ["wildlife", "nature", "birds", "forest", "canada"],
    likes: 2889, downloads: 1021, views: 29800, is_featured: false,
    camera: "Canon EOS R5", lens: "Canon RF 100-500mm f/4.5-7.1L", aperture: "f/7.1",
    shutter_speed: "1/800s", iso: 3200, focal_length: "500mm",
    uploaded_by: "photographer-marcus-chen",
  },
  {
    title: "Salmon Run",
    description: "Sockeye salmon fighting upstream at Adams River during peak spawning — 600 fish per cubic metre.",
    image_url: "https://images.unsplash.com/photo-1515350540008-a3f566782a3e?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Marcus Chen",
    photographer_avatar_url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80",
    tags: ["wildlife", "nature", "water", "canada", "salmon"],
    likes: 1634, downloads: 581, views: 13200, is_featured: false,
    camera: "Canon EOS R5", lens: "Canon RF 24-105mm f/4L", aperture: "f/4",
    shutter_speed: "1/2000s", iso: 400, focal_length: "50mm",
    uploaded_by: "photographer-marcus-chen",
  },

  // Priya Sharma
  {
    title: "Rain on Glass",
    description: "Raindrops refracting the city outside a Mumbai taxi window. The city becomes abstract.",
    image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    photographer_avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&q=80",
    tags: ["abstract", "urban", "rain", "street", "mumbai"],
    likes: 1265, downloads: 409, views: 9400, is_featured: false,
    camera: "Fujifilm GFX 100S II", lens: "GF 80mm f/1.7", aperture: "f/1.7",
    shutter_speed: "1/250s", iso: 800, focal_length: "80mm",
    uploaded_by: "photographer-priya-sharma",
  },
  {
    title: "Monsoon Reflections",
    description: "A flooded alley in Dharavi mirrors neon signs after the first heavy rain of the season.",
    image_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    photographer_avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&q=80",
    tags: ["street", "rain", "urban", "documentary", "india"],
    likes: 1974, downloads: 752, views: 17600, is_featured: false,
    camera: "Fujifilm GFX 100S II", lens: "GF 32-64mm f/4", aperture: "f/4",
    shutter_speed: "1/30s", iso: 1600, focal_length: "45mm",
    uploaded_by: "photographer-priya-sharma",
  },
  {
    title: "Holi",
    description: "The festival of colour in Mathura — a moment of pure joy suspended in powder and light.",
    image_url: "https://images.unsplash.com/photo-1523978591478-c753949ff840?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Priya Sharma",
    photographer_avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&q=80",
    tags: ["documentary", "india", "festival", "colour", "street"],
    likes: 3841, downloads: 1502, views: 42100, is_featured: true,
    camera: "Fujifilm GFX 100S II", lens: "GF 80mm f/1.7", aperture: "f/2",
    shutter_speed: "1/1000s", iso: 200, focal_length: "80mm",
    uploaded_by: "photographer-priya-sharma",
  },

  // Ingrid Bjornsson
  {
    title: "Icelandic Horizon",
    description: "Reynisfjara black sand beach meeting a stormy Atlantic. The basalt stacks have stood for 12,000 years.",
    image_url: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Ingrid Bjornsson",
    photographer_avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    tags: ["iceland", "landscape", "ocean", "travel", "storm"],
    likes: 2902, downloads: 1067, views: 28400, is_featured: true,
    camera: "Nikon Z 7II", lens: "Nikkor Z 14-24mm f/2.8 S", aperture: "f/11",
    shutter_speed: "2s", iso: 64, focal_length: "14mm",
    uploaded_by: "photographer-ingrid-bjornsson",
  },
  {
    title: "Aurora Curtain",
    description: "An unusually intense Kp-8 aurora over Þingvellir. Three hours in -18°C for this moment.",
    image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Ingrid Bjornsson",
    photographer_avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    tags: ["aurora", "iceland", "night", "landscape", "astrophotography"],
    likes: 4812, downloads: 1934, views: 56800, is_featured: true,
    camera: "Nikon Z 7II", lens: "Nikkor Z 14-24mm f/2.8 S", aperture: "f/2.8",
    shutter_speed: "8s", iso: 3200, focal_length: "14mm",
    uploaded_by: "photographer-ingrid-bjornsson",
  },
  {
    title: "Glacier Edge",
    description: "The terminal moraine of Sólheimajökull glacier. This edge has retreated 400m in 20 years.",
    image_url: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Ingrid Bjornsson",
    photographer_avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    tags: ["glacier", "iceland", "landscape", "climate", "blue"],
    likes: 2234, downloads: 893, views: 19200, is_featured: false,
    camera: "Phase One XT", lens: "Schneider Kreuznach 35mm", aperture: "f/16",
    shutter_speed: "1/125s", iso: 50, focal_length: "35mm",
    uploaded_by: "photographer-ingrid-bjornsson",
  },

  // Lorenzo Ricci
  {
    title: "Terracotta Rooftops",
    description: "The Umbrian hill town of Civita di Bagnoregio, accessible only by a pedestrian bridge.",
    image_url: "https://images.unsplash.com/photo-1534445538923-ab38b6c0d8d1?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    tags: ["architecture", "italy", "travel", "urban", "mediterranean"],
    likes: 1678, downloads: 562, views: 13100, is_featured: false,
    camera: "Nikon Z9", lens: "Nikkor Z 14-24mm f/2.8 S", aperture: "f/8",
    shutter_speed: "1/250s", iso: 100, focal_length: "24mm",
    uploaded_by: "photographer-lorenzo-ricci",
  },
  {
    title: "Colosseum at First Light",
    description: "The Colosseum before dawn, before tour groups, before noise. Just stone and early light.",
    image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    tags: ["architecture", "rome", "italy", "ancient", "travel"],
    likes: 2891, downloads: 1102, views: 31900, is_featured: true,
    camera: "Nikon Z9", lens: "PC-Nikkor 19mm f/4E", aperture: "f/8",
    shutter_speed: "4s", iso: 100, focal_length: "19mm",
    uploaded_by: "photographer-lorenzo-ricci",
  },
  {
    title: "Baroque Shadow Play",
    description: "Chiaroscuro in the nave of Santa Maria Maggiore — Baroque architecture as theatrical lighting.",
    image_url: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1600&q=80",
    width: 1067, height: 1600,
    photographer_name: "Lorenzo Ricci",
    photographer_avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    tags: ["architecture", "interior", "light", "italy", "church"],
    likes: 1523, downloads: 598, views: 12700, is_featured: false,
    camera: "Nikon Z9", lens: "Nikkor Z 14-24mm f/2.8 S", aperture: "f/5.6",
    shutter_speed: "1/30s", iso: 3200, focal_length: "14mm",
    uploaded_by: "photographer-lorenzo-ricci",
  },

  // Yuki Tanaka
  {
    title: "Macro World",
    description: "Dew drops on a garden spider's web at 5:30 AM. Each droplet a lens, a tiny complete world.",
    image_url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    photographer_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
    tags: ["macro", "nature", "abstract", "spider", "dew"],
    likes: 3534, downloads: 1432, views: 41800, is_featured: false,
    camera: "Sony A1", lens: "Sony FE 90mm f/2.8 Macro G", aperture: "f/4.5",
    shutter_speed: "1/500s", iso: 400, focal_length: "90mm",
    uploaded_by: "photographer-yuki-tanaka",
  },
  {
    title: "Frost Geometry",
    description: "Ice crystals forming on a studio glass surface. The hexagonal mathematics of water.",
    image_url: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    photographer_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
    tags: ["macro", "abstract", "winter", "ice", "science"],
    likes: 2108, downloads: 843, views: 21400, is_featured: false,
    camera: "Sony A1", lens: "Sony FE 50mm f/2.8 Macro", aperture: "f/8",
    shutter_speed: "1/200s", iso: 100, focal_length: "50mm",
    uploaded_by: "photographer-yuki-tanaka",
  },
  {
    title: "Pollen Architecture",
    description: "A single lily stamen magnified 5:1. The geometry of reproduction, made visible.",
    image_url: "https://images.unsplash.com/photo-1490750967868-88df5691cc34?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Yuki Tanaka",
    photographer_avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
    tags: ["macro", "nature", "abstract", "flower", "science"],
    likes: 1876, downloads: 724, views: 17900, is_featured: false,
    camera: "Sony A1", lens: "Sony FE 90mm f/2.8 Macro G", aperture: "f/5.6",
    shutter_speed: "1/800s", iso: 200, focal_length: "90mm",
    uploaded_by: "photographer-yuki-tanaka",
  },

  // Nathalie Dupont
  {
    title: "Night Market Colours",
    description: "The vibrant chaos of a Bangkok night market at full swing — chaos that somehow resolves into beauty.",
    image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80",
    tags: ["street", "travel", "urban", "night", "thailand"],
    likes: 2298, downloads: 918, views: 23700, is_featured: false,
    camera: "Sony A7C II", lens: "Tamron 17-28mm f/2.8", aperture: "f/2.8",
    shutter_speed: "1/60s", iso: 3200, focal_length: "17mm",
    uploaded_by: "photographer-nathalie-dupont",
  },
  {
    title: "Lavender Fields",
    description: "Endless rows of lavender fade into the Provençal horizon at Valensole. Shot in the third week of July.",
    image_url: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80",
    tags: ["nature", "landscape", "travel", "france", "flowers"],
    likes: 1888, downloads: 764, views: 16900, is_featured: false,
    camera: "Sony A7C II", lens: "Sony FE 85mm f/1.4 GM", aperture: "f/8",
    shutter_speed: "1/500s", iso: 100, focal_length: "85mm",
    uploaded_by: "photographer-nathalie-dupont",
  },
  {
    title: "Marrakech Morning",
    description: "The souks at 7 AM before the merchants arrive. A rare stillness in the world's most chaotic bazaar.",
    image_url: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80",
    tags: ["travel", "street", "morocco", "urban", "documentary"],
    likes: 2134, downloads: 876, views: 19800, is_featured: false,
    camera: "Sony A7C II", lens: "Tamron 17-28mm f/2.8", aperture: "f/5.6",
    shutter_speed: "1/125s", iso: 400, focal_length: "24mm",
    uploaded_by: "photographer-nathalie-dupont",
  },
  {
    title: "Santorini at Dusk",
    description: "The clichéd view that is still worth photographing — because some things are clichéd for good reason.",
    image_url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80",
    width: 1600, height: 1067,
    photographer_name: "Nathalie Dupont",
    photographer_avatar_url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80",
    tags: ["travel", "greece", "golden-hour", "landscape", "mediterranean"],
    likes: 4201, downloads: 1832, views: 49200, is_featured: true,
    camera: "Sony A7C II", lens: "Sony FE 85mm f/1.4 GM", aperture: "f/8",
    shutter_speed: "1/250s", iso: 100, focal_length: "85mm",
    uploaded_by: "photographer-nathalie-dupont",
  },
];

// ─── Series ───────────────────────────────────────────────────────────────────
const series = [
  { name: "Nordic Light", description: "A study of Scandinavian winter light — from Iceland's auroras to the Danish coast.", photographer_name: "Ingrid Bjornsson", cover_image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80" },
  { name: "Streets of Asia", description: "A decade of street photography across Tokyo, Kyoto, Bangkok, and Seoul.", photographer_name: "Kenji Watanabe", cover_image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
  { name: "The Invisible Garden", description: "The secret architecture of the natural world, seen through a macro lens.", photographer_name: "Yuki Tanaka", cover_image_url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80" },
  { name: "Mediterranean Light", description: "Architecture, terracotta, and afternoon light from Rome to Athens.", photographer_name: "Lorenzo Ricci", cover_image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
  { name: "Wild Pacific Coast", description: "Wildlife and wilderness from British Columbia's Great Bear Rainforest.", photographer_name: "Marcus Chen", cover_image_url: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80" },
];

// ─── Collections ──────────────────────────────────────────────────────────────
const collections = [
  { name: "Landscapes", description: "Sweeping views of untouched nature — from Alpine peaks to desert plains.", cover_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", owner_id: "photographer-elena-vasquez" },
  { name: "Urban Stories", description: "Life unfolding in the city — street photography at its most honest.", cover_image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", owner_id: "photographer-kenji-watanabe" },
  { name: "Minimal", description: "Less is more. Clean compositions, quiet beauty, deliberate restraint.", cover_image_url: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=800&q=80", owner_id: "photographer-sofia-andersen" },
  { name: "Golden Hour", description: "That magic window when the world turns to gold. All disciplines, one quality of light.", cover_image_url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80", owner_id: "photographer-nathalie-dupont" },
  { name: "Architecture & Form", description: "Buildings, spaces, and structures photographed with the attention they deserve.", cover_image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80", owner_id: "photographer-lorenzo-ricci" },
  { name: "Water & Reflection", description: "Oceans, rain, ice, and mirrors. Water as subject and as medium.", cover_image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80", owner_id: "photographer-sofia-andersen" },
  { name: "Wildlife & Wild Places", description: "Animals in their world, captured with patience and respect.", cover_image_url: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80", owner_id: "photographer-marcus-chen" },
  { name: "Wanderlust", description: "A curated travel diary — the images that make you want to book a flight.", cover_image_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80", owner_id: "photographer-nathalie-dupont" },
];

// ─── Comments ─────────────────────────────────────────────────────────────────
const commentTemplates = [
  "This is extraordinary work. The light here is just unreal.",
  "I've been trying to capture something like this for years. You make it look effortless.",
  "The technical execution is flawless, but it's the emotional weight that really lands.",
  "Downloaded this for my desktop background. Thank you for sharing it freely.",
  "There's something meditative about staring at this image. Well done.",
  "The composition here is a masterclass. Note taken.",
  "I can almost feel the cold. Remarkable.",
  "This is why I became a photographer. Work like this reminds me what's possible.",
  "The patience required to capture this moment must have been extraordinary.",
  "One of the best images I've seen on this platform. The tonal range is perfect.",
  "Shot details? Would love to know the post-processing approach.",
  "Following you immediately. More of this please.",
  "This belongs in a gallery, not just on a website.",
  "How long were you waiting for this light? Absolutely worth it.",
  "I study images like this. There's so much to learn from the framing alone.",
];

async function run() {
  await client.connect();
  console.log("✓ Connected to database");

  // ── Wipe existing data ─────────────────────────────────────────────────────
  await client.query("TRUNCATE TABLE reactions CASCADE");
  await client.query("TRUNCATE TABLE notifications CASCADE");
  await client.query("TRUNCATE TABLE comments CASCADE");
  await client.query("TRUNCATE TABLE follows CASCADE");
  await client.query("TRUNCATE TABLE collection_photos CASCADE");
  await client.query("TRUNCATE TABLE collections CASCADE");
  await client.query("TRUNCATE TABLE series CASCADE");
  await client.query("TRUNCATE TABLE photos CASCADE");
  await client.query("TRUNCATE TABLE sessions CASCADE");
  await client.query("TRUNCATE TABLE users CASCADE");
  console.log("✓ Cleared existing data");

  // ── Insert users ───────────────────────────────────────────────────────────
  for (const p of photographers) {
    await client.query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, bio, location, website, instagram, twitter, equipment, style_tags, availability, subscription_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'free')`,
      [p.id, p.email, p.firstName, p.lastName, p.profileImageUrl, p.bio, p.location, p.website, p.instagram, p.twitter, p.equipment, p.styleTags, p.availability]
    );
  }
  console.log(`✓ Seeded ${photographers.length} photographers`);

  // ── Insert series ──────────────────────────────────────────────────────────
  const seriesIds = [];
  for (const s of series) {
    const r = await client.query(
      `INSERT INTO series (name, description, photographer_name, cover_image_url) VALUES ($1,$2,$3,$4) RETURNING id`,
      [s.name, s.description, s.photographer_name, s.cover_image_url]
    );
    seriesIds.push(r.rows[0].id);
  }
  console.log(`✓ Seeded ${series.length} series`);

  // ── Assign series IDs to photos ────────────────────────────────────────────
  const seriesByPhotographer = {
    "Ingrid Bjornsson": seriesIds[0],
    "Kenji Watanabe": seriesIds[1],
    "Yuki Tanaka": seriesIds[2],
    "Lorenzo Ricci": seriesIds[3],
    "Marcus Chen": seriesIds[4],
  };

  // ── Insert photos ──────────────────────────────────────────────────────────
  const photoIds = [];
  for (const p of photos) {
    const sid = seriesByPhotographer[p.photographer_name] ?? null;
    const r = await client.query(
      `INSERT INTO photos (title, description, image_url, width, height, photographer_name, photographer_avatar_url, tags, likes, downloads, views, is_featured, camera, lens, aperture, shutter_speed, iso, focal_length, uploaded_by, series_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'published') RETURNING id`,
      [p.title, p.description, p.image_url, p.width, p.height, p.photographer_name, p.photographer_avatar_url,
       p.tags, p.likes, p.downloads, p.views, p.is_featured,
       p.camera, p.lens, p.aperture, p.shutter_speed, p.iso, p.focal_length, p.uploaded_by, sid]
    );
    photoIds.push(r.rows[0].id);
  }
  console.log(`✓ Seeded ${photos.length} photos`);

  // ── Insert collections ─────────────────────────────────────────────────────
  const collectionIds = [];
  for (const c of collections) {
    const r = await client.query(
      `INSERT INTO collections (name, description, cover_image_url, owner_id) VALUES ($1,$2,$3,$4) RETURNING id`,
      [c.name, c.description, c.cover_image_url, c.owner_id]
    );
    collectionIds.push(r.rows[0].id);
  }
  console.log(`✓ Seeded ${collections.length} collections`);

  // ── Assign photos to collections (by tag matching) ─────────────────────────
  const tagMap = {
    0: ["landscape", "mountains", "forest", "desert", "alpine", "valley", "autumn", "nordic", "fog"],  // Landscapes
    1: ["street", "urban", "documentary", "night", "mumbai", "india"],                                   // Urban Stories
    2: ["minimal", "abstract", "silhouette", "white"],                                                    // Minimal
    3: ["golden-hour", "sunset", "dusk", "mediterranean"],                                               // Golden Hour
    4: ["architecture", "rome", "italy", "church", "ancient"],                                            // Architecture
    5: ["ocean", "rain", "water", "reflection", "glacier", "coastline"],                                  // Water & Reflection
    6: ["wildlife", "nature", "birds", "salmon", "forest"],                                               // Wildlife
    7: ["travel", "japan", "kyoto", "greece", "morocco", "thailand", "france", "iceland"],               // Wanderlust
  };

  for (let ci = 0; ci < collectionIds.length; ci++) {
    const colId = collectionIds[ci];
    const tags = tagMap[ci];
    const assigned = new Set();
    for (let pi = 0; pi < photos.length; pi++) {
      const photo = photos[pi];
      if (photo.tags.some(t => tags.includes(t)) && !assigned.has(photoIds[pi])) {
        assigned.add(photoIds[pi]);
        await client.query(
          `INSERT INTO collection_photos (collection_id, photo_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [colId, photoIds[pi]]
        );
      }
    }
  }
  console.log("✓ Assigned photos to collections");

  // ── Add comments on top photos ─────────────────────────────────────────────
  const commenters = [
    { name: "Elena Vasquez", id: "photographer-elena-vasquez" },
    { name: "Kenji Watanabe", id: "photographer-kenji-watanabe" },
    { name: "Marcus Chen", id: "photographer-marcus-chen" },
    { name: "Sofia Andersen", id: "photographer-sofia-andersen" },
    { name: "Nathalie Dupont", id: "photographer-nathalie-dupont" },
    { name: "Yuki Tanaka", id: "photographer-yuki-tanaka" },
    { name: "Lorenzo Ricci", id: "photographer-lorenzo-ricci" },
    { name: "Priya Sharma", id: "photographer-priya-sharma" },
    { name: "Amara Diallo", id: "photographer-amara-diallo" },
    { name: "Ingrid Bjornsson", id: "photographer-ingrid-bjornsson" },
  ];

  let commentCount = 0;
  for (let i = 0; i < photoIds.length; i++) {
    const numComments = Math.floor(Math.random() * 4) + 2;
    const photoOwner = photos[i].uploaded_by;
    const shuffled = [...commenters].sort(() => Math.random() - 0.5);
    let added = 0;
    for (const commenter of shuffled) {
      if (added >= numComments) break;
      if (commenter.id === photoOwner) continue;
      const body = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
      await client.query(
        `INSERT INTO comments (photo_id, author_id, author_name, body) VALUES ($1,$2,$3,$4)`,
        [photoIds[i], commenter.id, commenter.name, body]
      );
      commentCount++;
      added++;
    }
  }
  console.log(`✓ Seeded ${commentCount} comments`);

  // ── Add follows ────────────────────────────────────────────────────────────
  const followPairs = [
    ["Elena Vasquez", "Ingrid Bjornsson"],
    ["Elena Vasquez", "Sofia Andersen"],
    ["Kenji Watanabe", "Priya Sharma"],
    ["Kenji Watanabe", "Nathalie Dupont"],
    ["Kenji Watanabe", "Amara Diallo"],
    ["Marcus Chen", "Ingrid Bjornsson"],
    ["Marcus Chen", "Elena Vasquez"],
    ["Sofia Andersen", "Ingrid Bjornsson"],
    ["Sofia Andersen", "Marcus Chen"],
    ["Priya Sharma", "Nathalie Dupont"],
    ["Priya Sharma", "Kenji Watanabe"],
    ["Lorenzo Ricci", "Elena Vasquez"],
    ["Lorenzo Ricci", "Amara Diallo"],
    ["Yuki Tanaka", "Marcus Chen"],
    ["Yuki Tanaka", "Sofia Andersen"],
    ["Nathalie Dupont", "Priya Sharma"],
    ["Nathalie Dupont", "Kenji Watanabe"],
    ["Ingrid Bjornsson", "Elena Vasquez"],
    ["Ingrid Bjornsson", "Sofia Andersen"],
    ["Amara Diallo", "Lorenzo Ricci"],
    ["Amara Diallo", "Marcus Chen"],
  ];

  for (const [follower, following] of followPairs) {
    await client.query(
      `INSERT INTO follows (follower_name, following_name) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [follower, following]
    );
  }
  console.log(`✓ Seeded ${followPairs.length} follows`);

  // ── Add reactions ──────────────────────────────────────────────────────────
  const emojis = ["❤️", "🔥", "✨", "😍", "👏"];
  let reactionCount = 0;
  for (let i = 0; i < photoIds.length; i++) {
    const numReactions = Math.floor(Math.random() * 5) + 2;
    const shuffled = [...commenters].sort(() => Math.random() - 0.5);
    for (let j = 0; j < Math.min(numReactions, shuffled.length); j++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      await client.query(
        `INSERT INTO reactions (photo_id, actor_id, emoji) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [photoIds[i], shuffled[j].id, emoji]
      );
      reactionCount++;
    }
  }
  console.log(`✓ Seeded ${reactionCount} reactions`);

  // ── Add notifications for the guest user (demo) ────────────────────────────
  // We seed a guest demo user so the UI doesn't look empty when browsing
  await client.query(
    `INSERT INTO users (id, email, first_name, last_name, profile_image_url, bio, subscription_status)
     VALUES ($1,$2,$3,$4,$5,$6,'free') ON CONFLICT DO NOTHING`,
    ["guest-user-001", "kingsfordkojo7@gmail.com", "Kingsford", "Kojo", null,
     "Curator and founder of Affuaa. Passionate about photography as a fine art."]
  );

  await client.end();
  console.log("\n🎉 Seed complete!");
  console.log(`   ${photographers.length} photographers`);
  console.log(`   ${photos.length} photos`);
  console.log(`   ${series.length} series`);
  console.log(`   ${collections.length} collections`);
  console.log(`   ${commentCount} comments`);
  console.log(`   ${followPairs.length} follows`);
  console.log(`   ${reactionCount} reactions`);
}

run().catch((e) => { console.error(e.message); process.exit(1); });

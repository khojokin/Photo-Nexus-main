import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { photosTable, collectionsTable, collectionPhotosTable, commentsTable, seriesTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
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
  { title: "Milky Way Arch", description: "The galactic core arching over a dark desert mesa — 4,000 light-years of history in a single frame.", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["astrophotography","night","landscape","stars","milky-way"], likes: 723, downloads: 312, views: 6400, isFeatured: true, isPotdPinned: true, camera: "Sony A7S III", lens: "14mm f/1.8 GM", aperture: "f/1.8", shutterSpeed: "20s", iso: 6400, focalLength: "14mm" },
  { title: "Eagle in Flight", description: "A bald eagle banking hard over an Alaskan salmon river — every feather crisp at 1/4000s.", imageUrl: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["wildlife","birds","nature","alaska","action"], likes: 631, downloads: 267, views: 5300, isFeatured: false, camera: "Sony A9 III", lens: "600mm f/4 GM", aperture: "f/5.6", shutterSpeed: "1/4000s", iso: 1600, focalLength: "600mm" },
  { title: "Elephant at Dusk", description: "A lone elephant silhouetted against the burning Amboseli sky with Kilimanjaro ghosted in the background.", imageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=1600", width: 1600, height: 1067, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["wildlife","africa","landscape","golden-hour","kenya"], likes: 698, downloads: 293, views: 5850, isFeatured: true, camera: "Fujifilm GFX 100S", lens: "500mm f/5.6 R LM OIS WR", aperture: "f/6.3", shutterSpeed: "1/1000s", iso: 800, focalLength: "500mm" },
  // Additional published photos — diverse categories
  { title: "Underwater Serenity", description: "Shafts of sunlight penetrating through clear Caribbean water onto a coral garden below — the ocean's own cathedral.", imageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1600", width: 1600, height: 1067, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["underwater","ocean","nature","abstract","tropical"], likes: 445, downloads: 189, views: 3780, isFeatured: false, camera: "Sony A7R V + Nauticam housing", lens: "16-35mm f/2.8 GM", aperture: "f/8", shutterSpeed: "1/250s", iso: 400, focalLength: "16mm" },
  { title: "Mist Over the Valley", description: "Dawn fog rolling through a Welsh valley, erasing the boundary between land and sky in slow motion.", imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600", width: 1600, height: 1067, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["landscape","fog","nature","minimal","morning"], likes: 378, downloads: 162, views: 3140, isFeatured: false, camera: "Hasselblad X2D", lens: "45mm f/3.5", aperture: "f/11", shutterSpeed: "1/15s", iso: 100, focalLength: "45mm" },
  { title: "Concrete & Sky", description: "Tokyo's expressway flyovers weave overhead like concrete rivers — brutal, functional, and quietly beautiful.", imageUrl: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["architecture","urban","japan","abstract","infrastructure"], likes: 312, downloads: 134, views: 2620, isFeatured: false, camera: "Leica M11", lens: "21mm f/3.4 Super-Elmar", aperture: "f/8", shutterSpeed: "1/500s", iso: 200, focalLength: "21mm" },
  { title: "Lone Surfer", description: "A surfer holds their line on a towering Pacific swell at dawn — everything else is silence.", imageUrl: "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["ocean","action","sport","sunrise","nature"], likes: 521, downloads: 228, views: 4420, isFeatured: false, camera: "Sony A9 III", lens: "400mm f/2.8 GM OSS", aperture: "f/4", shutterSpeed: "1/3200s", iso: 800, focalLength: "400mm" },
  { title: "Spice Market", description: "Pyramids of vivid spices in Istanbul's Grand Bazaar — turmeric, paprika, sumac. Colour as commerce.", imageUrl: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["travel","street","colour","documentary","istanbul"], likes: 289, downloads: 121, views: 2340, isFeatured: false, camera: "Canon R5", lens: "50mm f/1.2L", aperture: "f/2.8", shutterSpeed: "1/200s", iso: 800, focalLength: "50mm" },
  { title: "Waterfall Veil", description: "Long-exposure silk of a highland waterfall in Faroe Islands — the water turned to fabric by time.", imageUrl: "https://images.unsplash.com/photo-1544953780-25b0a7e2f3e8?w=1600", width: 1067, height: 1600, photographerName: "Ingrid Bjornsson", photographerAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", tags: ["waterfall","landscape","nature","long-exposure","faroe-islands"], likes: 467, downloads: 201, views: 3860, isFeatured: true, camera: "Nikon Z9", lens: "24-70mm f/2.8 S", aperture: "f/16", shutterSpeed: "2s", iso: 64, focalLength: "35mm" },
  { title: "Steel & Glass", description: "The reflective facade of a modern skyscraper fracturing the sky into geometric shards — architecture as abstract art.", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600", width: 1600, height: 1067, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["architecture","abstract","urban","minimal","reflection"], likes: 243, downloads: 103, views: 2080, isFeatured: false, camera: "Nikon Z8", lens: "24mm f/1.8 S", aperture: "f/8", shutterSpeed: "1/500s", iso: 64, focalLength: "24mm" },
  { title: "Harvest Moon Rising", description: "A full harvest moon rising over wheat fields — warm amber against a deepening violet sky.", imageUrl: "https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["moon","landscape","night","nature","minimal"], likes: 589, downloads: 251, views: 4960, isFeatured: true, camera: "Sony A7S III", lens: "600mm f/4 GM", aperture: "f/5.6", shutterSpeed: "1/400s", iso: 1600, focalLength: "600mm" },
  { title: "Morning Tea Ritual", description: "Steam rising from a glass of chai in a Mumbai tea stall — ordinary moments, extraordinary light.", imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1600", width: 1067, height: 1600, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["documentary","still-life","india","light","minimal"], likes: 334, downloads: 143, views: 2780, isFeatured: false, camera: "Canon R5", lens: "85mm f/1.4L IS", aperture: "f/1.8", shutterSpeed: "1/125s", iso: 1600, focalLength: "85mm" },
  { title: "Dunes Before Dark", description: "The last light of the day raking across Namib dunes — the world's oldest desert lit up in deep amber.", imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600", width: 1600, height: 1067, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["desert","landscape","africa","golden-hour","minimal"], likes: 612, downloads: 266, views: 5140, isFeatured: true, camera: "Fujifilm GFX 100S", lens: "45-100mm f/4", aperture: "f/8", shutterSpeed: "1/200s", iso: 100, focalLength: "100mm" },
  // Additional published photos — extended diversity
  { title: "Cherry Blossom Tunnel", description: "A winding path completely canopied by sakura at full bloom in Kyoto — petals drifting in slow-motion snow.", imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["japan","nature","spring","travel","flowers"], likes: 583, downloads: 249, views: 4920, isFeatured: true, camera: "Leica M11", lens: "50mm f/1.4 Summilux", aperture: "f/2", shutterSpeed: "1/500s", iso: 400, focalLength: "50mm" },
  { title: "Red Fox in Snow", description: "A red fox poised mid-leap over a snow field in Yellowstone — frozen between earth and sky.", imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1600", width: 1600, height: 1067, photographerName: "Elena Vasquez", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["wildlife","winter","nature","action","animals"], likes: 712, downloads: 308, views: 6100, isFeatured: true, camera: "Sony A9 III", lens: "600mm f/4 GM OSS", aperture: "f/5.6", shutterSpeed: "1/3200s", iso: 1600, focalLength: "600mm" },
  { title: "Venetian Reflections", description: "A narrow canal in Venice catching the rippled gold of late afternoon — the city decomposed into pure colour.", imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600", width: 1600, height: 1067, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["travel","italy","architecture","reflection","urban"], likes: 428, downloads: 182, views: 3640, isFeatured: false, camera: "Nikon Z8", lens: "85mm f/1.8 S", aperture: "f/2.8", shutterSpeed: "1/400s", iso: 200, focalLength: "85mm" },
  { title: "Monsoon Lightning", description: "Triple lightning bolts over Mumbai's skyline in the dead of monsoon season — raw electrical fury.", imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["weather","urban","night","drama","india"], likes: 667, downloads: 284, views: 5600, isFeatured: false, camera: "Canon R5", lens: "14-35mm f/4L IS", aperture: "f/8", shutterSpeed: "30s", iso: 100, focalLength: "14mm" },
  { title: "Polar Bear at Ease", description: "A polar bear resting on sea ice in Svalbard, its white mass blending into the fractured Arctic horizon.", imageUrl: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=1600", width: 1600, height: 1067, photographerName: "Ingrid Bjornsson", photographerAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", tags: ["wildlife","arctic","nature","animals","minimal"], likes: 544, downloads: 231, views: 4580, isFeatured: false, camera: "Nikon Z9", lens: "500mm f/5.6 PF VR", aperture: "f/6.3", shutterSpeed: "1/2000s", iso: 800, focalLength: "500mm" },
  { title: "Havana in Technicolour", description: "Classic American cars lined up on the Malecón at dusk — Cuba frozen in vivid 1950s amber.", imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["travel","street","cuba","urban","colour"], likes: 389, downloads: 167, views: 3220, isFeatured: false, camera: "Sony A7R V", lens: "35mm f/1.4 GM", aperture: "f/2", shutterSpeed: "1/200s", iso: 800, focalLength: "35mm" },
  { title: "Infrared Birch Grove", description: "A summer birch forest rendered in infrared — white leaves blazing against a near-black sky.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600", width: 1600, height: 1067, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["forest","infrared","nature","abstract","trees"], likes: 476, downloads: 203, views: 3900, isFeatured: false, camera: "Hasselblad X2D (IR converted)", lens: "30mm f/3.5", aperture: "f/8", shutterSpeed: "1/30s", iso: 50, focalLength: "30mm" },
  { title: "Marrakech Doorways", description: "Ornate hand-painted wooden doors on a sun-bleached medina wall — layers of colour and history.", imageUrl: "https://images.unsplash.com/photo-1539020140153-e479b8987df4?w=1600", width: 1067, height: 1600, photographerName: "Nathalie Dupont", photographerAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", tags: ["travel","architecture","colour","morocco","street"], likes: 352, downloads: 151, views: 2890, isFeatured: false, camera: "Canon R6 II", lens: "35mm f/1.4L", aperture: "f/2", shutterSpeed: "1/500s", iso: 200, focalLength: "35mm" },
  { title: "Scottish Highlands Mist", description: "Morning haar rolling through a glen in the Scottish Highlands — the mountains appearing and vanishing like apparitions.", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600", width: 1600, height: 1067, photographerName: "Sofia Andersen", photographerAvatarUrl: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=200", tags: ["landscape","fog","scotland","nature","travel"], likes: 491, downloads: 213, views: 4100, isFeatured: false, camera: "Hasselblad X2D", lens: "45mm f/3.5", aperture: "f/11", shutterSpeed: "1/8s", iso: 100, focalLength: "45mm" },
  { title: "Bali Temple at Dusk", description: "Pura Ulun Danu Bratan rising from the mist on Lake Beratan — the water temple perfectly mirrored at twilight.", imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600", width: 1600, height: 1067, photographerName: "Yuki Tanaka", photographerAvatarUrl: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200", tags: ["travel","bali","landscape","architecture","reflection"], likes: 603, downloads: 261, views: 5040, isFeatured: true, camera: "Canon R5", lens: "24-105mm f/4L IS", aperture: "f/11", shutterSpeed: "1/4s", iso: 200, focalLength: "24mm" },
  { title: "Workshop of the Gods", description: "A blacksmith at his forge in rural Rajasthan — sparks flying, face lit by molten steel.", imageUrl: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["documentary","portrait","craft","india","light"], likes: 287, downloads: 119, views: 2350, isFeatured: false, camera: "Canon R5", lens: "50mm f/1.2L", aperture: "f/1.4", shutterSpeed: "1/250s", iso: 3200, focalLength: "50mm" },
  { title: "Golden Gate at Sunrise", description: "The bridge emerging from dawn fog over the bay — just the two towers visible through the marine layer.", imageUrl: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1600", width: 1600, height: 1067, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["architecture","usa","landscape","fog","travel"], likes: 534, downloads: 231, views: 4480, isFeatured: false, camera: "Sony A7R V", lens: "200-600mm f/5.6-6.3 G OSS", aperture: "f/8", shutterSpeed: "1/500s", iso: 400, focalLength: "400mm" },
  { title: "Sand Between Toes", description: "Extreme macro of sand grains on sun-warmed skin — each grain a different mineral, a different world.", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600", width: 1600, height: 1067, photographerName: "Yuki Tanaka", photographerAvatarUrl: "https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?w=200", tags: ["macro","abstract","nature","ocean","minimal"], likes: 318, downloads: 138, views: 2620, isFeatured: false, camera: "Canon R5", lens: "100mm f/2.8L Macro IS", aperture: "f/11", shutterSpeed: "1/400s", iso: 100, focalLength: "100mm" },
  { title: "Tibetan Monk", description: "A young monk in burgundy robes reading sutras in morning light at a monastery near Lhasa.", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600", width: 1067, height: 1600, photographerName: "Amara Diallo", photographerAvatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200", tags: ["portrait","documentary","travel","tibet","light"], likes: 456, downloads: 194, views: 3780, isFeatured: false, camera: "Fujifilm GFX 100S", lens: "110mm f/2", aperture: "f/2.8", shutterSpeed: "1/200s", iso: 800, focalLength: "110mm" },
  { title: "Manhattan Geometry", description: "Looking straight up between Midtown skyscrapers — a slice of sky framed by glass and steel canyons.", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600", width: 1067, height: 1600, photographerName: "Marcus Chen", photographerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", tags: ["architecture","urban","abstract","new-york","graphic"], likes: 367, downloads: 158, views: 3040, isFeatured: false, camera: "Sony A7R V", lens: "12-24mm f/4 G", aperture: "f/8", shutterSpeed: "1/1000s", iso: 100, focalLength: "12mm" },
  { title: "Wild Horse at Gallop", description: "A Camargue stallion charging through a lagoon at dawn — water and mane exploding in every direction.", imageUrl: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1600", width: 1600, height: 1067, photographerName: "Nathalie Dupont", photographerAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", tags: ["wildlife","action","france","animals","nature"], likes: 621, downloads: 269, views: 5220, isFeatured: true, camera: "Canon R6 II", lens: "100-500mm f/4.5-7.1L IS", aperture: "f/6.3", shutterSpeed: "1/4000s", iso: 3200, focalLength: "500mm" },
  { title: "Patagonian Towers", description: "The granite needles of Torres del Paine lit up in pink alpenglow — nature's most dramatic architecture.", imageUrl: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1600", width: 1600, height: 1067, photographerName: "Carlos Mendez", photographerAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200", tags: ["landscape","travel","mountains","patagonia","golden-hour"], likes: 688, downloads: 296, views: 5780, isFeatured: true, camera: "Sony A7R V", lens: "24-70mm f/2.8 GM II", aperture: "f/8", shutterSpeed: "1/60s", iso: 400, focalLength: "35mm" },
  { title: "Firefly Forest", description: "Long-exposure fireflies creating green light trails through a Japanese cedar forest at midsummer — magic made visible.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600", width: 1600, height: 1067, photographerName: "Kenji Watanabe", photographerAvatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200", tags: ["nature","night","japan","long-exposure","abstract"], likes: 541, downloads: 234, views: 4560, isFeatured: false, camera: "Leica M11", lens: "21mm f/3.4 Super-Elmar", aperture: "f/4", shutterSpeed: "60s", iso: 1600, focalLength: "21mm" },
  { title: "Abstract Architecture I", description: "The sweeping curve of a Zaha Hadid building in Vienna, viewed from below — pure form meets function.", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600", width: 1600, height: 1067, photographerName: "Lorenzo Ricci", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["architecture","abstract","minimal","urban","graphic"], likes: 298, downloads: 127, views: 2440, isFeatured: false, camera: "Nikon Z8", lens: "14-24mm f/2.8 S", aperture: "f/11", shutterSpeed: "1/500s", iso: 64, focalLength: "14mm" },
  { title: "Monsoon in Jaipur", description: "The Pink City under a monsoon downpour — locals rushing under saffron umbrellas through flooded streets.", imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600", width: 1600, height: 1067, photographerName: "Priya Sharma", photographerAvatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200", tags: ["documentary","india","rain","street","colour"], likes: 413, downloads: 177, views: 3380, isFeatured: false, camera: "Canon R5", lens: "24mm f/1.4L II", aperture: "f/2.8", shutterSpeed: "1/500s", iso: 3200, focalLength: "24mm" },
  // Pending review — awaiting admin approval
  { title: "Autumn in Vermont", description: "A dirt road flanked by blazing maples in peak October colour — the New England cliché, elevated.", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600", width: 1600, height: 1067, photographerName: "Hannah Greene", photographerAvatarUrl: "https://images.unsplash.com/photo-1491349174775-aaaefdd81942?w=200", tags: ["autumn","landscape","travel","nature","usa"], likes: 0, downloads: 0, views: 0, isFeatured: false, camera: "Canon R8", lens: "24-105mm f/4L IS", aperture: "f/7.1", shutterSpeed: "1/200s", iso: 100, focalLength: "50mm", status: "pending" },
  { title: "Blue Hour Istanbul", description: "The Hagia Sophia dome reflected in a rain-slicked cobblestone square at blue hour — historic and timeless.", imageUrl: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600", width: 1600, height: 1067, photographerName: "Emre Demir", photographerAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200", tags: ["travel","architecture","night","turkey","blue-hour"], likes: 0, downloads: 0, views: 0, isFeatured: false, camera: "Sony A7 IV", lens: "16-35mm f/2.8 GM", aperture: "f/8", shutterSpeed: "15s", iso: 100, focalLength: "20mm", status: "pending" },
  { title: "Paddy Fields at Sunrise", description: "Terraced rice paddies in Bali catch the first light of day — steps of liquid gold descending the hillside.", imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600", width: 1600, height: 1067, photographerName: "Dewi Suryani", photographerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200", tags: ["travel","landscape","bali","golden-hour","nature"], likes: 0, downloads: 0, views: 0, isFeatured: false, camera: "Fujifilm X-T5", lens: "16-80mm f/4 R OIS WR", aperture: "f/8", shutterSpeed: "1/160s", iso: 200, focalLength: "30mm", status: "pending" },
  { title: "Market Portrait", description: "An elder spice vendor in Marrakech's medina, the warmth of his expression more vivid than any colour behind him.", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600", width: 1067, height: 1600, photographerName: "Lena Fischer", photographerAvatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200", tags: ["portrait","documentary","travel","morocco","street"], likes: 0, downloads: 0, views: 0, isFeatured: false, camera: "Leica SL2", lens: "75mm f/2 APO-Summicron", aperture: "f/2.8", shutterSpeed: "1/200s", iso: 800, focalLength: "75mm", status: "pending" },
  { title: "Northern Lights Curtain", description: "Green and magenta aurora sweeping across a Finnish lake, perfectly mirrored in the still black water below.", imageUrl: "https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600", width: 1600, height: 1067, photographerName: "Ingrid Bjornsson", photographerAvatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", tags: ["aurora","landscape","nature","finland","night"], likes: 0, downloads: 0, views: 0, isFeatured: false, camera: "Nikon Z9", lens: "14-24mm f/2.8 S", aperture: "f/2.8", shutterSpeed: "8s", iso: 3200, focalLength: "14mm", status: "pending" },
];

const SEED_COLLECTIONS: Array<{ name: string; description: string; coverImageUrl: string; photoTitles: string[] }> = [
  { name: "The Golden Hour", description: "Every photograph made when the sun is low — that fleeting window of warmth and long shadows.", coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", photoTitles: ["Golden Hour in the Alps","Fisherman at Dawn","Elephant at Dusk","Desert Geometry","The Lone Pine"] },
  { name: "Landscapes", description: "Sweeping views of untouched nature — from frozen tundra to sun-scorched desert.", coverImageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", photoTitles: ["Desert Geometry","Icelandic Horizon","Salt Flats Mirror","Forest Light","Lavender Fields","The Lone Pine"] },
  { name: "Urban Stories", description: "Life unfolding on city streets — every frame a document of how we share space.", coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", photoTitles: ["Quiet Streets of Kyoto","Black & White Tokyo","Night Market Colours","Monsoon Reflections","Rain on Glass","City Lights from Above"] },
  { name: "Minimal", description: "Less is more — clean compositions, quiet beauty, and the power of negative space.", coverImageUrl: "https://images.unsplash.com/photo-1547558840-8f9cbdef1f6a?w=800", photoTitles: ["Salt Flats Mirror","Desert Geometry","Geometric Light","Ocean Solitude","Brutalist Symmetry","Hands at Work"] },
  { name: "Ocean & Water", description: "Everything water — from still reflections to crashing surf and the open Pacific.", coverImageUrl: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800", photoTitles: ["Ocean Solitude","Aerial Coastline","Icelandic Horizon","Storm Over the Pacific","Monsoon Reflections"] },
  { name: "Night & Stars", description: "The world after dark — astrophotography, city glow, and the drama of available light.", coverImageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", photoTitles: ["Milky Way Arch","City Lights from Above","Night Market Colours","Rain on Glass"] },
];

const SEED_SERIES: Array<{
  name: string;
  description: string;
  photographerName: string;
  coverImageUrl: string;
  photoTitles: string[];
}> = [
  {
    name: "Equatorial Light",
    description: "A six-part journey through Africa and Asia at the golden hours — chasing the equatorial sun where the light hits hardest and the shadows stretch longest.",
    photographerName: "Amara Diallo",
    coverImageUrl: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=800",
    photoTitles: ["Elephant at Dusk", "Desert Geometry", "Fisherman at Dawn", "Night Market Colours"],
  },
  {
    name: "Tokyo Chronicles",
    description: "Kenji Watanabe documents Tokyo across four seasons — from the chaos of rush hour to the silence of 4am in Shinjuku.",
    photographerName: "Kenji Watanabe",
    coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    photoTitles: ["Black & White Tokyo", "Quiet Streets of Kyoto", "Rain on Glass"],
  },
  {
    name: "The Architecture of Europe",
    description: "Lorenzo Ricci turns his Nikon on the built environment — from Brutalist civic blocks to Gothic cathedrals and terracotta hillsides.",
    photographerName: "Lorenzo Ricci",
    coverImageUrl: "https://images.unsplash.com/photo-1466354424719-343280fe118b?w=800",
    photoTitles: ["Gothic Vaulting", "Brutalist Symmetry", "Terracotta Rooftops", "Geometric Light"],
  },
  {
    name: "Night Sky Atlas",
    description: "Carlos Mendez has spent three years mapping the darkest skies — from the Atacama to the Sahara — in pursuit of the Milky Way.",
    photographerName: "Carlos Mendez",
    coverImageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    photoTitles: ["Milky Way Arch", "Salt Flats Mirror", "City Lights from Above"],
  },
];

const SEED_COMMENTS: Array<{ photoTitle: string; authorName: string; body: string }> = [
  { photoTitle: "Milky Way Arch", authorName: "Elena Vasquez", body: "The tracking and stacking work here is flawless. What was your sky darkness (Bortle scale)?" },
  { photoTitle: "Milky Way Arch", authorName: "Ingrid Bjornsson", body: "Absolute masterpiece. The foreground rock texture against the galactic core — perfect." },
  { photoTitle: "Milky Way Arch", authorName: "Sofia Andersen", body: "I can feel the cold desert night looking at this. Incredible patience." },
  { photoTitle: "Elephant at Dusk", authorName: "Kenji Watanabe", body: "The way Kilimanjaro fades into the background is extraordinary. What conditions did you wait for?" },
  { photoTitle: "Elephant at Dusk", authorName: "Yuki Tanaka", body: "This silhouette game is unreal. The sky gradation from orange to violet is perfect." },
  { photoTitle: "Salt Flats Mirror", authorName: "Priya Sharma", body: "I've seen hundreds of salt flat shots — this is the first one that actually feels infinite." },
  { photoTitle: "Salt Flats Mirror", authorName: "Lorenzo Ricci", body: "The sky/ground transition is invisible. How long after the rain was this taken?" },
  { photoTitle: "Eagle in Flight", authorName: "Marcus Chen", body: "600mm at f/5.6 and still pin-sharp at 1/4000. The AF performance on the A9 III really shows." },
  { photoTitle: "Eagle in Flight", authorName: "Nathalie Dupont", body: "Every single feather visible. This must have taken days of positioning." },
  { photoTitle: "Black & White Tokyo", authorName: "Amara Diallo", body: "The Leica M11 Monochrom tonal range is just incomparable here. Beautiful." },
  { photoTitle: "Black & White Tokyo", authorName: "Carlos Mendez", body: "Timing this shot in Shinjuku must've been chaos — but it reads as perfectly composed." },
  { photoTitle: "Macro World", authorName: "Elena Vasquez", body: "Each droplet is a lens. The nested reflections make this something else entirely." },
  { photoTitle: "Macro World", authorName: "Sofia Andersen", body: "You must have used a focus rail for this? The depth of field management is surgical." },
  { photoTitle: "Desert Geometry", authorName: "Kenji Watanabe", body: "The raking light reveals micro-texture in the sand I've never seen photographed this well." },
  { photoTitle: "Golden Hour in the Alps", authorName: "Ingrid Bjornsson", body: "I was in the Alps last summer. Never got light like this. Amazing planning." },
  { photoTitle: "Quiet Streets of Kyoto", authorName: "Priya Sharma", body: "The paper lanterns at dawn — that warm glow against the cool blue morning air. Perfect exposure." },
  { photoTitle: "Forest Light", authorName: "Lorenzo Ricci", body: "God rays done right — not over-processed. The restraint here is what makes it work." },
  { photoTitle: "Aerial Coastline", authorName: "Yuki Tanaka", body: "The coral reef gradient from turquoise to deep jade is almost unreal. What altitude was this?" },
  { photoTitle: "Window Light Portrait", authorName: "Marcus Chen", body: "No reflectors, no flash — just the room. This is what understanding light really means." },
  { photoTitle: "Gothic Vaulting", authorName: "Nathalie Dupont", body: "Looking straight up and keeping the geometry perfectly symmetric — exceptional technique." },
  { photoTitle: "Underwater Serenity", authorName: "Elena Vasquez", body: "The light shafts look like something from a cathedral. Nature's architecture at its finest." },
  { photoTitle: "Underwater Serenity", authorName: "Yuki Tanaka", body: "The housing setup for Sony underwater shoots is notoriously tricky. This is pristine." },
  { photoTitle: "Mist Over the Valley", authorName: "Carlos Mendez", body: "Fog photography is all about patience. This must have been a very early morning." },
  { photoTitle: "Concrete & Sky", authorName: "Lorenzo Ricci", body: "Tokyo's infrastructure as art — you've found the beauty in the utilitarian. Impressive." },
  { photoTitle: "Lone Surfer", authorName: "Ingrid Bjornsson", body: "400mm at 1/3200 — that timing to catch the lip of the wave perfectly is extraordinary." },
  { photoTitle: "Waterfall Veil", authorName: "Marcus Chen", body: "The long exposure silk effect with that rock texture foreground. Faroe Islands never disappoints." },
  { photoTitle: "Harvest Moon Rising", authorName: "Priya Sharma", body: "The amber of that moon against the violet sky — the timing to catch the moon at this size is surgical." },
  { photoTitle: "Dunes Before Dark", authorName: "Kenji Watanabe", body: "The last light on the Namib dunes creates these incredible ridge shadows. No filter needed." },
  { photoTitle: "Morning Tea Ritual", authorName: "Sofia Andersen", body: "The steam catch at 85mm f/1.8 is perfect — soft but not mushy. Beautiful documentary moment." },
  { photoTitle: "Spice Market", authorName: "Marcus Chen", body: "The saturated yellow turmeric against the deep reds — this is colour theory in practice." },
  { photoTitle: "Fisherman at Dawn", authorName: "Amara Diallo", body: "The silhouette against that golden haze is almost painterly. Stunning patience for the moment." },
  { photoTitle: "Hands at Work", authorName: "Priya Sharma", body: "The intimacy of craft captured mid-throw. You can almost feel the clay's weight." },
  { photoTitle: "Ice Crystals", authorName: "Elena Vasquez", body: "The MP-E 65 is such an unforgiving lens — making this level of sharpness at max magnification is impressive." },
  { photoTitle: "Lone Surfer", authorName: "Yuki Tanaka", body: "The scale of the swell against that tiny figure is what makes this image work so powerfully." },
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
      await db.delete(seriesTable);
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
        isPotdPinned: (p as typeof p & { isPotdPinned?: boolean }).isPotdPinned ?? false,
        camera: p.camera,
        lens: p.lens,
        aperture: p.aperture,
        shutterSpeed: p.shutterSpeed,
        iso: p.iso,
        focalLength: p.focalLength,
        license: "cc0",
        status: (p as typeof p & { status?: string }).status ?? "published",
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

    let seriesCount = 0;
    for (const s of SEED_SERIES) {
      const inserted = await db.insert(seriesTable).values({
        name: s.name,
        description: s.description,
        photographerName: s.photographerName,
        coverImageUrl: s.coverImageUrl,
      }).returning({ id: seriesTable.id });
      const seriesId = inserted[0]!.id;
      seriesCount++;
      let position = 1;
      for (const title of s.photoTitles) {
        const photoId = photoIdMap.get(title);
        if (!photoId) continue;
        await db.update(photosTable)
          .set({ seriesId, seriesPosition: position })
          .where(eq(photosTable.id, photoId));
        position++;
      }
    }

    let commentCount = 0;
    for (const c of SEED_COMMENTS) {
      const photoId = photoIdMap.get(c.photoTitle);
      if (!photoId) continue;
      await db.insert(commentsTable).values({
        photoId,
        authorId: null,
        authorName: c.authorName,
        body: c.body,
      });
      commentCount++;
    }

    res.json({
      ok: true,
      photos: SEED_PHOTOS.length,
      collections: SEED_COLLECTIONS.length,
      series: seriesCount,
      comments: commentCount,
      wiped: force && existing > 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Seed failed", details: String(err) });
  }
});

export default router;

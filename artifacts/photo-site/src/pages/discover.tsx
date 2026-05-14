import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Lightbox } from "@/components/lightbox";
import { Heart, Download, Eye, Calendar, Star, ArrowRight, Shuffle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DAILY_THEMES = [
  "Into the Quiet",
  "Golden Ratio",
  "Shadow & Light",
  "The Human Condition",
  "Borrowed Silence",
  "Urban Solitude",
  "After the Rain",
];

function getDailyTheme() {
  const day = Math.floor(Date.now() / 86400000);
  return DAILY_THEMES[day % DAILY_THEMES.length] ?? DAILY_THEMES[0];
}

function getDailyPhotos(photos: Photo[]): Photo[] {
  if (!photos.length) return [];
  const day = Math.floor(Date.now() / 86400000);
  const seed = (n: number) => { const x = Math.sin(n + day) * 10000; return x - Math.floor(x); };
  const scored = photos.map((p, i) => ({ photo: p, score: seed(i * 7) + (p.isFeatured ? 0.3 : 0) }));
  return scored.sort((a, b) => b.score - a.score).slice(0, 8).map(s => s.photo);
}

function EditorsNote() {
  const today = new Date();
  return (
    <div className="border-l-2 border-foreground/20 pl-6 py-1 mb-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Editor's Note · {format(today, "MMMM d, yyyy")}</p>
      <p className="font-serif text-lg leading-relaxed text-muted-foreground max-w-xl">
        "Each day we hand-select eight photographs that we believe deserve a moment of your undivided attention.
        Today's edit explores <em className="text-foreground not-italic">{getDailyTheme()}</em> — a thread that ties
        these images together in ways words struggle to capture."
      </p>
      <p className="text-xs text-muted-foreground mt-3">— The Affuaa Curation Team</p>
    </div>
  );
}

function HeroPhoto({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  return (
    <div className="relative group cursor-pointer mb-2" onClick={onOpen}>
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{photo.likes}</span>
            <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{photo.downloads}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{photo.views ?? 0}</span>
          </div>
        </div>
      </div>
      {photo.isFeatured && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-amber-300">
          <Star className="w-3 h-3 fill-amber-300" /> Editor's Pick
        </div>
      )}
    </div>
  );
}

function PhotoCaption({ photo }: { photo: Photo }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-serif text-lg truncate">{photo.title}</h3>
        <Link
          href={`/profile/${encodeURIComponent(photo.photographerName)}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {photo.photographerName}
        </Link>
      </div>
      <Link
        href={`/photos/${photo.id}`}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1"
        onClick={e => e.stopPropagation()}
      >
        View <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function GridPhoto({ photo, onOpen, rank }: { photo: Photo; onOpen: () => void; rank: number }) {
  return (
    <div className="group">
      <div className="relative cursor-pointer overflow-hidden mb-2" onClick={onOpen}>
        <div className="aspect-[4/3]">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="absolute top-3 left-3 w-6 h-6 bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-muted-foreground">
          {String(rank).padStart(2, "0")}
        </div>
      </div>
      <PhotoCaption photo={photo} />
    </div>
  );
}

export function Discover() {
  const { data, isLoading } = useListPhotos({ limit: 50 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dailyPhotos, setDailyPhotos] = useState<Photo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (data?.photos) {
      setDailyPhotos(getDailyPhotos(data.photos));
    }
  }, [data, refreshKey]);

  const hero = dailyPhotos[0] ?? null;
  const grid = dailyPhotos.slice(1);
  const today = new Date();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {format(today, "EEEE, MMMM d, yyyy")}
            </p>
            <h1 className="font-serif text-5xl leading-tight">
              Today's Edit
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-serif italic">{getDailyTheme()}</p>
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-4 py-2 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex-shrink-0"
            title="Shuffle today's selection"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
        </div>

        <EditorsNote />

        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="w-full aspect-[16/9]" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-full aspect-[4/3]" />)}
            </div>
          </div>
        ) : dailyPhotos.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            <p className="font-serif text-xl">No photographs available today.</p>
            <Link href="/photos" className="text-sm mt-3 inline-block hover:text-foreground transition-colors">
              Browse the full gallery →
            </Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            {hero && (
              <div className="mb-10">
                <HeroPhoto photo={hero} onOpen={() => setLightboxIndex(0)} />
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Photograph #01</span>
                  </div>
                  <PhotoCaption photo={hero} />
                </div>
              </div>
            )}

            <div className="border-t border-border/40 my-10" />

            {/* Grid of 7 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {grid.map((photo, i) => (
                <GridPhoto
                  key={photo.id}
                  photo={photo}
                  rank={i + 2}
                  onOpen={() => setLightboxIndex(i + 1)}
                />
              ))}
            </div>

            <div className="border-t border-border/40 my-12" />

            {/* Footer CTA */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">That's all for today. New edit tomorrow at midnight.</p>
              <div className="flex items-center gap-4 justify-center">
                <Link
                  href="/photos"
                  className="px-6 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity"
                >
                  Explore Full Gallery
                </Link>
                <Link
                  href="/collections"
                  className="px-6 py-2.5 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Collections
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {lightboxIndex !== null && dailyPhotos.length > 0 && (
        <Lightbox
          photos={dailyPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}

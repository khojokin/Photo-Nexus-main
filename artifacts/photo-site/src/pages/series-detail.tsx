import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, ArrowLeft, ChevronLeft, ChevronRight,
  Grid3x3, Film, User, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo } from "@workspace/api-client-react";

interface Series {
  id: number;
  name: string;
  description: string | null;
  photographerName: string;
  coverImageUrl: string | null;
  createdAt: string;
  photoCount?: number;
}

function Filmstrip({
  photos,
  currentIndex,
  onSelect,
}: {
  photos: Photo[];
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = thumbRefs.current[currentIndex];
    if (el && stripRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentIndex]);

  return (
    <div className="border-t border-border/40 bg-black/80 px-4 py-3">
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent"
      >
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            ref={(el) => { thumbRefs.current[i] = el; }}
            onClick={() => onSelect(i)}
            className={cn(
              "flex-shrink-0 w-16 h-12 overflow-hidden border-2 transition-all",
              i === currentIndex
                ? "border-white opacity-100 scale-105"
                : "border-transparent opacity-40 hover:opacity-70"
            )}
          >
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [series, setSeries] = useState<Series | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"sequential" | "grid">("sequential");
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/series/${id}`)
      .then((r) => r.json())
      .then((d: { series: Series; photos: Photo[] }) => {
        setSeries(d.series);
        setPhotos(d.photos ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const prev = useCallback(() => {
    setImgLoaded(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setImgLoaded(false);
    setCurrentIndex((i) => Math.min(photos.length - 1, i + 1));
  }, [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const currentPhoto = photos[currentIndex] ?? null;

  if (loading) {
    return (
      <Layout>
        <div className="h-screen flex flex-col">
          <div className="container mx-auto px-4 pt-8 pb-4">
            <Skeleton className="h-5 w-32 mb-8" />
            <Skeleton className="h-10 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex-1 bg-black flex items-center justify-center">
            <Skeleton className="w-full max-w-3xl h-[50vh]" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!series) {
    return (
      <Layout>
        <div className="py-32 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-20" />
          <p className="font-serif text-xl">Series not found.</p>
          <Link href="/series" className="text-sm mt-4 block underline underline-offset-2">Back to Series</Link>
        </div>
      </Layout>
    );
  }

  if (photos.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Link href="/series" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Series
          </Link>
          <h1 className="text-4xl font-serif mb-3">{series.name}</h1>
          <Link href={`/profile/${encodeURIComponent(series.photographerName)}`} className="text-muted-foreground hover:text-foreground transition-colors">{series.photographerName}</Link>
          {series.description && <p className="text-muted-foreground mt-4 max-w-2xl">{series.description}</p>}
          <div className="py-20 text-center border border-dashed border-border mt-12 text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No photos in this series yet.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Series header ─────────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-muted/5">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href="/series"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Series
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest mb-2">
                <BookOpen className="w-3 h-3" /> Photo Series
              </div>
              <h1 className="text-3xl md:text-4xl font-serif mb-1">{series.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Link
                  href={`/profile/${encodeURIComponent(series.photographerName)}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> {series.photographerName}
                </Link>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-sm text-muted-foreground">
                  {photos.length} photograph{photos.length !== 1 ? "s" : ""}
                </span>
              </div>
              {series.description && (
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">{series.description}</p>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 border border-border/50 p-0.5 bg-muted/10">
              <button
                onClick={() => setViewMode("sequential")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "sequential"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Film className="w-3.5 h-3.5" /> Sequential
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "grid"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 className="w-3.5 h-3.5" /> Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "sequential" ? (
        /* ── Cinematic sequential viewer ────────────────────────── */
        <div className="flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>
          {/* Main photo area */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden"
            style={{ minHeight: "60vh" }}>
            {currentPhoto && (
              <>
                <img
                  key={currentPhoto.id}
                  src={currentPhoto.imageUrl}
                  alt={currentPhoto.title}
                  onLoad={() => setImgLoaded(true)}
                  className={cn(
                    "max-w-full max-h-[70vh] object-contain transition-opacity duration-300 mx-auto",
                    imgLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  </div>
                )}

                {/* Prev button */}
                <button
                  onClick={prev}
                  disabled={currentIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white transition-all border border-white/10 hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Next button */}
                <button
                  onClick={next}
                  disabled={currentIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white transition-all border border-white/10 hover:border-white/30 disabled:opacity-20 disabled:cursor-not-allowed"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Position counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white/70 text-xs font-mono tracking-widest backdrop-blur-sm border border-white/10">
                  {currentIndex + 1} / {photos.length}
                </div>

                {/* Photo title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
                  <Link
                    href={`/photos/${currentPhoto.id}`}
                    className="text-white font-serif text-xl hover:text-white/70 transition-colors"
                  >
                    {currentPhoto.title}
                  </Link>
                  <p className="text-white/50 text-xs mt-1">
                    ← → arrow keys to navigate
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Filmstrip */}
          <Filmstrip
            photos={photos}
            currentIndex={currentIndex}
            onSelect={(i) => { setImgLoaded(false); setCurrentIndex(i); }}
          />
        </div>
      ) : (
        /* ── Grid view ──────────────────────────────────────────── */
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => { setCurrentIndex(i); setViewMode("sequential"); setImgLoaded(false); }}
                className="group relative overflow-hidden aspect-square bg-muted border border-border/40 hover:border-border transition-colors"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 flex items-center justify-center text-white text-[10px] font-mono">
                  {i + 1}
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs truncate">{photo.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
